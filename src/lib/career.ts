import type { Career, Difficulty, PlayerState, StandingsRow } from '../types';
import { TEAMS, PLAYERS, getPlayersByTeam, getTeamById } from '../data';
import { createDefaultStadium, createDefaultFinances } from './finance';
import { generateInitialAcademy } from './academy';
import { createDefaultMarketState, createDefaultContracts } from './market';
import { generateCalendar } from './calendar';
import { uuid } from './utils';
import { SEASON_BONUS, DIFFICULTY_MULTIPLIERS } from './simulation/constants';
import { sortStandings } from './simulation/engine';

export const SCHEMA_VERSION = 2;

// ── Criação de nova carreira ──────────────────────────────────

export interface CreateCareerOpts {
  nickname: string;
  team_id: number;
  difficulty: Difficulty;
  season?: number;
}

export function createCareer(opts: CreateCareerOpts): Career {
  const season = opts.season ?? 2026;
  const teamIds = TEAMS.map((t) => t.id);
  const matches = generateCalendar(teamIds);

  const standings: StandingsRow[] = TEAMS.map((t) => ({
    team_id: t.id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));

  const teamPlayers = getPlayersByTeam(opts.team_id);
  const player_states: PlayerState[] = teamPlayers.map((p) => ({
    player_id: p.id,
    yellow_cards: 0,
    injury_until_round: null,
    suspended_until_round: null,
    fitness: 100,
    goals_season: 0,
    assists_season: 0,
    games_season: 0,
  }));

  const newCareer = {
    id: uuid(),
    schema_version: SCHEMA_VERSION,
    nickname: opts.nickname,
    team_id: opts.team_id,
    difficulty: opts.difficulty,
    season,
    current_round: 1,
    manager_points: 0,
    status: 'active',
    created_at: Date.now(),
    matches,
    lineups: [],
    standings,
    player_states,
    stadium: undefined,   // iniciado abaixo
    finances: undefined,
    academy: undefined,
    market_state: undefined,
    contracts: undefined,
  } as import('../types').Career;

  // Inicializar estádio e finanças
  const team = getTeamById(opts.team_id);
  if (team) {
    const id = newCareer.id;
    newCareer.stadium  = createDefaultStadium(id, team);
    newCareer.finances = createDefaultFinances(id, team, season);
    newCareer.academy      = generateInitialAcademy(team, id);
    newCareer.market_state = createDefaultMarketState(id);
    newCareer.contracts    = createDefaultContracts(id, opts.team_id, season);
  }

  return newCareer as import('../types').Career;
}

// ── Detectar save V1 (schema antigo) ─────────────────────────

export function isLegacySave(career: unknown): boolean {
  if (!career || typeof career !== 'object') return false;
  const c = career as Record<string, unknown>;
  // V1 não tem schema_version ou tem < 2
  return !c.schema_version || (c.schema_version as number) < SCHEMA_VERSION;
}

// ── Cálculo de pontos de temporada ───────────────────────────

export function calcSeasonPoints(career: Career): number {
  const sorted = sortStandings(career.standings);
  const pos = sorted.findIndex((r) => r.team_id === career.team_id) + 1;
  const row = sorted.find((r) => r.team_id === career.team_id);
  if (!row) return career.manager_points;

  const mult = DIFFICULTY_MULTIPLIERS[career.difficulty];
  const pontosCampeonato = row.points;
  const saldo = row.goals_for - row.goals_against;

  let bonus = 0;
  if (pos === 1)      bonus += SEASON_BONUS.champion;
  else if (pos === 2) bonus += SEASON_BONUS.runner_up;
  else if (pos <= 6)  bonus += SEASON_BONUS.libertadores;
  if (saldo > 0)      bonus += saldo * SEASON_BONUS.goal_diff;
  if (pos >= 17)      bonus += SEASON_BONUS.relegation;

  return Math.round((pontosCampeonato + bonus) * mult);
}

// ── Nova temporada ────────────────────────────────────────────

export function startNewSeason(career: Career): Career {
  const teamIds = TEAMS.map((t) => t.id);
  const matches = generateCalendar(teamIds);

  const standings: StandingsRow[] = TEAMS.map((t) => ({
    team_id: t.id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));

  // Resetar player states do time do usuário
  const teamPlayers = PLAYERS.filter((p) => p.team_id === career.team_id);
  const player_states: PlayerState[] = teamPlayers.map((p) => ({
    player_id: p.id,
    yellow_cards: 0,
    injury_until_round: null,
    suspended_until_round: null,
    fitness: 100,
    goals_season: 0,
    assists_season: 0,
    games_season: 0,
  }));

  const team = getTeamById(career.team_id);
  const newSeason = career.season + 1;
  const newId = uuid();

  const newCareer: import('../types').Career = {
    ...career,
    id: newId,
    schema_version: SCHEMA_VERSION,
    season: newSeason,
    current_round: 1,
    status: 'active',
    created_at: Date.now(),
    matches,
    lineups: [],
    standings,
    player_states,
    manager_points: 0,
  };

  // Resetar finanças (mantém caixa, zera acumuladores, renova patrocínio)
  if (team && career.finances) {
    const oldBal = career.finances.cash_balance;
    const fresh  = createDefaultFinances(newId, team, newSeason);
    newCareer.finances = { ...fresh, cash_balance: oldBal };
    // Manter empréstimo ativo
    if (career.finances.loan.principal > 0) {
      newCareer.finances.loan = { ...career.finances.loan };
    }
  }

  // Manter estádio, apenas atualizar career_id
  if (career.stadium) {
    newCareer.stadium = { ...career.stadium, career_id: newId };
  } else if (team) {
    newCareer.stadium = createDefaultStadium(newId, team);
  }

  // Manter academia (jovens continuam, mas career_id atualizado)
  if (career.academy) {
    newCareer.academy = {
      ...career.academy,
      career_id: newId,
      juniors: career.academy.juniors.map((j) => ({ ...j, career_id: newId })),
    };
  } else if (team) {
    newCareer.academy = generateInitialAcademy(team, newId);
  }

  // Manter contratos (renovados/ajustados) e resetar mercado
  newCareer.market_state = createDefaultMarketState(newId);
  // Contratos: atualizar career_id e remover expirados
  if (career.contracts) {
    newCareer.contracts = career.contracts
      .filter((c) => c.contract_until_season >= career.season)
      .map((c) => ({ ...c, career_id: newId }));
  } else if (team) {
    newCareer.contracts = createDefaultContracts(newId, career.team_id, career.season + 1);
  }

  return newCareer;
}
