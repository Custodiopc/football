import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Lineup } from '../types';
import type {
  MultiCareer, MultiPlayer, RoomMessage,
  ChatMessage, ConnectionStatus,
} from '../types/multi';
import { SignalingService } from '../lib/multi/signaling';
import { HostPeerManager, GuestPeerManager } from '../lib/multi/peer';
import { generateAILineup } from '../lib/multi/ai-manager';
import { simulateRound } from '../lib/simulation/engine';
import { createCareer } from '../lib/career';
import type { Difficulty } from '../types';

// ── Helpers ───────────────────────────────────────────────────

function generateRoomCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`;
}

function systemMsg(text: string): ChatMessage {
  return { id: nanoid(), from: 'Sistema', text, timestamp: Date.now(), is_system: true };
}

// ── Interface ─────────────────────────────────────────────────

interface MultiState {
  role: 'host' | 'guest' | null;
  roomCode: string | null;
  connectionStatus: ConnectionStatus;
  myNickname: string;
  myPeerId: string;
  career: MultiCareer | null;
  chat: ChatMessage[];

  // internals (não serializáveis — usar getState() para acessar)
  _sig: SignalingService | null;
  _hp: HostPeerManager | null;
  _gp: GuestPeerManager | null;
  _timers: Record<string, ReturnType<typeof setTimeout>>;

  // Ações públicas
  hostCreateRoom: (nickname: string, difficulty: Difficulty) => Promise<string>;
  hostStartGame: () => void;
  hostSimulateRound: () => void;
  hostKickPlayer: (nickname: string) => void;
  guestJoinRoom: (roomCode: string, nickname: string) => Promise<void>;
  guestSetTeam: (teamId: number) => void;
  guestSubmitLineup: (lineup: Lineup) => void;
  sendChat: (text: string) => void;
  leaveRoom: () => Promise<void>;
  setMyNickname: (n: string) => void;
}

// ── Helpers internos (closures que usam get/set) ──────────────

function buildHostHandlers(get: () => MultiState, set: (partial: Partial<MultiState>) => void) {
  function handleMsg(fromPeerId: string, msg: RoomMessage) {
    const s = get();
    if (!s.career || !s._hp) return;
    if (msg.type === 'SET_LINEUP') {
      const { player_nickname, lineup } = msg.payload;
      const lineups = s.career.lineups.filter((l) => l.round !== lineup.round);
      lineups.push(lineup);
      const players = s.career.players.map((p) =>
        p.nickname === player_nickname ? { ...p, lineup_submitted: true } : p
      );
      const updated = { ...s.career, lineups, players };
      set({ career: updated });
      s._hp.broadcast({ type: 'STATE_UPDATE', payload: updated });
    } else if (msg.type === 'PLAYER_JOINED') {
      const { nickname, team_id } = msg.payload;
      const players = s.career.players.map((p) =>
        p.peer_id === fromPeerId ? { ...p, is_connected: true, team_id: team_id ?? p.team_id } : p
      );
      // Se ainda não existe, adiciona
      const exists = s.career.players.some((p) => p.peer_id === fromPeerId);
      const finalPlayers = exists ? players : [
        ...players,
        { nickname, team_id, is_host: false, is_ai: false, is_connected: true, peer_id: fromPeerId, lineup_submitted: false } as MultiPlayer,
      ];
      const updated = { ...s.career, players: finalPlayers };
      set({ career: updated });
      s._hp.broadcast({ type: 'STATE_UPDATE', payload: updated });
    } else if (msg.type === 'CHAT') {
      const chatMsg: ChatMessage = { id: nanoid(), from: msg.payload.from, text: msg.payload.text, timestamp: msg.payload.timestamp, is_system: false };
      set({ chat: [...get().chat, chatMsg] });
      s._hp.broadcast({ type: 'CHAT', payload: msg.payload });
    }
  }

  function handleDisconnect(guestPeerId: string) {
    const s = get();
    if (!s.career) return;
    const player = s.career.players.find((p) => p.peer_id === guestPeerId);
    if (!player) return;
    const players = s.career.players.map((p) =>
      p.peer_id === guestPeerId ? { ...p, is_connected: false } : p
    );
    const updated = { ...s.career, players };
    set({ career: updated, chat: [...s.chat, systemMsg(`${player.nickname} desconectou (60s para reconexão)`)] });
    s._hp?.broadcast({ type: 'STATE_UPDATE', payload: updated });

    const timer = setTimeout(() => {
      const s2 = get();
      if (!s2.career) return;
      const still = s2.career.players.find((p) => p.peer_id === guestPeerId && !p.is_connected);
      if (still) {
        const aiPlayers = s2.career.players.map((p) =>
          p.peer_id === guestPeerId ? { ...p, is_ai: true } : p
        );
        const aiCareer = { ...s2.career, players: aiPlayers };
        set({ career: aiCareer, chat: [...get().chat, systemMsg(`${player.nickname}: IA assumiu o time`)] });
        s2._hp?.broadcast({ type: 'STATE_UPDATE', payload: aiCareer });
        const timers = { ...get()._timers };
        delete timers[guestPeerId];
        set({ _timers: timers });
      }
    }, 60_000);

    set({ _timers: { ...s._timers, [guestPeerId]: timer } });
  }

  return { handleMsg, handleDisconnect };
}

function buildGuestHandlers(get: () => MultiState, set: (partial: Partial<MultiState>) => void) {
  function handleMsg(msg: RoomMessage) {
    const s = get();
    if (msg.type === 'STATE_UPDATE') {
      set({ career: msg.payload });
    } else if (msg.type === 'CHAT') {
      const chatMsg: ChatMessage = { id: nanoid(), from: msg.payload.from, text: msg.payload.text, timestamp: msg.payload.timestamp, is_system: false };
      set({ chat: [...s.chat, chatMsg] });
    } else if (msg.type === 'HOST_QUIT') {
      set({ connectionStatus: 'failed', chat: [...s.chat, systemMsg('O anfitrião encerrou o jogo.')] });
    } else if (msg.type === 'KICK') {
      if (msg.payload.nickname === s.myNickname) {
        set({ connectionStatus: 'failed', chat: [...s.chat, systemMsg('Você foi removido da sala.')] });
      }
    }
  }
  return { handleMsg };
}

// ── Store ─────────────────────────────────────────────────────

export const useMultiStore = create<MultiState>((set, get) => {
  const hostHandlers = buildHostHandlers(get, set);
  const guestHandlers = buildGuestHandlers(get, set);

  return {
    role: null, roomCode: null, connectionStatus: 'idle',
    myNickname: '', myPeerId: '', career: null, chat: [],
    _sig: null, _hp: null, _gp: null, _timers: {},

    setMyNickname: (n) => set({ myNickname: n }),

    // ── HOST: criar sala ───────────────────────────────────────
    hostCreateRoom: async (nickname, difficulty) => {
      set({ connectionStatus: 'connecting', myNickname: nickname });
      const roomCode = generateRoomCode();

      const hp = new HostPeerManager();
      const peerId = await hp.start();

      const baseCareer = createCareer({ nickname, team_id: 1, difficulty });
      const hostPlayer: MultiPlayer = {
        nickname, team_id: null, is_host: true,
        is_ai: false, is_connected: true, peer_id: peerId, lineup_submitted: false,
      };
      const career: MultiCareer = { ...baseCareer, room_code: roomCode, players: [hostPlayer], is_multi: true };

      const sig = new SignalingService();
      await sig.joinRoom(
        roomCode,
        { nickname, peer_id: peerId, is_host: true, team_id: null },
        () => {},
        (presences) => {
          const s = get();
          if (!s.career) return;
          const updatedPlayers = s.career.players.map((p) => ({
            ...p,
            is_connected: p.is_host || presences.some((pr) => pr.nickname === p.nickname),
          }));
          const updated = { ...s.career, players: updatedPlayers };
          set({ career: updated });
          hp.broadcast({ type: 'STATE_UPDATE', payload: updated });
        },
        (joined) => {
          if (joined.nickname === nickname) return;
          const s = get();
          if (!s.career) return;
          if (s.career.players.some((p) => p.nickname === joined.nickname)) return;
          const newP: MultiPlayer = {
            nickname: joined.nickname, team_id: joined.team_id,
            is_host: false, is_ai: false, is_connected: false,
            peer_id: joined.peer_id, lineup_submitted: false,
          };
          const updated = { ...s.career, players: [...s.career.players, newP] };
          set({ career: updated, chat: [...get().chat, systemMsg(`${joined.nickname} entrou na sala`)] });
        },
        (left) => {
          set({ chat: [...get().chat, systemMsg(`${left.nickname} saiu da sala`)] });
        },
      );

      await sig.send({ type: 'HOST_PEER_ID', peer_id: peerId });

      hp.onMessage((fromPeerId, msg) => hostHandlers.handleMsg(fromPeerId, msg));
      hp.onGuestDisconnect((pid) => hostHandlers.handleDisconnect(pid));

      set({ role: 'host', roomCode, myPeerId: peerId, career, connectionStatus: 'connected', _sig: sig, _hp: hp });
      return roomCode;
    },

    hostStartGame: () => {
      const s = get();
      if (!s.career || s.role !== 'host') return;
      s._hp?.broadcast({ type: 'STATE_UPDATE', payload: s.career });
    },

    hostSimulateRound: () => {
      const s = get();
      if (!s.career || s.role !== 'host') return;
      const round = s.career.current_round;

      // Gerar lineups de IA
      const updatedLineups = [...s.career.lineups];
      for (const player of s.career.players) {
        if ((player.is_ai || !player.is_connected) && player.team_id !== null) {
          const already = updatedLineups.some((l) => l.round === round);
          if (!already) {
            updatedLineups.push(generateAILineup(player.team_id, s.career.player_states, round));
          }
        }
      }

      // Simular com o time do host como perspectiva (inclui todos os 380 jogos)
      const hostPlayer = s.career.players.find((p) => p.is_host);
      const teamId = hostPlayer?.team_id ?? s.career.players[0]?.team_id ?? 1;
      const hostLineup = updatedLineups.find((l) => l.round === round);
      if (!hostLineup) return;

      try {
        const output = simulateRound({ ...s.career, team_id: teamId }, round, hostLineup);
        const updatedMatches = s.career.matches.map((m) => {
          const found = output.matches_with_results.find(
            (r) => r.round === m.round && r.home_team_id === m.home_team_id && r.away_team_id === m.away_team_id
          );
          return found ?? m;
        });
        const players = s.career.players.map((p) => ({ ...p, lineup_submitted: false }));
        const finalCareer: MultiCareer = {
          ...s.career,
          matches: updatedMatches,
          lineups: updatedLineups,
          standings: output.updated_standings,
          player_states: output.updated_player_states,
          players,
          current_round: round + 1,
          status: round >= 38 ? 'finished' : 'active',
        };
        set({ career: finalCareer });
        s._hp?.broadcast({ type: 'STATE_UPDATE', payload: finalCareer });
      } catch (e) {
        console.error('simulateRound error:', e);
      }
    },

    hostKickPlayer: (nickname) => {
      const s = get();
      if (!s.career || s.role !== 'host') return;
      const player = s.career.players.find((p) => p.nickname === nickname);
      if (!player) return;
      s._hp?.sendTo(player.peer_id, { type: 'KICK', payload: { nickname } });
      const players = s.career.players.filter((p) => p.nickname !== nickname);
      const updated = { ...s.career, players };
      set({ career: updated, chat: [...s.chat, systemMsg(`${nickname} foi removido`)] });
      s._hp?.broadcast({ type: 'STATE_UPDATE', payload: updated });
    },

    // ── GUEST: entrar na sala ──────────────────────────────────
    guestJoinRoom: async (roomCode, nickname) => {
      set({ connectionStatus: 'connecting', myNickname: nickname });

      const gp = new GuestPeerManager();
      const peerId = await gp.init();

      const sig = new SignalingService();
      let hostPeerId = '';

      await sig.joinRoom(
        roomCode,
        { nickname, peer_id: peerId, is_host: false, team_id: null },
        (sigMsg) => { if (sigMsg.type === 'HOST_PEER_ID') hostPeerId = sigMsg.peer_id; },
        () => {}, () => {}, () => {},
      );

      await sig.send({ type: 'REQUEST_HOST_PEER_ID', from_peer_id: peerId });

      // Aguardar peer_id do host
      if (!hostPeerId) {
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (hostPeerId) { clearInterval(interval); resolve(); }
          }, 200);
          setTimeout(() => { clearInterval(interval); resolve(); }, 8_000);
        });
      }
      if (!hostPeerId) throw new Error('Sala não encontrada ou já foi encerrada.');

      await gp.connectToHost(hostPeerId);
      gp.send({ type: 'PLAYER_JOINED', payload: { nickname, team_id: null } });

      gp.onMessage((msg) => guestHandlers.handleMsg(msg));
      gp.onDisconnect(() => {
        set({ connectionStatus: 'reconnecting', chat: [...get().chat, systemMsg('Conexão perdida. Reconectando...')] });
        setTimeout(async () => {
          try {
            await gp.connectToHost(hostPeerId);
            set({ connectionStatus: 'connected' });
            gp.send({ type: 'PLAYER_JOINED', payload: { nickname, team_id: get().career?.players.find(p => p.nickname === nickname)?.team_id ?? null } });
          } catch {
            set({ connectionStatus: 'failed' });
          }
        }, 2_000);
      });

      set({ role: 'guest', roomCode, myPeerId: peerId, connectionStatus: 'connected', _sig: sig, _gp: gp });
    },

    guestSetTeam: (teamId) => {
      const s = get();
      if (!s._gp || !s.myNickname) return;
      s._gp.send({ type: 'PLAYER_JOINED', payload: { nickname: s.myNickname, team_id: teamId } });
      if (s.career) {
        const players = s.career.players.map((p) =>
          p.nickname === s.myNickname ? { ...p, team_id: teamId } : p
        );
        set({ career: { ...s.career, players } });
      }
      s._sig?.updatePresence({ team_id: teamId });
    },

    guestSubmitLineup: (lineup) => {
      const s = get();
      if (!s._gp || !s.myNickname) return;
      s._gp.send({ type: 'SET_LINEUP', payload: { player_nickname: s.myNickname, lineup } });
      if (s.career) {
        const players = s.career.players.map((p) =>
          p.nickname === s.myNickname ? { ...p, lineup_submitted: true } : p
        );
        set({ career: { ...s.career, players } });
      }
    },

    sendChat: (text) => {
      const s = get();
      if (!s.myNickname || !text.trim()) return;
      const payload = { from: s.myNickname, text: text.trim(), timestamp: Date.now() };
      if (s.role === 'host') {
        set({ chat: [...s.chat, { id: nanoid(), ...payload, is_system: false }] });
        s._hp?.broadcast({ type: 'CHAT', payload });
      } else {
        s._gp?.send({ type: 'CHAT', payload });
      }
    },

    leaveRoom: async () => {
      const s = get();
      for (const t of Object.values(s._timers)) clearTimeout(t);
      if (s.role === 'host') {
        s._hp?.broadcast({ type: 'HOST_QUIT', payload: {} });
        s._hp?.shutdown();
      } else {
        s._gp?.shutdown();
      }
      await s._sig?.leave();
      set({ role: null, roomCode: null, connectionStatus: 'idle', career: null, chat: [], _sig: null, _hp: null, _gp: null, _timers: {} });
    },
  };
});
