// Re-exporta tipos do jogador V2
export type { Position, Side, PlayerAttributes, AttrKey, Player } from './player';
export {
  POSITION_LABEL, SIDE_LABEL, ATTR_LABEL,
  PRIMARY_ATTRS, SECONDARY_ATTRS, UNIVERSAL_ATTRS, ALL_ATTRS_BY_POS,
} from './player';

// ── Competição / partida ─────────────────────────────────────
export type EventType = 'goal' | 'yellow' | 'red' | 'injury';

export interface MatchEvent {
  minute: number;
  type: EventType;
  player_id: number;
  team_id: number;
  description: string;
  goal_type?: 'open_play' | 'header' | 'freekick' | 'penalty';
}

export interface Match {
  round: number;
  home_team_id: number;
  away_team_id: number;
  home_goals: number | null;
  away_goals: number | null;
  events: MatchEvent[];
}

// ── Configurações táticas ─────────────────────────────────────
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Formation = '4-4-2' | '4-3-3' | '4-2-3-1' | '3-5-2';
export type Style = 'defensive' | 'balanced' | 'offensive';

export interface Lineup {
  round: number;
  formation: Formation;
  style: Style;
  starting_ids: number[];
  bench_ids: number[];
}

// ── Standings e estado de jogadores ─────────────────────────
export interface StandingsRow {
  team_id: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export interface PlayerState {
  player_id: number;
  yellow_cards: number;
  injury_until_round: number | null;
  suspended_until_round: number | null;
  fitness: number; // 0-100
  goals_season: number;   // gols nesta temporada
  assists_season: number; // assistências nesta temporada
  games_season: number;   // jogos nesta temporada
}

// ── Time ─────────────────────────────────────────────────────
export interface Team {
  id: number;
  name: string;
  short_name: string;
  city: string;
  state: string;
  primary_color: string;
  secondary_color: string;
  tier?: 'top' | 'strong' | 'mid' | 'bottom';
}

// ── Carreira ─────────────────────────────────────────────────
export interface Career {
  id: string;
  schema_version: number; // 1 = V1 (antigo), 2 = V2 (Brasfoot)
  nickname: string;
  team_id: number;
  difficulty: Difficulty;
  season: number;
  current_round: number;
  manager_points: number;
  status: 'active' | 'finished';
  created_at: number;
  matches: Match[];
  lineups: Lineup[];
  standings: StandingsRow[];
  player_states: PlayerState[];
  stadium?: import('../types/finance').Stadium;
  finances?: import('../types/finance').Finances;
  academy?: import('./academy').Academy;
  market_state?: import('./market').MarketState;
  contracts?: import('./market').PlayerContract[];
}

// ── Configurações do usuário ─────────────────────────────────
export interface Settings {
  sound_enabled: boolean;
  volume: number;
  language: 'pt-BR';
}

// Re-exporta tipos do mundo
export type { WorldConfig, LeagueDivision, BrazilianState, BrazilianStateId, RegionalCup, SalarySystem, ForceSystem, StateChampionshipConfig, StateDivisionConfig } from './world';
export { REGIONAL_CUP_LABELS } from './world';

// Re-exporta tipos de finanças
export type { Stadium, Finances, MatchRevenue, StadiumCapacity, StadiumPrices, StadiumSector, StadiumUpgrade, FinanceRevenue, FinanceExpenses, Loan, Sponsorship } from './finance';
export { SEAT_COST, SECTOR_LABELS, SECTORS } from './finance';

// Re-exporta tipos da academia
export type { JuniorPlayer, Academy, CpeStars } from './academy';
export { CPE_POTENTIAL_BASE, CPE_GROWTH_RATE, CAPACITY_BY_TIER, POS_COLOR } from './academy';

// Re-exporta tipos de mercado
export type { PlayerContract, TransferListing, TransferOffer, Transfer, MarketState, TeamPersonality, SearchFilters, MarketWindow, ContractRenewalProposal, OfferStatus, Philosophy } from './market';
export { DEFAULT_SEARCH_FILTERS } from './market';
