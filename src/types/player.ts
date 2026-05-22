// ── Posições e lados (padrão Brasfoot) ──────────────────────
export type Position = 'G' | 'Z' | 'L' | 'M' | 'A';
export type Side = 'E' | 'D' | 'A'; // Esquerdo, Direito, Ambos

// ── Atributos 1-20 ───────────────────────────────────────────
export interface PlayerAttributes {
  // Goleiro
  gol?: number; // Goleirice
  ref?: number; // Reflexos
  sai?: number; // Saída de gol
  col?: number; // Colocação

  // Defesa (Z, L)
  des?: number; // Desarme
  mar?: number; // Marcação

  // Compartilhado
  res?: number; // Resistência (Z, L, M)
  pas?: number; // Passe (L, M)
  dri?: number; // Drible (M, A)
  cab: number;  // Cabeceio (todos)

  // Meio (M)
  arm?: number; // Armação

  // Ataque (A)
  fin?: number; // Finalização
  pos?: number; // Posicionamento

  // Universais (todos obrigatórios)
  vel: number;  // Velocidade
  tec: number;  // Técnica
  fal: number;  // Cobrança de falta
  pen: number;  // Pênalti
}

export type AttrKey = keyof PlayerAttributes;

// ── Jogador V2 ───────────────────────────────────────────────
export interface Player {
  id: number;
  team_id: number;
  name: string;
  position: Position;
  side: Side;
  age: number;

  attributes: PlayerAttributes;
  force: number; // F, 1-20

  highlighted_attr_1?: AttrKey;
  highlighted_attr_2?: AttrKey;

  is_star: boolean;
  is_world_top: boolean;
}

// ── Constantes de UI ─────────────────────────────────────────

export const POSITION_LABEL: Record<Position, string> = {
  G: 'Goleiro',
  Z: 'Zagueiro',
  L: 'Lateral',
  M: 'Meio-campista',
  A: 'Atacante',
};

export const SIDE_LABEL: Record<Side, string> = {
  E: 'Esquerdo',
  D: 'Direito',
  A: 'Ambos',
};

export const ATTR_LABEL: Partial<Record<AttrKey, string>> = {
  gol: 'Goleirice',
  ref: 'Reflexos',
  sai: 'Saída',
  col: 'Colocação',
  des: 'Desarme',
  mar: 'Marcação',
  res: 'Resistência',
  pas: 'Passe',
  dri: 'Drible',
  cab: 'Cabeceio',
  arm: 'Armação',
  fin: 'Finalização',
  pos: 'Posicionamento',
  vel: 'Velocidade',
  tec: 'Técnica',
  fal: 'Falta',
  pen: 'Pênalti',
};

// Atributos primários por posição (definem a Força)
export const PRIMARY_ATTRS: Record<Position, AttrKey[]> = {
  G: ['gol', 'ref', 'sai', 'col'],
  Z: ['des', 'mar', 'cab'],
  L: ['des', 'mar', 'vel'],
  M: ['arm', 'pas', 'tec'],
  A: ['fin', 'dri', 'pos'],
};

// Atributos secundários por posição
export const SECONDARY_ATTRS: Record<Position, AttrKey[]> = {
  G: ['pen'],
  Z: ['res', 'vel'],
  L: ['pas', 'res', 'cab'],
  M: ['vel', 'res', 'dri', 'fin'],
  A: ['vel', 'cab', 'tec'],
};

// Universais (todos têm)
export const UNIVERSAL_ATTRS: AttrKey[] = ['vel', 'cab', 'tec', 'fal', 'pen'];

// Todos os atributos relevantes por posição (primários + secundários + universais)
export const ALL_ATTRS_BY_POS: Record<Position, AttrKey[]> = {
  G: ['gol', 'ref', 'sai', 'col', 'pen', 'vel', 'cab', 'tec', 'fal'],
  Z: ['des', 'mar', 'cab', 'res', 'vel', 'tec', 'fal', 'pen'],
  L: ['des', 'mar', 'vel', 'pas', 'res', 'cab', 'tec', 'fal', 'pen'],
  M: ['arm', 'pas', 'tec', 'vel', 'res', 'dri', 'fin', 'cab', 'fal', 'pen'],
  A: ['fin', 'dri', 'pos', 'vel', 'cab', 'tec', 'fal', 'pen'],
};
