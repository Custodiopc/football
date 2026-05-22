import type { Player, AttrKey, Position } from '../../types';
import { PRIMARY_ATTRS, SECONDARY_ATTRS, ATTR_LABEL } from '../../types';

// ── Atributo efetivo (com bônus de característica destacada) ──

export function getEffectiveAttribute(player: Player, attr: AttrKey): number {
  const base = (player.attributes[attr] as number | undefined) ?? 0;
  if (base === 0) return 0;

  let multiplier = 1.0;
  if (player.highlighted_attr_1 === attr) multiplier += 0.20;
  if (player.highlighted_attr_2 === attr) multiplier += 0.20;
  if (player.is_world_top) multiplier += 0.15;
  else if (player.is_star) multiplier += 0.08;

  return Math.min(20, Math.round(base * multiplier));
}

// ── Cálculo de força (1-20) ──────────────────────────────────

export function calculateForce(player: Player): number {
  const primary = PRIMARY_ATTRS[player.position];
  const secondary = SECONDARY_ATTRS[player.position];

  const avg = (keys: AttrKey[]) => {
    const vals = keys
      .map((k) => (player.attributes[k] as number | undefined) ?? 0)
      .filter((v) => v > 0);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };

  const universals: AttrKey[] = ['vel', 'cab', 'tec'];
  let force =
    avg(primary) * 0.6 +
    avg(secondary) * 0.3 +
    avg(universals) * 0.1;

  if (player.highlighted_attr_1) force += 0.5;
  if (player.highlighted_attr_2) force += 0.5;
  if (player.is_world_top) force += 2;
  else if (player.is_star) force += 1;

  return Math.max(1, Math.min(20, Math.round(force)));
}

// ── Força de equipe para o motor ─────────────────────────────

export interface TeamForce {
  attack: number;
  defense: number;
  midfield: number;
}

export function calculateTeamForce(
  startingIds: number[],
  getPlayer: (id: number) => Player | undefined,
  style: 'defensive' | 'balanced' | 'offensive',
): TeamForce {
  let attack = 0;
  let defense = 0;
  let midfield = 0;

  const STYLE_BONUS = {
    defensive: { atk: 0.85, def: 1.15 },
    balanced:  { atk: 1.00, def: 1.00 },
    offensive: { atk: 1.20, def: 0.85 },
  };

  for (const id of startingIds) {
    const p = getPlayer(id);
    if (!p) continue;

    if (p.position === 'A') {
      attack +=
        getEffectiveAttribute(p, 'fin') * 0.50 +
        getEffectiveAttribute(p, 'dri') * 0.30 +
        getEffectiveAttribute(p, 'vel') * 0.20;
    } else if (p.position === 'M') {
      midfield +=
        getEffectiveAttribute(p, 'arm') * 0.40 +
        getEffectiveAttribute(p, 'pas') * 0.40 +
        getEffectiveAttribute(p, 'tec') * 0.20;
      // Meia com Fin destacada contribui pro ataque
      if (p.highlighted_attr_1 === 'fin' || p.highlighted_attr_2 === 'fin') {
        attack += getEffectiveAttribute(p, 'fin') * 0.30;
      }
    } else if (p.position === 'Z') {
      defense +=
        getEffectiveAttribute(p, 'des') * 0.40 +
        getEffectiveAttribute(p, 'mar') * 0.40 +
        getEffectiveAttribute(p, 'cab') * 0.20;
    } else if (p.position === 'L') {
      defense +=
        getEffectiveAttribute(p, 'des') * 0.35 +
        getEffectiveAttribute(p, 'mar') * 0.35 +
        getEffectiveAttribute(p, 'vel') * 0.20 +
        getEffectiveAttribute(p, 'res') * 0.10;
      // Lateral com Vel/Pas destacada cruzador — ataque
      const hasOffHighlight =
        p.highlighted_attr_1 === 'vel' || p.highlighted_attr_2 === 'vel' ||
        p.highlighted_attr_1 === 'pas' || p.highlighted_attr_2 === 'pas';
      if (hasOffHighlight) {
        attack += getEffectiveAttribute(p, 'vel') * 0.15;
      }
    } else if (p.position === 'G') {
      defense +=
        getEffectiveAttribute(p, 'gol') * 0.50 +
        getEffectiveAttribute(p, 'ref') * 0.30 +
        getEffectiveAttribute(p, 'col') * 0.20;
    }
  }

  const sb = STYLE_BONUS[style];
  return {
    attack:   attack   * sb.atk,
    defense:  defense  * sb.def,
    midfield,
  };
}

// ── IA — força de time sem lineup explícito ──────────────────

export function calcAITeamForce(players: Player[]): TeamForce {
  const top11 = [...players].sort((a, b) => b.force - a.force).slice(0, 11);
  return calculateTeamForce(top11.map((p) => p.id), (id) => top11.find((p) => p.id === id), 'balanced');
}

// ── Formato das características destacadas ───────────────────

export function formatHighlights(player: Player): string {
  const h1 = player.highlighted_attr_1 ? ATTR_LABEL[player.highlighted_attr_1] : null;
  const h2 = player.highlighted_attr_2 ? ATTR_LABEL[player.highlighted_attr_2] : null;
  if (!h1 && !h2) return '—';
  // Abreviação de 3 letras
  const abbr = (s: string) => s.slice(0, 3);
  if (h1 && h2) return `${abbr(h1)}/${abbr(h2)}`;
  return abbr(h1 ?? h2 ?? '');
}

// ── Cor de valor de atributo (para UI) ───────────────────────

export function attrColor(value: number): string {
  if (value >= 18) return '#f5d020'; // dourado
  if (value >= 13) return '#4ade80'; // verde
  if (value >= 8)  return '#f5d020'; // amarelo
  return '#ef4444';                   // vermelho
}

// ── Posições válidas para cada slot de formação ───────────────

export const FORMATION_POS_SLOTS: Record<string, Position[]> = {
  '4-4-2':   ['G','Z','Z','Z','Z','M','M','M','M','A','A'],
  '4-3-3':   ['G','Z','Z','Z','Z','M','M','M','A','A','A'],
  '4-2-3-1': ['G','Z','Z','Z','Z','M','M','M','M','M','A'],
  '3-5-2':   ['G','Z','Z','Z','M','M','M','M','M','A','A'],
};
