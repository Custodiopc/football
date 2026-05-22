import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import type { SignalingMessage } from '../../types/multi';

export type PresenceState = {
  nickname: string;
  peer_id: string;
  is_host: boolean;
  team_id: number | null;
};

type SignalingCallback = (msg: SignalingMessage) => void;
type PresenceCallback  = (presences: PresenceState[]) => void;
type JoinCallback      = (state: PresenceState) => void;
type LeaveCallback     = (state: PresenceState) => void;

/**
 * Serviço de sinalização via Supabase Realtime.
 * Responsável por:
 *   - Presence: quem está na sala
 *   - Broadcast: troca de SDP offers/answers/ICE candidates para WebRTC
 *   - Publicar o peer_id do host para que guests possam conectar
 */
export class SignalingService {
  private channel: RealtimeChannel | null = null;
  

  // ── Entrar na sala (host e guest usam o mesmo método) ────────
  async joinRoom(
    roomCode: string,
    presence: PresenceState,
    onSignaling: SignalingCallback,
    onPresenceSync: PresenceCallback,
    onJoin: JoinCallback,
    onLeave: LeaveCallback,
  ): Promise<RealtimeChannel> {
    

    const ch = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: presence.nickname } },
    });

    // Receber mensagens de sinalização WebRTC
    ch.on('broadcast', { event: 'signaling' }, ({ payload }) => {
      const msg = payload as SignalingMessage;
      // Só processa mensagens endereçadas a este peer (ou broadcasts globais)
      if (
        msg.type === 'HOST_PEER_ID' ||
        msg.type === 'REQUEST_HOST_PEER_ID' ||
        ('to_peer_id' in msg && msg.to_peer_id === presence.peer_id)
      ) {
        onSignaling(msg);
      }
    });

    // Presence: sync inicial
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<PresenceState>();
      const presences = Object.values(state).flat();
      onPresenceSync(presences);
    });

    // Presence: alguém entrou
    ch.on('presence', { event: 'join' }, ({ newPresences }) => {
      (newPresences as unknown as PresenceState[]).forEach((p) => onJoin(p));
    });

    // Presence: alguém saiu
    ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      (leftPresences as unknown as PresenceState[]).forEach((p) => onLeave(p));
    });

    await new Promise<void>((resolve, reject) => {
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR') reject(new Error('Falha ao entrar na sala'));
        if (status === 'TIMED_OUT') reject(new Error('Timeout ao entrar na sala'));
      });
    });

    // Registrar presence
    await ch.track(presence);

    this.channel = ch;
    return ch;
  }

  // ── Enviar mensagem de sinalização ──────────────────────────
  async send(msg: SignalingMessage): Promise<void> {
    if (!this.channel) return;
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: msg,
    });
  }

  // ── Atualizar presence (ex: quando escolhe time) ────────────
  async updatePresence(partial: Partial<PresenceState>): Promise<void> {
    if (!this.channel) return;
    await this.channel.track(partial);
  }

  // ── Desconectar ─────────────────────────────────────────────
  async leave(): Promise<void> {
    if (!this.channel) return;
    await this.channel.untrack();
    await supabase.removeChannel(this.channel);
    this.channel = null;
  }

  get isConnected(): boolean {
    return this.channel !== null;
  }
}
