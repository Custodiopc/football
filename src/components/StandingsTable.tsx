import type { StandingsRow } from '../types';
import { getTeamById } from '../data';

interface StandingsTableProps {
  standings: StandingsRow[];
  userTeamId: number;
  compact?: boolean;
}

export function StandingsTable({ standings, userTeamId, compact = false }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 text-xs uppercase tracking-wider text-cream/40">
            <th className="py-2 pr-2 text-left w-6">#</th>
            <th className="py-2 text-left">Time</th>
            <th className="py-2 text-center">J</th>
            {!compact && <>
              <th className="py-2 text-center">V</th>
              <th className="py-2 text-center">E</th>
              <th className="py-2 text-center">D</th>
            </>}
            <th className="py-2 text-center">GP</th>
            <th className="py-2 text-center">GC</th>
            <th className="py-2 text-center">SG</th>
            <th className="py-2 text-center font-bold text-gold">P</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => {
            const pos = idx + 1;
            const team = getTeamById(row.team_id);
            const isUser = row.team_id === userTeamId;
            const sg = row.goals_for - row.goals_against;

            const zoneColor =
              pos <= 4  ? 'border-l-2 border-l-blue-500' :
              pos <= 6  ? 'border-l-2 border-l-green-600' :
              pos >= 17 ? 'border-l-2 border-l-red-600' : '';

            return (
              <tr
                key={row.team_id}
                className={[
                  'border-b border-white/5 transition-colors',
                  isUser ? 'bg-gold/5 text-cream' : 'text-cream/70 hover:bg-white/3',
                  zoneColor,
                ].join(' ')}
              >
                <td className="py-2 pr-2 font-retro text-base text-cream/50">{pos}</td>
                <td className="py-2">
                  <span className={['font-body text-sm', isUser ? 'font-semibold text-gold' : ''].join(' ')}>
                    {team?.short_name ?? '???'}
                  </span>
                  {!compact && (
                    <span className="ml-1.5 hidden text-xs text-cream/40 md:inline">
                      {team?.name}
                    </span>
                  )}
                </td>
                <td className="py-2 text-center tabular-nums">{row.played}</td>
                {!compact && <>
                  <td className="py-2 text-center tabular-nums text-green-400">{row.wins}</td>
                  <td className="py-2 text-center tabular-nums text-yellow-400">{row.draws}</td>
                  <td className="py-2 text-center tabular-nums text-red-400">{row.losses}</td>
                </>}
                <td className="py-2 text-center tabular-nums">{row.goals_for}</td>
                <td className="py-2 text-center tabular-nums">{row.goals_against}</td>
                <td className="py-2 text-center tabular-nums">{sg > 0 ? `+${sg}` : sg}</td>
                <td className="py-2 text-center font-retro text-base font-bold text-gold tabular-nums">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-cream/40">
        <span><span className="inline-block w-3 border-l-2 border-l-blue-500 mr-1" />Libertadores</span>
        <span><span className="inline-block w-3 border-l-2 border-l-green-600 mr-1" />Pré-Liber</span>
        <span><span className="inline-block w-3 border-l-2 border-l-red-600 mr-1" />Rebaixamento</span>
      </div>
    </div>
  );
}
