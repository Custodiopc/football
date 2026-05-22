import type { Position, Side, PlayerAttributes, AttrKey } from './player';

// ── Júnior ───────────────────────────────────────────────────

export type CpeStars = 1 | 2 | 3 | 4 | 5;

export interface JuniorPlayer {
  id: number;
  career_id: string;
  team_id: number;

  full_name: string;
  nickname?: string;
  position: Position;
  side: Side;
  age: number;          // 16-20
  country: string;      // 'BRA' por padrão

  // Desenvolvimento
  development_percent: number;        // 0-100
  current_attributes: PlayerAttributes;
  current_force: number;              // 1-20, calculado

  // Potencial (parcialmente oculto)
  cpe_stars: CpeStars;               // estimativa dos olheiros (pode estar ±1 do real)
  potential_force: number;            // potencial real (oculto pro usuário)
  potential_highlighted_1?: AttrKey;
  potential_highlighted_2?: AttrKey;

  // Revelado conforme desenvolve
  revealed_highlight_1?: AttrKey;
  revealed_highlight_2?: AttrKey;

  // Finanças
  estimated_value: number;
  weekly_wage: number;
}

// ── Academia ─────────────────────────────────────────────────

export interface Academy {
  career_id: string;
  team_id: number;
  capacity: number;
  juniors: JuniorPlayer[];
}

// ── Constantes ───────────────────────────────────────────────

export const CPE_POTENTIAL_BASE: Record<CpeStars, number> = {
  1: 6,
  2: 9,
  3: 12,
  4: 15,
  5: 18,
};

export const CPE_GROWTH_RATE: Record<CpeStars, number> = {
  1: 0.5,
  2: 0.8,
  3: 1.0,
  4: 1.5,
  5: 2.0,
};

export const CAPACITY_BY_TIER: Record<string, number> = {
  top:    20,
  strong: 15,
  mid:    12,
  bottom: 10,
};

export const POS_COLOR: Record<Position, string> = {
  G: '#3b9adb',
  Z: '#4ade80',
  L: '#a8b8cc',
  M: '#f5d020',
  A: '#ef4444',
};
