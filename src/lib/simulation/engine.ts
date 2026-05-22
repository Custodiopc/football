import type {
  Career, Match, MatchEvent, Lineup, StandingsRow, PlayerState, Player,
} from '../../types';
import { PLAYERS } from '../../data';
import { mulberry32, hashStr } from './prng';
import { poissonSample } from './poisson';
import {
  YELLOW_RATE, RED_RATE, INJURY_RATE,
  INJURY_MIN_ROUNDS, INJURY_MAX_ROUNDS,
  DIFFICULTY_MULTIPLIERS,
} from './constants';
import { getMatchesByRound } from '../calendar';
import {
  calculateTeamForce, getEffectiveAttribute,
} from './playerAttributes';

// ── Tipos de saída ────────────────────────────────────────────

export interface UserMatchSummary {
  home: boolean;
  opponent_team_id: number;
  own_score: number;
  opponent_score: number;
  result: 'W' | 'D' | 'L';
  points_earned: number;
  events: MatchEvent[];
}

export interface SimulateRoundOutput {
  matches_with_results: Match[];
  updated_standings: StandingsRow[];
  updated_player_states: PlayerState[];
  user_match_summary: UserMatchSummary;
}

// ── Helpers internos ─────────────────────────────────────────

function getTeamPlayers(teamId: number): Player[] {
  return PLAYERS.filter((p) => p.team_id === teamId);
}

function getPlayerById(id: number): Player | undefined {
  return PLAYERS.find((p) => p.id === id);
}

function getAIStarting(players: Player[], states: PlayerState[], round: number): Player[] {
  const avail = players.filter((p) => {
    const s = states.find((st) => st.player_id === p.id);
    if (s?.injury_until_round != null && round <= s.injury_until_round) return false;
    if (s?.suspended_until_round != null && round <= s.suspended_until_round) return false;
    return true;
  });

  const byPos = (pos: string, n: number) =>
    avail.filter((p) => p.position === pos).sort((a, b) => b.force - a.force).slice(0, n);

  const gk  = byPos('G', 1);
  const def = byPos('Z', 3);
  const lat = byPos('L', 2);
  const mid = byPos('M', 3);
  const atk = byPos('A', 2);

  const squad = [...gk, ...def, ...lat, ...mid, ...atk];

  // Completar com melhores disponíveis
  if (squad.length < 11) {
    const usedIds = new Set(squad.map((p) => p.id));
    const extras = avail
      .filter((p) => !usedIds.has(p.id))
      .sort((a, b) => b.force - a.force)
      .slice(0, 11 - squad.length);
    squad.push(...extras);
  }

  return squad.slice(0, 11);
}

// ── Lambda (gols esperados) ──────────────────────────────────

function calcLambda(
  attackForce: number,
  defenseForce: number,
  midfieldRatio: number,
  isHome: boolean,
  diffMult: number,
): number {
  const attackN = attackForce / 11;
  const defenseN = defenseForce / 11;
  const advantage = attackN - defenseN;

  let lambda = 1.35 + (advantage / 20) * 1.5;
  lambda *= 0.8 + 0.4 * midfieldRatio; // posse
  lambda *= isHome ? 1.15 : 0.95;
  lambda *= diffMult;

  return Math.max(0.15, Math.min(5.5, lambda));
}

// ── Gols ponderados por características ─────────────────────

function weightedPick<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function assignGoals(
  count: number,
  starters: Player[],
  teamId: number,
  rng: () => number,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  const candidates = starters.filter((p) => p.position !== 'G');
  if (!candidates.length) return events;

  const weights = candidates.map((p) => {
    let w = getEffectiveAttribute(p, 'fin') || getEffectiveAttribute(p, 'arm') || p.force;
    if (p.position === 'A') w *= 2.0;
    else if (p.position === 'M') w *= 1.0;
    else w *= 0.3;
    return Math.max(0.1, w);
  });

  for (let i = 0; i < count; i++) {
    const scorer = weightedPick(candidates, weights, rng);
    const minute = Math.floor(rng() * 90) + 1;

    // Tipo de gol
    let goalType: 'open_play' | 'header' | 'freekick' | 'penalty' = 'open_play';
    const roll = rng();
    if (scorer.highlighted_attr_1 === 'cab' || scorer.highlighted_attr_2 === 'cab') {
      if (roll < 0.35) goalType = 'header';
    }
    if ((scorer.attributes.fal ?? 0) > 14 && roll < 0.08) goalType = 'freekick';
    if (scorer.position === 'A' && roll < 0.07) goalType = 'penalty';

    const desc: Record<string, string> = {
      open_play: `${scorer.name} marca`,
      header:    `${scorer.name} cabeceia pra rede`,
      freekick:  `${scorer.name} cobra falta direto`,
      penalty:   `${scorer.name} converte o pênalti`,
    };

    events.push({
      minute,
      type: 'goal',
      player_id: scorer.id,
      team_id: teamId,
      description: desc[goalType],
      goal_type: goalType,
    });
  }

  return events;
}

// ── Cartões e lesões ─────────────────────────────────────────

function generateCardsAndInjuries(
  starters: Player[],
  teamId: number,
  rng: () => number,
  _round: number,
): MatchEvent[] {
  const events: MatchEvent[] = [];

  for (const p of starters) {
    if (rng() < YELLOW_RATE) {
      events.push({
        minute: Math.floor(rng() * 90) + 1,
        type: 'yellow',
        player_id: p.id,
        team_id: teamId,
        description: `${p.name} recebe cartão amarelo`,
      });
    } else if (rng() < RED_RATE) {
      events.push({
        minute: Math.floor(rng() * 90) + 1,
        type: 'red',
        player_id: p.id,
        team_id: teamId,
        description: `${p.name} é expulso`,
      });
    }

    if (rng() < INJURY_RATE) {
      const dur = INJURY_MIN_ROUNDS + Math.floor(rng() * (INJURY_MAX_ROUNDS - INJURY_MIN_ROUNDS + 1));
      events.push({
        minute: Math.floor(rng() * 90) + 1,
        type: 'injury',
        player_id: p.id,
        team_id: teamId,
        description: `${p.name} se machuca, desfalca por ${dur} rodada(s)`,
      });
    }
  }

  return events;
}

// ── Atualizar standings ──────────────────────────────────────

function updateStandings(
  standings: StandingsRow[],
  homeId: number,
  awayId: number,
  homeGoals: number,
  awayGoals: number,
): StandingsRow[] {
  return standings.map((row) => {
    if (row.team_id !== homeId && row.team_id !== awayId) return row;
    const isHome = row.team_id === homeId;
    const gf = isHome ? homeGoals : awayGoals;
    const ga = isHome ? awayGoals : homeGoals;
    const win = gf > ga;
    const draw = gf === ga;
    return {
      ...row,
      played: row.played + 1,
      wins:   row.wins   + (win  ? 1 : 0),
      draws:  row.draws  + (draw ? 1 : 0),
      losses: row.losses + (!win && !draw ? 1 : 0),
      goals_for:     row.goals_for + gf,
      goals_against: row.goals_against + ga,
      points: row.points + (win ? 3 : draw ? 1 : 0),
    };
  });
}

// ── Atualizar player states ──────────────────────────────────

function applyEventsToStates(
  states: PlayerState[],
  events: MatchEvent[],
  round: number,
): PlayerState[] {
  const updated = states.map((s) => ({ ...s }));

  const getOrCreate = (playerId: number): PlayerState => {
    let ps = updated.find((s) => s.player_id === playerId);
    if (!ps) {
      ps = {
        player_id: playerId,
        yellow_cards: 0,
        injury_until_round: null,
        suspended_until_round: null,
        fitness: 100,
        goals_season: 0,
        assists_season: 0,
        games_season: 0,
      };
      updated.push(ps);
    }
    return ps;
  };

  for (const evt of events) {
    const ps = getOrCreate(evt.player_id);
    if (evt.type === 'yellow') {
      ps.yellow_cards++;
      if (ps.yellow_cards % 3 === 0) ps.suspended_until_round = round + 1;
    } else if (evt.type === 'red') {
      ps.suspended_until_round = round + 1;
    } else if (evt.type === 'injury') {
      const m = evt.description.match(/(\d+) rodada/);
      const dur = m ? parseInt(m[1]) : 1;
      ps.injury_until_round = round + dur;
    } else if (evt.type === 'goal') {
      ps.goals_season++;
    }
  }

  return updated;
}

// ── Motor principal ───────────────────────────────────────────

export function simulateRound(
  career: Career,
  round: number,
  userLineup: Lineup,
): SimulateRoundOutput {
  const seed = hashStr(career.id + String(round));
  const rng = mulberry32(seed);

  const roundMatches = getMatchesByRound(career.matches, round);
  const diffMult = DIFFICULTY_MULTIPLIERS[career.difficulty];

  let standings = career.standings.map((r) => ({ ...r }));
  let playerStates = career.player_states.map((s) => ({ ...s }));
  const resultMatches: Match[] = [];
  let userSummary: UserMatchSummary | null = null;

  for (const match of roundMatches) {
    const isUserHome = match.home_team_id === career.team_id;
    const isUserAway = match.away_team_id === career.team_id;
    const isUserMatch = isUserHome || isUserAway;

    let homeStarters: Player[];
    let awayStarters: Player[];
    let homeDiff: number;
    let awayDiff: number;

    if (isUserMatch) {
      const userStarters = userLineup.starting_ids
        .map((id) => getPlayerById(id))
        .filter((p): p is Player => p !== undefined);

      const oppId = isUserHome ? match.away_team_id : match.home_team_id;
      const oppPlayers = getTeamPlayers(oppId);
      const aiStarters = getAIStarting(oppPlayers, playerStates, round);

      if (isUserHome) {
        homeStarters = userStarters;
        awayStarters = aiStarters;
        homeDiff = 1.0;
        awayDiff = diffMult;
      } else {
        homeStarters = aiStarters;
        awayStarters = userStarters;
        homeDiff = diffMult;
        awayDiff = 1.0;
      }
    } else {
      homeStarters = getAIStarting(getTeamPlayers(match.home_team_id), playerStates, round);
      awayStarters = getAIStarting(getTeamPlayers(match.away_team_id), playerStates, round);
      homeDiff = 1.0;
      awayDiff = 1.0;
    }

    // Calcular forças
    const homeForce = calculateTeamForce(homeStarters.map((p) => p.id), getPlayerById, userLineup.style);
    const awayForce = calculateTeamForce(awayStarters.map((p) => p.id), getPlayerById, 'balanced');

    const totalMid = (homeForce.midfield + awayForce.midfield) || 1;
    const homeMidRatio = homeForce.midfield / totalMid;
    const awayMidRatio = awayForce.midfield / totalMid;

    const lambdaHome = calcLambda(homeForce.attack, awayForce.defense, homeMidRatio, true,  homeDiff);
    const lambdaAway = calcLambda(awayForce.attack, homeForce.defense, awayMidRatio, false, awayDiff);

    const homeGoals = poissonSample(lambdaHome, rng);
    const awayGoals = poissonSample(lambdaAway, rng);

    const events: MatchEvent[] = [
      ...assignGoals(homeGoals, homeStarters, match.home_team_id, rng),
      ...assignGoals(awayGoals, awayStarters, match.away_team_id, rng),
      ...generateCardsAndInjuries(homeStarters, match.home_team_id, rng, round),
      ...generateCardsAndInjuries(awayStarters, match.away_team_id, rng, round),
    ].sort((a, b) => a.minute - b.minute);

    const resultMatch: Match = { ...match, home_goals: homeGoals, away_goals: awayGoals, events };
    resultMatches.push(resultMatch);

    standings = updateStandings(standings, match.home_team_id, match.away_team_id, homeGoals, awayGoals);
    playerStates = applyEventsToStates(playerStates, events, round);

    if (isUserMatch) {
      const ownScore  = isUserHome ? homeGoals : awayGoals;
      const oppScore  = isUserHome ? awayGoals : homeGoals;
      const result: 'W' | 'D' | 'L' = ownScore > oppScore ? 'W' : ownScore === oppScore ? 'D' : 'L';
      const pointsEarned = result === 'W' ? 3 : result === 'D' ? 1 : 0;

      userSummary = {
        home: isUserHome,
        opponent_team_id: isUserHome ? match.away_team_id : match.home_team_id,
        own_score: ownScore,
        opponent_score: oppScore,
        result,
        points_earned: pointsEarned,
        events: events.filter((e) => e.team_id === career.team_id),
      };
    }
  }

  if (!userSummary) {
    throw new Error(`simulateRound: time ${career.team_id} não encontrado na rodada ${round}`);
  }

  return {
    matches_with_results: resultMatches,
    updated_standings: standings,
    updated_player_states: playerStates,
    user_match_summary: userSummary,
  };
}

// ── Ordenar standings (Brasileirão) ──────────────────────────

export function sortStandings(standings: StandingsRow[]): StandingsRow[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const sgA = a.goals_for - a.goals_against;
    const sgB = b.goals_for - b.goals_against;
    if (sgB !== sgA) return sgB - sgA;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return b.wins - a.wins;
  });
}

// ── Aplicar financeiro de uma rodada simulada ─────────────────

import {
  calculateMatchRevenue, applyWeeklySponsorship, applyMonthlySalaries,
  applyMatchRevenue as applyTickets, applyMatchPrize, applyMonthlyInterest,
  applyCompletedUpgrade,
} from '../finance';
import type { Finances, Stadium } from '../../types/finance';
import { getTeamById } from '../../data';

export interface FinancialRoundUpdate {
  updatedFinances: Finances;
  updatedStadium: Stadium;
  matchRevenue: number;
  matchPrize: number;
}

export function applyFinancialRound(
  career: Career,
  result: 'W' | 'D' | 'L',
  isHome: boolean,
  opponentTeamId: number,
): FinancialRoundUpdate | null {
  if (!career.finances || !career.stadium) return null;

  const round = career.current_round;
  let finances = { ...career.finances };
  let stadium = { ...career.stadium };

  // 1. Completar expansão se chegou a hora
  if (stadium.upgrade_in_progress && round >= stadium.upgrade_in_progress.completes_at_round) {
    stadium = applyCompletedUpgrade(stadium);
  }

  // 2. Patrocínio semanal
  finances = applyWeeklySponsorship(finances, round);

  // 3. Salários mensais (a cada 4 rodadas)
  if (round % 4 === 0) {
    const playerForces = career.player_states
      .map((ps) => {
        const p = PLAYERS.find((pl) => pl.id === ps.player_id);
        return p?.force ?? 0;
      })
      .filter((f) => f > 0);
    finances = applyMonthlySalaries(finances, playerForces);
  }

  // 4. Juros de empréstimo (a cada 4 rodadas)
  if (round % 4 === 0 && finances.loan.principal > 0) {
    finances = applyMonthlyInterest(finances);
  }

  let matchRevenue = 0;
  let matchPrize = 0;

  // 5. Bilheteria (só jogo em casa)
  if (isHome) {
    const opp = getTeamById(opponentTeamId);
    const sortedStandings = sortStandings(career.standings);
    const pos = sortedStandings.findIndex((r) => r.team_id === career.team_id) + 1;
    const rev = calculateMatchRevenue(stadium, opp?.tier ?? 'mid', pos);
    finances = applyTickets(finances, rev);
    matchRevenue = rev.total;
  }

  // 6. Prêmio de resultado
  finances = applyMatchPrize(finances, result);
  matchPrize = result === 'W' ? 200_000 : result === 'D' ? 80_000 : 0;

  return { updatedFinances: finances, updatedStadium: stadium, matchRevenue, matchPrize };
}

// ── Desenvolvimento de juniores por rodada ────────────────────

import { developJuniors, discoverNewJuniors } from '../academy';
import type { Academy } from '../../types/academy';

export interface AcademyRoundUpdate {
  updatedAcademy: Academy;
  discovered: import('../../types/academy').JuniorPlayer | null;
}

export function processAcademyRound(
  career: Career,
  team: Team,
): AcademyRoundUpdate | null {
  if (!career.academy) return null;

  const round = career.current_round;

  // Desenvolvimento a cada rodada
  let academy = developJuniors(career.academy, round, career.id);

  // Descoberta a cada 5 rodadas
  let discovered: import('../../types/academy').JuniorPlayer | null = null;
  if (round % 5 === 0) {
    const result = discoverNewJuniors(academy, team, round, career.id);
    academy     = result.academy;
    discovered  = result.discovered;
  }

  return { updatedAcademy: academy, discovered };
}

// ── Mercado de transferências por rodada ──────────────────────

import { processMarketRound } from '../market';
import type { MarketState } from '../../types/market';

export interface MarketRoundUpdate {
  updatedMarketState: MarketState;
  marketNotifications: string[];
}

export function applyMarketRound(career: Career): MarketRoundUpdate | null {
  if (!career.market_state) return null;
  const { career: updated, notifications } = processMarketRound(career);
  return {
    updatedMarketState: updated.market_state!,
    marketNotifications: notifications,
  };
}

// ── Pré-calcular partida completa pra transmissão ao vivo ──────

import { generateNarrative } from './narratives';
import type {
  MatchSimulationResult, MatchStats, LiveEvent, MatchSpeed,
} from './matchStats';
import type { Team } from '../../types';

export type { MatchSimulationResult, MatchStats, LiveEvent, MatchSpeed };

export function buildLiveSimulation(
  career: Career,
  lineup: import('../../types').Lineup,
  team: Team,
): MatchSimulationResult {
  // Roda o engine original pra obter resultado e eventos
  const output = simulateRound(career, career.current_round, lineup);
  const summary = output.user_match_summary;

  const oppId = summary.opponent_team_id;
  const oppTeam = getTeamById(oppId);

  const isHome     = summary.home;
  const homeId     = isHome ? career.team_id : oppId;
  const awayId     = isHome ? oppId : career.team_id;
  const homeScore  = isHome ? summary.own_score : summary.opponent_score;
  const awayScore  = isHome ? summary.opponent_score : summary.own_score;

  // ── Construir live events a partir dos events do engine ──────
  const liveEvents: LiveEvent[] = [];

  // Kickoff
  liveEvents.push({ minute: 0, type: 'kickoff', narrative: generateNarrative('kickoff') });

  // Extrair gols do time do user com contagem para hat-trick
  const userGoalCounts: Record<number, number> = {};

  for (const evt of summary.events) {
    const isUser = evt.team_id === career.team_id;

    if (evt.type === 'goal') {
      if (isUser) {
        userGoalCounts[evt.player_id] = (userGoalCounts[evt.player_id] ?? 0) + 1;
      }

      const scorer = PLAYERS.find((p) => p.id === evt.player_id);
      const currentHomeScore = isHome
        ? Object.values(userGoalCounts).reduce((s, v) => s + v, 0)
        : homeScore;
      const currentAwayScore = isHome ? awayScore : awayScore;

      const goals = userGoalCounts[evt.player_id] ?? 1;
      const wasLosing = isUser
        ? (isHome ? (currentHomeScore - 1) < currentAwayScore : (currentAwayScore - 1) < currentHomeScore)
        : false;

      liveEvents.push({
        minute: evt.minute,
        type: 'goal',
        team_id: evt.team_id,
        player_id: evt.player_id,
        is_goal: true,
        is_user_team: isUser,
        narrative: generateNarrative('goal', {
          scorerName:       scorer?.name,
          teamShort:        isUser ? team.short_name : (oppTeam?.short_name ?? '?'),
          goalType:         evt.goal_type as never,
          minute:           evt.minute,
          homeScore:        homeScore,
          awayScore:        awayScore,
          isUserGoal:       isUser,
          scorerGoalsToday: goals,
          wasLosing,
        }),
      });
    } else if (evt.type === 'yellow') {
      const player = PLAYERS.find((p) => p.id === evt.player_id);
      liveEvents.push({
        minute: evt.minute,
        type: 'yellow',
        team_id: evt.team_id,
        player_id: evt.player_id,
        is_user_team: isUser,
        narrative: generateNarrative('yellow', { playerName: player?.name }),
      });
    } else if (evt.type === 'red') {
      const player = PLAYERS.find((p) => p.id === evt.player_id);
      liveEvents.push({
        minute: evt.minute,
        type: 'red',
        team_id: evt.team_id,
        player_id: evt.player_id,
        is_user_team: isUser,
        narrative: generateNarrative('red', { playerName: player?.name }),
      });
    } else if (evt.type === 'injury') {
      const player = PLAYERS.find((p) => p.id === evt.player_id);
      liveEvents.push({
        minute: evt.minute,
        type: 'injury',
        team_id: evt.team_id,
        player_id: evt.player_id,
        is_user_team: isUser,
        narrative: generateNarrative('injury', { playerName: player?.name }),
      });
    }
  }

  // Adicionar algumas defesas e chutes perdidos nos eventos do user team
  const seed2 = hashStr(career.id + 'extras' + career.current_round);
  const rngE = mulberry32(seed2);

  // Defesas (baseado na força do goleiro do adversário)
  const extraCount = 2 + Math.floor(rngE() * 3);
  for (let i = 0; i < extraCount; i++) {
    const min = Math.floor(rngE() * 89) + 1;
    if (rngE() < 0.4) {
      liveEvents.push({
        minute: min,
        type: 'big_save',
        is_user_team: false,
        narrative: generateNarrative('big_save', { keeperName: 'o goleiro' }),
      });
    } else {
      liveEvents.push({
        minute: min,
        type: 'shot_missed',
        is_user_team: true,
        narrative: generateNarrative('shot_missed', { shooterName: 'o atacante' }),
      });
    }
  }

  // Half-time
  liveEvents.push({ minute: 45, type: 'half_time', narrative: generateNarrative('half_time') });
  // Full-time
  liveEvents.push({ minute: 91, type: 'full_time', narrative: generateNarrative('full_time') });

  // Ordenar por minuto
  liveEvents.sort((a, b) => a.minute - b.minute);

  // ── Stats finais ──────────────────────────────────────────────
  const totalShots    = 5 + homeScore + awayScore + Math.floor(Math.random() * 6);
  const homeShots     = Math.round(totalShots * (isHome ? 0.55 : 0.45));
  const awayShots     = totalShots - homeShots;
  const stats: MatchStats = {
    home: {
      shots: homeShots,
      shots_on_target: homeScore + Math.max(0, homeShots - homeScore - 3),
      corners: 2 + Math.floor(Math.random() * 6),
      fouls: 6 + Math.floor(Math.random() * 8),
      yellow_cards: output.user_match_summary.events.filter((e) => e.type === 'yellow' && (isHome ? e.team_id === homeId : e.team_id === awayId)).length,
      red_cards: output.user_match_summary.events.filter((e) => e.type === 'red' && (isHome ? e.team_id === homeId : e.team_id === awayId)).length,
    },
    away: {
      shots: awayShots,
      shots_on_target: awayScore + Math.max(0, awayShots - awayScore - 3),
      corners: 1 + Math.floor(Math.random() * 5),
      fouls: 7 + Math.floor(Math.random() * 8),
      yellow_cards: 0,
      red_cards: 0,
    },
    possession_home: isHome ? 52 + Math.floor(Math.random() * 12) : 40 + Math.floor(Math.random() * 12),
  };

  return {
    home_team_id: homeId,
    away_team_id: awayId,
    home_score:   homeScore,
    away_score:   awayScore,
    events:       liveEvents,
    stats,
    careerRoundOutput: output,
  };
}
