// ── Divisão de liga ──────────────────────────────────────────

export interface LeagueDivision {
  level: 1 | 2 | 3 | 4;               // Série A, B, C, D
  name: string;                        // "Série A", "Série B", etc.
  total_teams: number;                 // 20, 20, 20, 64
  groups_config: 'no_groups' | '4_groups_of_8' | '8_groups_of_8' | '2_groups_of_10';
  knockout: 'none' | 'top_8_playoff' | 'top_16_playoff' | '32_classifieds';
  promoted_count: number;
  relegated_count: number;
  relegated_direct: number;
  playoff_with_below: number;
  two_legs: boolean;
  penalty_tiebreaker: boolean;
  playable: boolean;                   // false = só simulada
}

// ── Estados brasileiros ───────────────────────────────────────

export type BrazilianStateId =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export interface BrazilianState {
  id: BrazilianStateId;
  name: string;
  team_count: number;
  enabled: boolean;
}

export interface StateDivisionConfig {
  level: 1 | 2 | 3 | 4;
  system: string;                       // ex: "16 times - 4 grupos"
  quarter_final_legs: 1 | 2;
  semi_final_legs: 1 | 2;
  final_legs: 1 | 2;
  penalty_tiebreaker: boolean;
}

export interface StateChampionshipConfig {
  state_id: BrazilianStateId;
  use_real_groups: boolean;
  divisions: StateDivisionConfig[];
}

// ── Copas regionais ───────────────────────────────────────────

export type RegionalCup =
  | 'copa_verde'
  | 'copa_nordeste'
  | 'sul_minas'
  | 'rio_sp';

export const REGIONAL_CUP_LABELS: Record<RegionalCup, string> = {
  copa_verde:    'Copa Verde',
  copa_nordeste: 'Copa do Nordeste',
  sul_minas:     'Sul-Minas',
  rio_sp:        'Rio-São Paulo',
};

// ── Sistema de salários ───────────────────────────────────────

export type SalarySystem = 'monthly' | 'weekly';
export type ForceSystem  = 'individual' | 'classic';

// ── WorldConfig ───────────────────────────────────────────────

export interface WorldConfig {
  id: string;
  created_at: number;

  // Liga nacional
  divisions: LeagueDivision[];

  // Estaduais
  play_states: boolean;
  active_states: BrazilianState[];
  state_configs: StateChampionshipConfig[];

  // Regionais
  play_regional_cups: boolean;
  active_regional_cups: RegionalCup[];
  always_invited_to_regional: boolean;

  // Internacionais (stub)
  play_international_clubs: boolean;
  play_international_nationals: boolean;
  use_world_cup_groups: boolean;

  // Sistema
  salary_system: SalarySystem;
  force_system: ForceSystem;
  start_season: number;
}
