import type { Match } from '../types';
import { getTeamById } from '../data';

interface MatchCalendarProps {
  matches: Match[];
  userTeamId: number;
  currentRound: number;
}

export function MatchCalendar({ matches, userTeamId, currentRound }: MatchCalendarProps) {
  const rounds = Array.from({ length: 38 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-2">
      {rounds.map((round) => {
        const userMatch = matches.find(
          (m) => m.round === round && (m.home_team_id === userTeamId || m.away_team_id === userTeamId)
        );
        if (!userMatch) return null;

        const isHome = userMatch.home_team_id === userTeamId;
        const oppId = isHome ? userMatch.away_team_id : userMatch.home_team_id;
        const opp = getTeamById(oppId);
        const played = userMatch.home_goals !== null;
        const ownGoals = played ? (isHome ? userMatch.home_goals! : userMatch.away_goals!) : null;
        const oppGoals = played ? (isHome ? userMatch.away_goals! : userMatch.home_goals!) : null;
        const isCurrent = round === currentRound;

        let result: 'W' | 'D' | 'L' | null = null;
        if (ownGoals !== null && oppGoals !== null) {
          result = ownGoals > oppGoals ? 'W' : ownGoals === oppGoals ? 'D' : 'L';
        }

        const resultColors = {
          W: 'text-green-400 bg-green-900/20',
          D: 'text-yellow-400 bg-yellow-900/20',
          L: 'text-red-400 bg-red-900/20',
        };

        return (
          <div
            key={round}
            className={[
              'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
              isCurrent ? 'border-gold/40 bg-gold/5' : 'border-white/6 bg-ink-card',
            ].join(' ')}
          >
            <span className={['w-8 shrink-0 font-retro text-lg', isCurrent ? 'text-gold' : 'text-cream/30'].join(' ')}>
              {round}
            </span>

            <div className="flex flex-1 items-center gap-2 text-sm">
              <span className={['font-semibold', isCurrent ? 'text-cream' : 'text-cream/70'].join(' ')}>
                {isHome ? 'x ' : ''}
                {opp?.short_name ?? '???'}
                {!isHome ? ' (F)' : ' (C)'}
              </span>
            </div>

            {played && result && ownGoals !== null && oppGoals !== null ? (
              <div className="flex items-center gap-2">
                <span className="font-retro text-lg text-cream">
                  {ownGoals} - {oppGoals}
                </span>
                <span className={['rounded px-2 py-0.5 text-xs font-bold', resultColors[result]].join(' ')}>
                  {result}
                </span>
              </div>
            ) : isCurrent ? (
              <span className="text-xs text-gold/70">Próximo</span>
            ) : (
              <span className="text-xs text-cream/20">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
