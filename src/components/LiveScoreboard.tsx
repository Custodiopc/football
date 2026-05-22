import { useEffect, useState } from 'react';
import { TeamBadge } from './TeamBadge';
import { getTeamById } from '../data';

interface LiveScoreboardProps {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  minute: number;
  isHalfTime: boolean;
  isFullTime: boolean;
}

function formatMinute(minute: number, isHalfTime: boolean, isFullTime: boolean): string {
  if (isFullTime)  return 'FIM';
  if (isHalfTime)  return 'INT';
  if (minute === 0) return '00\'';
  if (minute > 90)  return `90+${minute - 90}'`;
  if (minute === 45 || (minute > 45 && minute < 46)) return `45'`;
  return `${String(minute).padStart(2, '0')}'`;
}

export function LiveScoreboard({
  homeTeamId, awayTeamId,
  homeScore, awayScore,
  minute, isHalfTime, isFullTime,
}: LiveScoreboardProps) {
  const homeTeam = getTeamById(homeTeamId);
  const awayTeam = getTeamById(awayTeamId);

  const [homePulse, setHomePulse] = useState(false);
  const [awayPulse, setAwayPulse] = useState(false);
  const [prevHome, setPrevHome] = useState(homeScore);
  const [prevAway, setPrevAway] = useState(awayScore);

  useEffect(() => {
    if (homeScore > prevHome) {
      setHomePulse(true);
      setTimeout(() => setHomePulse(false), 600);
      setPrevHome(homeScore);
    }
  }, [homeScore, prevHome]);

  useEffect(() => {
    if (awayScore > prevAway) {
      setAwayPulse(true);
      setTimeout(() => setAwayPulse(false), 600);
      setPrevAway(awayScore);
    }
  }, [awayScore, prevAway]);

  const minDisplay = formatMinute(minute, isHalfTime, isFullTime);
  const minColor = isFullTime ? '#f5d020' : isHalfTime ? '#3b9adb' : '#f5f5f0';

  return (
    <div
      className="flex items-center justify-center gap-4 px-4 py-3"
      style={{
        background: 'linear-gradient(180deg, #0d1f36, #15304f)',
        borderBottom: '2px solid #1e3a5c',
        flexShrink: 0,
      }}
    >
      {/* Time da casa */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span
          className="font-bold text-right hidden sm:block"
          style={{ color: '#f5f5f0', fontSize: 14, minWidth: 80 }}
        >
          {homeTeam?.name ?? 'Casa'}
        </span>
        <span
          className="font-bold sm:hidden"
          style={{ color: '#f5f5f0', fontSize: 12 }}
        >
          {homeTeam?.short_name ?? 'CAS'}
        </span>
        {homeTeam && (
          <TeamBadge
            shortName={homeTeam.short_name}
            primaryColor={homeTeam.primary_color}
            size={36}
          />
        )}
      </div>

      {/* Placar central */}
      <div className="flex items-center gap-2">
        {/* Gols casa */}
        <span
          className="font-retro transition-all duration-300"
          style={{
            fontSize: 52,
            lineHeight: 1,
            color: homePulse ? '#f5d020' : '#f5f5f0',
            transform: homePulse ? 'scale(1.3)' : 'scale(1)',
            display: 'inline-block',
            minWidth: 36,
            textAlign: 'center',
          }}
        >
          {homeScore}
        </span>

        {/* Separador + minuto */}
        <div className="flex flex-col items-center" style={{ gap: 2 }}>
          <span
            className="font-retro"
            style={{ fontSize: 28, color: '#1e3a5c', lineHeight: 1 }}
          >
            ×
          </span>
          <span
            className="font-retro"
            style={{ fontSize: 16, color: minColor, letterSpacing: 1 }}
          >
            {minDisplay}
          </span>
        </div>

        {/* Gols fora */}
        <span
          className="font-retro transition-all duration-300"
          style={{
            fontSize: 52,
            lineHeight: 1,
            color: awayPulse ? '#f5d020' : '#f5f5f0',
            transform: awayPulse ? 'scale(1.3)' : 'scale(1)',
            display: 'inline-block',
            minWidth: 36,
            textAlign: 'center',
          }}
        >
          {awayScore}
        </span>
      </div>

      {/* Time visitante */}
      <div className="flex items-center gap-2 flex-1 justify-start">
        {awayTeam && (
          <TeamBadge
            shortName={awayTeam.short_name}
            primaryColor={awayTeam.primary_color}
            size={36}
          />
        )}
        <span
          className="font-bold hidden sm:block"
          style={{ color: '#f5f5f0', fontSize: 14, minWidth: 80 }}
        >
          {awayTeam?.name ?? 'Fora'}
        </span>
        <span
          className="font-bold sm:hidden"
          style={{ color: '#f5f5f0', fontSize: 12 }}
        >
          {awayTeam?.short_name ?? 'FOR'}
        </span>
      </div>
    </div>
  );
}
