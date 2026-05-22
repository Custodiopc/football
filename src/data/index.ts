import type { Team, Player } from '../types';
import rawSeed from './seed.json';

const seed = rawSeed as { teams: Team[]; players: Player[] };

export const TEAMS: Team[] = seed.teams;
export const PLAYERS: Player[] = seed.players;

export function getPlayersByTeam(teamId: number): Player[] {
  return PLAYERS.filter((p) => p.team_id === teamId);
}

export function getTeamById(id: number): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}

/** Overall médio para o grid de seleção — usa force dos 11 melhores */
export function getTeamOverall(teamId: number): number {
  const players = getPlayersByTeam(teamId);
  if (!players.length) return 0;
  const top11 = [...players].sort((a, b) => b.force - a.force).slice(0, 11);
  return Math.round(top11.reduce((s, p) => s + p.force, 0) / top11.length);
}

export function getTopPlayersByTeam(teamId: number, limit = 5): Player[] {
  return getPlayersByTeam(teamId)
    .sort((a, b) => b.force - a.force)
    .slice(0, limit);
}

export function getPlayerById(id: number): Player | undefined {
  return PLAYERS.find((p) => p.id === id);
}
