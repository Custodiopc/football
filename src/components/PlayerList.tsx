import { useState } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';
import type { Player, PlayerState } from '../types';


interface PlayerListProps {
  players: Player[];
  playerStates: PlayerState[];
  currentRound: number;
  onPlayerClick?: (player: Player) => void;
  selectedIds?: number[];
  disabledIds?: number[];
  highlightIds?: number[];
}

const POSITIONS: string[] = ['ALL', 'G', 'Z', 'L', 'M', 'A'];

export function PlayerList({
  players,
  playerStates,
  currentRound,
  onPlayerClick,
  selectedIds = [],
  disabledIds = [],
  highlightIds = [],
}: PlayerListProps) {
  const [filter, setFilter] = useState<string>('ALL');

  const getState = (id: number) => playerStates.find((s) => s.player_id === id);

  const isInjured = (id: number) => {
    const s = getState(id);
    return s?.injury_until_round !== null && (s?.injury_until_round ?? 0) >= currentRound;
  };
  const isSuspended = (id: number) => {
    const s = getState(id);
    return s?.suspended_until_round !== null && (s?.suspended_until_round ?? 0) >= currentRound;
  };
  const getYellows = (id: number) => getState(id)?.yellow_cards ?? 0;

  const filtered = players
    .filter((p) => filter === 'ALL' || p.position === filter)
    .sort((a, b) => b.force - a.force);

  return (
    <div>
      {/* Filtro de posição */}
      <div className="mb-3 flex gap-1.5 flex-wrap">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={[
              'rounded-lg px-3 py-1 text-xs font-medium transition-all',
              filter === pos
                ? 'bg-gold text-ink'
                : 'bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream',
            ].join(' ')}
          >
            {pos === 'ALL' ? 'Todos' : pos === "ALL" ? "Todos" : pos}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-1.5">
        {filtered.map((p) => {
          const injured = isInjured(p.id);
          const suspended = isSuspended(p.id);
          const yellows = getYellows(p.id);
          const unavailable = injured || suspended;
          const isSelected = selectedIds.includes(p.id);
          const isDisabled = disabledIds.includes(p.id) || unavailable;
          const isHighlighted = highlightIds.includes(p.id);

          return (
            <button
              key={p.id}
              onClick={() => !isDisabled && onPlayerClick?.(p)}
              disabled={isDisabled && !isSelected}
              className={[
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                isSelected
                  ? 'border-gold/50 bg-gold/10'
                  : isHighlighted
                    ? 'border-blue-500/30 bg-blue-900/10'
                    : unavailable
                      ? 'border-white/4 bg-ink-card opacity-50'
                      : 'border-white/6 bg-ink-card hover:border-white/20 hover:bg-white/5',
                isDisabled && !isSelected ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {/* Posição */}
              <span className="w-8 shrink-0 rounded bg-white/8 px-1 py-0.5 text-center font-retro text-xs text-cream/60">
                {p.position}
              </span>

              {/* Nome */}
              <span className="flex-1 truncate text-sm font-medium text-cream">
                {p.name}
              </span>

              {/* Badges */}
              <div className="flex shrink-0 items-center gap-1.5">
                {injured && <AlertTriangle size={12} className="text-orange-400" />}
                {suspended && <Ban size={12} className="text-red-400" />}
                {yellows > 0 && !suspended && (
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-yellow-500/20 text-xs font-bold text-yellow-400">
                    {yellows}
                  </span>
                )}
                <span className="font-retro text-base text-gold">{p.force}</span>
                <span className="text-xs text-cream/30">({p.age})</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
