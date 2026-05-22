import type { Difficulty, Style } from '../../types';

export const GOALS_BASELINE = 1.35;
export const HOME_BOOST = 1.15;
export const AWAY_PENALTY = 0.95;

export const YELLOW_RATE = 0.08;
export const RED_RATE = 0.01;
export const INJURY_RATE = 0.02;
export const INJURY_MIN_ROUNDS = 1;
export const INJURY_MAX_ROUNDS = 6;

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 0.7,
  normal: 1.0,
  hard: 1.4,
};

/** Modifica força de ataque e defesa conforme estilo tático */
export const STYLE_BONUS: Record<Style, { atk: number; def: number }> = {
  defensive: { atk: 0.85, def: 1.15 },
  balanced:  { atk: 1.00, def: 1.00 },
  offensive: { atk: 1.20, def: 0.85 },
};

/** Pontos do treinador por resultado */
export const MANAGER_POINTS = { W: 3, D: 1, L: 0 };

/** Bônus de final de temporada para manager_points */
export const SEASON_BONUS = {
  champion:      200,
  runner_up:     100,
  libertadores:   50, // 3-6
  goal_diff:       2, // por gol de saldo
  relegation:   -150, // 17-20
};
