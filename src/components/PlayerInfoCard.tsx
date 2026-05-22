import { Bandage, Ban } from 'lucide-react';
import type { Player, PlayerState } from '../types';
import { POSITION_LABEL, SIDE_LABEL } from '../types';
import { formatHighlights, attrColor } from '../lib/simulation/playerAttributes';

interface PlayerInfoCardProps {
  player: Player;
  playerState?: PlayerState;
  currentRound: number;
}

export function PlayerInfoCard({ player, playerState, currentRound }: PlayerInfoCardProps) {
  const injured = playerState?.injury_until_round != null
    && currentRound <= (playerState.injury_until_round ?? 0);
  const suspended = playerState?.suspended_until_round != null
    && currentRound <= (playerState.suspended_until_round ?? 0);
  const yellows = playerState?.yellow_cards ?? 0;

  const highlights = formatHighlights(player);
  const forceColor = attrColor(player.force);

  return (
    <div
      className="rounded overflow-hidden"
      style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', fontSize: 12 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1.5"
        style={{ backgroundColor: '#15304f', borderBottom: '1px solid #1e3a5c' }}
      >
        <span className="font-semibold truncate" style={{ color: '#f5f5f0', maxWidth: 130, fontSize: 12 }}>
          {player.name}
        </span>
        <span className="font-bold shrink-0" style={{ color: forceColor, fontSize: 15 }}>
          F:{player.force}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-2 py-1" style={{ borderBottom: '1px solid #1e3a5c' }}>
        {injured && <Bandage size={13} style={{ color: '#ef4444' }} />}
        {suspended && <Ban size={13} style={{ color: '#ef4444' }} />}
        {yellows >= 2 && !suspended && (
          <span style={{ fontSize: 10, color: '#f5d020', fontWeight: 700 }}>🟨{yellows}</span>
        )}
        {!injured && !suspended && (
          <span style={{ fontSize: 10, color: '#4ade80' }}>OK</span>
        )}
      </div>

      {/* Info */}
      <div className="px-2 py-1.5" style={{ borderBottom: '1px solid #1e3a5c' }}>
        <div style={{ color: '#a8b8cc', fontSize: 11 }}>
          {POSITION_LABEL[player.position]} · {SIDE_LABEL[player.side]} · {player.age}a
        </div>
        {highlights !== '—' && (
          <div style={{ color: '#f5d020', fontSize: 11, marginTop: 1 }}>
            ⭐ {highlights}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-2 py-1.5">
        <div className="grid grid-cols-4" style={{ fontSize: 10, color: '#6b7c93', marginBottom: 2, textAlign: 'center' }}>
          <span></span><span>Gols</span><span>Ass.</span><span>Jogos</span>
        </div>
        <div className="grid grid-cols-4" style={{ fontSize: 11, textAlign: 'center' }}>
          <span style={{ color: '#a8b8cc', textAlign: 'left' }}>Temp.</span>
          <span style={{ color: '#f5f5f0' }}>{playerState?.goals_season ?? 0}</span>
          <span style={{ color: '#f5f5f0' }}>{playerState?.assists_season ?? 0}</span>
          <span style={{ color: '#f5f5f0' }}>{playerState?.games_season ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
