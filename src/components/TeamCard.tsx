import { useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import type { Team, Player } from '../types';
import { getTeamOverall, getTopPlayersByTeam } from '../data';
import { contrastColor } from '../lib/utils';

interface TeamCardProps {
  team: Team;
  onClick?: (team: Team) => void;
  selected?: boolean;
}

export function TeamCard({ team, onClick, selected = false }: TeamCardProps) {
  const [hovered, setHovered] = useState(false);
  const overall = getTeamOverall(team.id);
  const topPlayers: Player[] = getTopPlayersByTeam(team.id, 5);

  const badgeBg = team.primary_color;
  const badgeText = contrastColor(badgeBg);

  return (
    <div
      onClick={() => onClick?.(team)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      role="button"
      className={[
        'relative cursor-pointer rounded-2xl border transition-all duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-gold/60',
        selected
          ? 'border-gold shadow-lg shadow-gold/20 bg-gold/5'
          : 'border-white/8 bg-ink-card hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-0.5',
      ].join(' ')}
    >
      {/* Banner colorido com sigla */}
      <div
        className="flex h-20 items-center justify-center rounded-t-2xl"
        style={{ backgroundColor: badgeBg }}
      >
        <span
          className="font-retro text-4xl tracking-widest"
          style={{ color: badgeText }}
        >
          {team.short_name}
        </span>
      </div>

      {/* Faixa secundária fina */}
      <div className="h-1.5" style={{ backgroundColor: team.secondary_color }} />

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate font-body text-sm font-semibold text-cream">{team.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-cream/50">
          <MapPin size={11} />
          {team.city}, {team.state}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <Star size={12} className="fill-gold text-gold" />
          <span className="font-retro text-base text-gold">{overall}</span>
          <span className="text-xs text-cream/40">force</span>
        </div>
      </div>

      {/* Preview de jogadores no hover/focus */}
      {hovered && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-white/10 bg-ink-card p-3 shadow-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/50">
            Top 5
          </p>
          <ul className="flex flex-col gap-1.5">
            {topPlayers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="rounded px-1 py-0.5 font-retro text-xs"
                    style={{ backgroundColor: badgeBg, color: badgeText }}
                  >
                    {p.position}
                  </span>
                  <span className="truncate text-cream/80">{p.name}</span>
                </span>
                <span className="shrink-0 font-retro text-sm text-gold">{p.force}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
