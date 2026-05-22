// ── Estatísticas de uma partida ───────────────────────────────

export interface TeamStats {
  shots: number;
  shots_on_target: number;
  corners: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
  possession_home: number; // 0-100
}

export function emptyMatchStats(): MatchStats {
  const empty = (): TeamStats => ({
    shots: 0, shots_on_target: 0, corners: 0,
    fouls: 0, yellow_cards: 0, red_cards: 0,
  });
  return { home: empty(), away: empty(), possession_home: 50 };
}

// ── Eventos extras (além dos do engine) ──────────────────────

export type LiveEventType =
  | 'goal'
  | 'yellow'
  | 'red'
  | 'injury'
  | 'big_save'
  | 'shot_missed'
  | 'half_time'
  | 'full_time'
  | 'kickoff';

export interface LiveEvent {
  minute: number;
  type: LiveEventType;
  team_id?: number;
  player_id?: number;
  narrative: string;
  is_goal?: boolean;
  is_user_team?: boolean;
}

// ── Resultado completo pré-calculado ─────────────────────────

export interface MatchSimulationResult {
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  events: LiveEvent[];
  stats: MatchStats;
  // Resultado para o careerStore (vindo do engine original)
  // Estrutura explícita para evitar import circular
  careerRoundOutput: {
    matches_with_results: import("../../types").Match[];
    updated_standings: import("../../types").StandingsRow[];
    updated_player_states: import("../../types").PlayerState[];
    user_match_summary: import("../simulation/engine").UserMatchSummary;
  };
}

// ── Velocidade de reprodução ──────────────────────────────────

export type MatchSpeed = 'normal' | 'fast' | 'very_fast' | 'instant';

export const SPEED_MS: Record<MatchSpeed, number> = {
  normal:     600,
  fast:       200,
  very_fast:   50,
  instant:      0,
};

export const SPEED_LABELS: Record<MatchSpeed, string> = {
  normal:    'Normal',
  fast:      'Rápido',
  very_fast: 'Muito rápido',
  instant:   'Pular',
};

// ── Interpolação de stats por minuto ─────────────────────────

export function interpolateStats(finalStats: MatchStats, minute: number): MatchStats {
  const p = Math.min(minute / 90, 1);
  const noiseF = (base: number) => Math.max(0, Math.round(base * p * (0.85 + Math.random() * 0.3)));
  return {
    home: {
      shots:          noiseF(finalStats.home.shots),
      shots_on_target:noiseF(finalStats.home.shots_on_target),
      corners:        noiseF(finalStats.home.corners),
      fouls:          noiseF(finalStats.home.fouls),
      yellow_cards:   finalStats.home.yellow_cards,
      red_cards:      finalStats.home.red_cards,
    },
    away: {
      shots:          noiseF(finalStats.away.shots),
      shots_on_target:noiseF(finalStats.away.shots_on_target),
      corners:        noiseF(finalStats.away.corners),
      fouls:          noiseF(finalStats.away.fouls),
      yellow_cards:   finalStats.away.yellow_cards,
      red_cards:      finalStats.away.red_cards,
    },
    possession_home: finalStats.possession_home,
  };
}
