import type {
  WorldConfig, LeagueDivision, BrazilianState, StateChampionshipConfig,
} from '../types/world';
import { uuid } from './utils';

// ── Divisões padrão do Brasil ─────────────────────────────────

export const DEFAULT_DIVISIONS: LeagueDivision[] = [
  {
    level: 1,
    name: 'Série A',
    total_teams: 20,
    groups_config: 'no_groups',
    knockout: 'none',
    promoted_count: 0,
    relegated_count: 4,
    relegated_direct: 4,
    playoff_with_below: 0,
    two_legs: true,
    penalty_tiebreaker: false,
    playable: true,
  },
  {
    level: 2,
    name: 'Série B',
    total_teams: 20,
    groups_config: 'no_groups',
    knockout: 'none',
    promoted_count: 4,
    relegated_count: 4,
    relegated_direct: 4,
    playoff_with_below: 0,
    two_legs: true,
    penalty_tiebreaker: false,
    playable: false,
  },
  {
    level: 3,
    name: 'Série C',
    total_teams: 20,
    groups_config: '2_groups_of_10',
    knockout: 'top_8_playoff',
    promoted_count: 4,
    relegated_count: 4,
    relegated_direct: 4,
    playoff_with_below: 0,
    two_legs: true,
    penalty_tiebreaker: true,
    playable: false,
  },
  {
    level: 4,
    name: 'Série D',
    total_teams: 64,
    groups_config: '8_groups_of_8',
    knockout: '32_classifieds',
    promoted_count: 4,
    relegated_count: 0,
    relegated_direct: 0,
    playoff_with_below: 0,
    two_legs: true,
    penalty_tiebreaker: true,
    playable: false,
  },
];

// ── Estados brasileiros com times ─────────────────────────────

export const DEFAULT_STATES: BrazilianState[] = [
  { id: 'SP', name: 'São Paulo',       team_count: 32, enabled: true },
  { id: 'RJ', name: 'Rio de Janeiro',  team_count: 16, enabled: true },
  { id: 'MG', name: 'Minas Gerais',    team_count: 16, enabled: true },
  { id: 'RS', name: 'Rio Grd. do Sul', team_count: 12, enabled: true },
  { id: 'PR', name: 'Paraná',          team_count: 12, enabled: true },
  { id: 'BA', name: 'Bahia',           team_count: 12, enabled: true },
  { id: 'CE', name: 'Ceará',           team_count: 8,  enabled: true },
  { id: 'PE', name: 'Pernambuco',      team_count: 8,  enabled: true },
  { id: 'SC', name: 'Santa Catarina',  team_count: 8,  enabled: false },
  { id: 'GO', name: 'Goiás',           team_count: 8,  enabled: false },
  { id: 'PA', name: 'Pará',            team_count: 8,  enabled: false },
  { id: 'MA', name: 'Maranhão',        team_count: 6,  enabled: false },
  { id: 'AM', name: 'Amazonas',        team_count: 6,  enabled: false },
  { id: 'PB', name: 'Paraíba',         team_count: 6,  enabled: false },
  { id: 'RN', name: 'Rio Grd. Norte',  team_count: 6,  enabled: false },
  { id: 'ES', name: 'Espírito Santo',  team_count: 6,  enabled: false },
  { id: 'MT', name: 'Mato Grosso',     team_count: 4,  enabled: false },
  { id: 'MS', name: 'Mato Grd. Sul',   team_count: 4,  enabled: false },
  { id: 'AL', name: 'Alagoas',         team_count: 4,  enabled: false },
  { id: 'PI', name: 'Piauí',           team_count: 4,  enabled: false },
  { id: 'SE', name: 'Sergipe',         team_count: 4,  enabled: false },
  { id: 'RO', name: 'Rondônia',        team_count: 4,  enabled: false },
  { id: 'TO', name: 'Tocantins',       team_count: 4,  enabled: false },
  { id: 'AC', name: 'Acre',            team_count: 4,  enabled: false },
  { id: 'AP', name: 'Amapá',           team_count: 4,  enabled: false },
  { id: 'RR', name: 'Roraima',         team_count: 4,  enabled: false },
  { id: 'DF', name: 'Distrito Federal',team_count: 4,  enabled: false },
];

// ── Config default de estadual por estado ─────────────────────

export function defaultStateConfig(stateId: string): StateChampionshipConfig {
  return {
    state_id: stateId as StateChampionshipConfig['state_id'],
    use_real_groups: true,
    divisions: [
      {
        level: 1,
        system: '12 times - pontos corridos',
        quarter_final_legs: 2,
        semi_final_legs: 2,
        final_legs: 2,
        penalty_tiebreaker: true,
      },
    ],
  };
}

// ── Criar WorldConfig padrão ──────────────────────────────────

export function createDefaultWorldConfig(): WorldConfig {
  return {
    id: uuid(),
    created_at: Date.now(),
    divisions: DEFAULT_DIVISIONS.map((d) => ({ ...d })),
    play_states: true,
    active_states: DEFAULT_STATES.map((s) => ({ ...s })),
    state_configs: DEFAULT_STATES
      .filter((s) => s.enabled)
      .map((s) => defaultStateConfig(s.id)),
    play_regional_cups: true,
    active_regional_cups: ['copa_nordeste', 'copa_verde'],
    always_invited_to_regional: false,
    play_international_clubs: true,
    play_international_nationals: false,
    use_world_cup_groups: false,
    salary_system: 'monthly',
    force_system: 'individual',
    start_season: 2026,
  };
}

// ── Rótulos legíveis ──────────────────────────────────────────

export const GROUPS_CONFIG_LABELS: Record<string, string> = {
  no_groups:        'Sem grupos',
  '2_groups_of_10': '2 grupos de 10',
  '4_groups_of_8':  '4 grupos de 8',
  '8_groups_of_8':  '8 grupos de 8',
};

export const KNOCKOUT_LABELS: Record<string, string> = {
  none:              'Sem mata-mata',
  top_8_playoff:     'Top 8 playoff',
  top_16_playoff:    'Top 16 playoff',
  '32_classifieds':  '32 classificados',
};

export const SALARY_SYSTEM_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  weekly:  'Semanal',
};

export const FORCE_SYSTEM_LABELS: Record<string, string> = {
  individual: 'Individual (recomendado)',
  classic:    'Clássico',
};

// ── Total de times ativos ─────────────────────────────────────

export function countTotalTeams(config: WorldConfig): number {
  return config.divisions.reduce((sum, d) => sum + d.total_teams, 0);
}
