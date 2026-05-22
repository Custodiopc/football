import type { Career, Lineup } from './index';

// ── Mensagens trocadas via DataChannel ───────────────────────

export type RoomMessage =
  | { type: 'STATE_UPDATE'; payload: MultiCareer }
  | { type: 'SET_LINEUP'; payload: { player_nickname: string; lineup: Lineup } }
  | { type: 'PLAYER_JOINED'; payload: { nickname: string; team_id: number | null } }
  | { type: 'PLAYER_LEFT'; payload: { nickname: string } }
  | { type: 'CHAT'; payload: { from: string; text: string; timestamp: number } }
  | { type: 'HOST_QUIT'; payload: Record<string, never> }
  | { type: 'KICK'; payload: { nickname: string } }
  | { type: 'ROUND_RESULT'; payload: import('../lib/simulation/engine').UserMatchSummary & { team_id: number } };

// ── Mensagens de sinalização (Supabase Realtime) ─────────────

export type SignalingMessage =
  | { type: 'OFFER';         from_peer_id: string; to_peer_id: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ANSWER';        from_peer_id: string; to_peer_id: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ICE_CANDIDATE'; from_peer_id: string; to_peer_id: string; candidate: RTCIceCandidateInit }
  | { type: 'HOST_PEER_ID';  peer_id: string }
  | { type: 'REQUEST_HOST_PEER_ID'; from_peer_id: string };

// ── Jogador na sala ──────────────────────────────────────────

export interface MultiPlayer {
  nickname: string;
  team_id: number | null;
  is_host: boolean;
  is_ai: boolean;
  is_connected: boolean;
  peer_id: string;
  lineup_submitted: boolean;
}

// ── Carreira multiplayer ─────────────────────────────────────

export interface MultiCareer extends Career {
  room_code: string;
  players: MultiPlayer[];
  is_multi: true;
}

// ── Mensagem de chat (para UI) ───────────────────────────────

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  is_system: boolean;
}

// ── Status de conexão ────────────────────────────────────────

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';
