import type { Lineup, PlayerState } from '../../types';
import { PLAYERS } from '../../data';

/**
 * Gera escalação automática (IA) para um time.
 * Usa force (1-20) como critério de seleção.
 * Formação padrão: 4-3-3, estilo balanced.
 */
export function generateAILineup(
  team_id: number,
  player_states: PlayerState[],
  current_round: number,
): Lineup {
  const teamPlayers = PLAYERS.filter((p) => p.team_id === team_id);

  const isAvailable = (player_id: number): boolean => {
    const ps = player_states.find((s) => s.player_id === player_id);
    if (!ps) return true;
    if (ps.injury_until_round != null && current_round <= ps.injury_until_round) return false;
    if (ps.suspended_until_round != null && current_round <= ps.suspended_until_round) return false;
    return true;
  };

  const available = teamPlayers.filter((p) => isAvailable(p.id));

  const byPos = (pos: string, n: number) =>
    available
      .filter((p) => p.position === pos)
      .sort((a, b) => b.force - a.force)
      .slice(0, n);

  const gk  = byPos('G', 1);
  const def = byPos('Z', 3);
  const lat = byPos('L', 2);
  const mid = byPos('M', 3);
  const atk = byPos('A', 2);

  const starting = [...gk, ...def, ...lat, ...mid, ...atk];

  if (starting.length < 11) {
    const usedIds = new Set(starting.map((p) => p.id));
    const extras = available
      .filter((p) => !usedIds.has(p.id))
      .sort((a, b) => b.force - a.force)
      .slice(0, 11 - starting.length);
    starting.push(...extras);
  }

  const usedIds = new Set(starting.map((p) => p.id));
  const bench = available
    .filter((p) => !usedIds.has(p.id))
    .sort((a, b) => b.force - a.force)
    .slice(0, 5);

  return {
    round: current_round,
    formation: '4-3-3',
    style: 'balanced',
    starting_ids: starting.slice(0, 11).map((p) => p.id),
    bench_ids: bench.map((p) => p.id),
  };
}
