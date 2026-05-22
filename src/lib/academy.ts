import type { JuniorPlayer, Academy, CpeStars } from '../types/academy';
import { CPE_POTENTIAL_BASE, CPE_GROWTH_RATE, CAPACITY_BY_TIER } from '../types/academy';
import type { Career, Team, Player, Position, Side, PlayerAttributes, AttrKey } from '../types';
import { PRIMARY_ATTRS, ALL_ATTRS_BY_POS, ATTR_LABEL } from '../types';
import { calculateForce } from './simulation/playerAttributes';
import { mulberry32, hashStr } from './simulation/prng';

// ── Nomes de base para geração ────────────────────────────────

const FIRST_NAMES = [
  'Robert', 'Augusto', 'Gideon', 'Jeremias', 'Chicão', 'Mateus', 'Davi', 'Elias',
  'Samuel', 'Felipe', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'André', 'Bruno',
  'Caio', 'Diego', 'Eduardo', 'Fábio', 'Henrique', 'Igor', 'Júlio', 'Kaique',
  'Leonardo', 'Murilo', 'Natan', 'Osmar', 'Patrick', 'Quévin', 'Renato', 'Sérgio',
  'Tiago', 'Ulisses', 'Vinícius', 'Wagner', 'Xavier', 'Yago', 'Zé Carlos',
];

const LAST_NAMES = [
  'Holanda', 'Santos', 'Lima', 'Costa', 'Pereira', 'Ferreira', 'Alves', 'Silva',
  'Oliveira', 'Rodrigues', 'Araújo', 'Carvalho', 'Gomes', 'Cardoso', 'Nunes',
  'Martins', 'Brito', 'Mendes', 'Dias', 'Ramos', 'Monteiro', 'Souza', 'Cruz',
  'Lopes', 'Ribeiro', 'Reis', 'Teixeira', 'Torres', 'Vieira', 'Barbosa',
];

// ── Helpers de geração ────────────────────────────────────────

function pickRng<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

let _globalJuniorId = 10_000;
export function nextJuniorId(): number {
  return ++_globalJuniorId;
}

/** Gera atributos scaled para uma força alvo */
function generateAttributesForForce(position: Position, targetForce: number): PlayerAttributes {
  const attrs: Partial<PlayerAttributes> = {};
  const allAttrs = ALL_ATTRS_BY_POS[position];

  for (const key of allAttrs) {
    const isPrimary = PRIMARY_ATTRS[position].includes(key);
    const base = isPrimary
      ? clamp(targetForce + Math.round((Math.random() - 0.3) * 4), 1, 20)
      : clamp(targetForce - 2 + Math.round((Math.random() - 0.5) * 4), 1, 20);
    attrs[key] = base;
  }

  // Universais obrigatórios
  if (!attrs.vel) attrs.vel = clamp(targetForce - 1, 1, 20);
  if (!attrs.cab) attrs.cab = clamp(targetForce - 2, 1, 20);
  if (!attrs.tec) attrs.tec = clamp(targetForce - 1, 1, 20);
  if (!attrs.fal) attrs.fal = clamp(targetForce - 3, 1, 20);
  if (!attrs.pen) attrs.pen = clamp(targetForce - 3, 1, 20);

  return attrs as PlayerAttributes;
}

/** Escala atributos para nova força alvo mantendo proporções */
function scaleAttributes(attrs: PlayerAttributes, newForce: number, oldForce: number): PlayerAttributes {
  if (oldForce <= 0) return attrs;
  const ratio = newForce / oldForce;
  const scaled: Partial<PlayerAttributes> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'number') {
      (scaled as Record<string, number>)[k] = clamp(Math.round(v * ratio), 1, 20);
    }
  }
  return scaled as PlayerAttributes;
}

/** Escolhe uma característica destacada válida para a posição */
function randomHighlightForPosition(position: Position, rng: () => number): AttrKey {
  const pool = PRIMARY_ATTRS[position];
  return pickRng(pool, rng);
}

// ── Gerar um júnior aleatório ─────────────────────────────────

export function generateRandomJunior(
  team: Team,
  careerId: string,
  rng: () => number,
): JuniorPlayer {
  const positions: Position[] = ['G', 'Z', 'Z', 'L', 'M', 'M', 'M', 'A', 'A'];
  const sides: Side[]         = ['D', 'D', 'D', 'E', 'E', 'A'];

  const position = pickRng(positions, rng);
  const side     = pickRng(sides, rng);
  const age      = pickRng([16, 16, 17, 17, 18, 19, 20], rng);

  // CPE — top tier descobre mais estrelas
  const tierBonus = team.tier === 'top' ? 0.12 : team.tier === 'strong' ? 0.06 : 0;
  const cpeRoll   = rng();
  let cpe_stars: CpeStars;
  if (cpeRoll < 0.02)                     cpe_stars = 5;
  else if (cpeRoll < 0.10 + tierBonus)    cpe_stars = 4;
  else if (cpeRoll < 0.40 + tierBonus)    cpe_stars = 3;
  else if (cpeRoll < 0.80)                cpe_stars = 2;
  else                                     cpe_stars = 1;

  // Potencial real (pode ser ±1 do que o CPE indica)
  const potBase     = CPE_POTENTIAL_BASE[cpe_stars];
  const potVariance = Math.round((rng() - 0.3) * 3);
  const potential_force = clamp(potBase + potVariance, 1, 20);

  // Desenvolvimento inicial (16 anos = menos desenvolvido)
  const minDev = Math.max(10, (age - 16) * 12 + 10);
  const maxDev = Math.min(70, (age - 16) * 15 + 30);
  const development_percent = minDev + Math.floor(rng() * (maxDev - minDev));

  // Força atual
  const current_force = Math.max(1, Math.round(potential_force * (development_percent / 100)));
  const current_attributes = generateAttributesForForce(position, current_force);

  // Característica destacada potencial (olheiros podem ter identificado)
  let potential_highlighted_1: AttrKey | undefined;
  let potential_highlighted_2: AttrKey | undefined;
  let revealed_highlight_1: AttrKey | undefined;

  if (rng() < cpe_stars * 0.12) {
    potential_highlighted_1 = randomHighlightForPosition(position, rng);
  }
  if (potential_highlighted_1 && rng() < cpe_stars * 0.06) {
    do {
      potential_highlighted_2 = randomHighlightForPosition(position, rng);
    } while (potential_highlighted_2 === potential_highlighted_1);
  }

  // Característica revelada se já desenvolvido o suficiente
  if (potential_highlighted_1 && development_percent >= 40) {
    revealed_highlight_1 = potential_highlighted_1;
  }

  // Finanças
  const estimated_value = 26_000 + cpe_stars * 5_000 + Math.floor(rng() * 10_000);
  const weekly_wage     = 700 + cpe_stars * 150 + Math.floor(rng() * 100);

  const firstName = pickRng(FIRST_NAMES, rng);
  const lastName  = pickRng(LAST_NAMES, rng);

  return {
    id: nextJuniorId(),
    career_id: careerId,
    team_id: team.id,
    full_name: `${firstName} ${lastName}`,
    position,
    side,
    age,
    country: 'BRA',
    development_percent,
    current_attributes,
    current_force,
    cpe_stars,
    potential_force,
    potential_highlighted_1,
    potential_highlighted_2,
    revealed_highlight_1,
    estimated_value,
    weekly_wage,
  };
}

// ── Gerar academia inicial ────────────────────────────────────

export function generateInitialAcademy(team: Team, careerId: string): Academy {
  const capacity = CAPACITY_BY_TIER[team.tier ?? 'mid'];
  const initialCount = Math.floor(capacity * 0.4);

  const seed = hashStr(careerId + team.id.toString());
  const rng  = mulberry32(seed);

  const juniors: JuniorPlayer[] = [];
  for (let i = 0; i < initialCount; i++) {
    juniors.push(generateRandomJunior(team, careerId, rng));
  }

  return { career_id: careerId, team_id: team.id, capacity, juniors };
}

// ── Desenvolvimento por rodada ────────────────────────────────

export function developJuniors(academy: Academy, round: number, careerId: string): Academy {
  const seed = hashStr(careerId + 'dev' + round);
  const rng  = mulberry32(seed);

  const juniors = academy.juniors.map((jr) => {
    const baseGrowth = CPE_GROWTH_RATE[jr.cpe_stars];
    const growth     = baseGrowth * (0.7 + rng() * 0.6);

    const newDev = Math.min(100, jr.development_percent + growth);
    const newForce = Math.max(1, Math.round(jr.potential_force * (newDev / 100)));

    let attrs = jr.current_attributes;
    if (newForce !== jr.current_force) {
      attrs = scaleAttributes(jr.current_attributes, newForce, Math.max(1, jr.current_force));
    }

    // Revelar característica destacada (2% por rodada se >= 40% desenvolvido)
    let rev1 = jr.revealed_highlight_1;
    let rev2 = jr.revealed_highlight_2;
    if (!rev1 && jr.potential_highlighted_1 && newDev >= 40 && rng() < 0.02) {
      rev1 = jr.potential_highlighted_1;
    }
    if (rev1 && !rev2 && jr.potential_highlighted_2 && newDev >= 60 && rng() < 0.01) {
      rev2 = jr.potential_highlighted_2;
    }

    // Atualizar valor estimado
    const estimated_value = Math.round(
      26_000 + jr.cpe_stars * 5_000 + newForce * 2_000
    );

    return {
      ...jr,
      development_percent: Math.round(newDev * 10) / 10,
      current_force: newForce,
      current_attributes: attrs,
      revealed_highlight_1: rev1,
      revealed_highlight_2: rev2,
      estimated_value,
    };
  });

  return { ...academy, juniors };
}

// ── Descoberta de novos juniores (a cada 5 rodadas) ───────────

export function discoverNewJuniors(
  academy: Academy,
  team: Team,
  round: number,
  careerId: string,
): { academy: Academy; discovered: JuniorPlayer | null } {
  const emptySlots = academy.capacity - academy.juniors.length;
  if (emptySlots <= 0) return { academy, discovered: null };

  const seed = hashStr(careerId + 'disc' + round);
  const rng  = mulberry32(seed);

  const baseChance = team.tier === 'top'    ? 0.40
                   : team.tier === 'strong' ? 0.28
                   : team.tier === 'mid'    ? 0.18
                   : 0.12;

  if (rng() > baseChance) return { academy, discovered: null };

  const newJr = generateRandomJunior(team, careerId, rng);
  return {
    academy: { ...academy, juniors: [...academy.juniors, newJr] },
    discovered: newJr,
  };
}

// ── Promoção pro elenco principal ─────────────────────────────

export function promoteJunior(
  career: Career,
  juniorId: number,
): { career: Career; promoted: Player | null; error?: string } {
  const academy = career.academy;
  if (!academy) return { career, promoted: null, error: 'Academia não encontrada' };

  const jr = academy.juniors.find((j) => j.id === juniorId);
  if (!jr) return { career, promoted: null, error: 'Júnior não encontrado' };

  // Limite do elenco
  // Estimativa: elenco padrão tem 25 jogadores, promovidos têm IDs > 50k
  // Conta player_states como proxy do tamanho do elenco
  const currentTeamCount = career.player_states.length;
  if (currentTeamCount >= 25) {
    return { career, promoted: null, error: 'Elenco lotado. Dispense alguém antes.' };
  }

  // Criar jogador a partir do júnior
  const newPlayer: Player = {
    id: juniorId + 50_000, // IDs de promovidos são > 50k
    team_id: career.team_id,
    name: jr.nickname ?? jr.full_name,
    position: jr.position,
    side: jr.side,
    age: jr.age,
    attributes: jr.current_attributes,
    force: jr.current_force,
    highlighted_attr_1: jr.revealed_highlight_1,
    highlighted_attr_2: jr.revealed_highlight_2,
    is_star: false,
    is_world_top: false,
  };

  // Recalcular força com atributos
  newPlayer.force = calculateForce(newPlayer);

  // Atualizar player_states
  const player_states = [
    ...career.player_states,
    {
      player_id: newPlayer.id,
      yellow_cards: 0,
      injury_until_round: null,
      suspended_until_round: null,
      fitness: 100,
      goals_season: 0,
      assists_season: 0,
      games_season: 0,
    },
  ];

  const updatedAcademy: Academy = {
    ...academy,
    juniors: academy.juniors.filter((j) => j.id !== juniorId),
  };

  return {
    career: { ...career, academy: updatedAcademy, player_states },
    promoted: newPlayer,
  };
}

// ── Dispensar júnior ─────────────────────────────────────────

export function dismissJunior(academy: Academy, juniorId: number): Academy {
  return { ...academy, juniors: academy.juniors.filter((j) => j.id !== juniorId) };
}

// ── Definir apelido ───────────────────────────────────────────

export function setJuniorNickname(academy: Academy, juniorId: number, nickname: string): Academy {
  return {
    ...academy,
    juniors: academy.juniors.map((j) =>
      j.id === juniorId ? { ...j, nickname: nickname || undefined } : j
    ),
  };
}

// ── Fim de temporada: envelhecer e promover/dispensar aos 21 ──

export function processAcademyAging(
  career: Career,
): { career: Career; notifications: string[] } {
  const academy = career.academy;
  if (!academy) return { career, notifications: [] };

  const notifications: string[] = [];
  let updatedCareer = { ...career };

  const remaining: JuniorPlayer[] = [];

  for (const jr of academy.juniors) {
    const agedJr = { ...jr, age: jr.age + 1 };

    if (agedJr.age >= 21) {
      // Tentar promover se bem desenvolvido
      if (agedJr.development_percent >= 65) {
        const result = promoteJunior(updatedCareer, agedJr.id);
        if (!result.error && result.promoted) {
          updatedCareer = result.career;
          notifications.push(
            `⭐ ${agedJr.full_name} foi promovido ao elenco principal! (F:${agedJr.current_force})`
          );
          continue;
        }
      }
      // Dispensar
      notifications.push(
        `${agedJr.full_name} foi dispensado da base (21 anos, dev: ${Math.round(agedJr.development_percent)}%).`
      );
    } else {
      remaining.push(agedJr);
    }
  }

  const updatedAcademy: Academy = {
    ...academy,
    juniors: remaining,
  };

  return {
    career: { ...updatedCareer, academy: updatedAcademy },
    notifications,
  };
}

// ── Formatar CPE em estrelas ──────────────────────────────────

export function formatCpe(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

// ── Formatar características reveladas ───────────────────────



export function formatRevealedHighlights(jr: JuniorPlayer): string {
  const h1 = jr.revealed_highlight_1 ? (ATTR_LABEL[jr.revealed_highlight_1] ?? jr.revealed_highlight_1).slice(0, 3) : null;
  const h2 = jr.revealed_highlight_2 ? (ATTR_LABEL[jr.revealed_highlight_2] ?? jr.revealed_highlight_2).slice(0, 3) : null;
  if (!h1 && !h2) return '—';
  if (h1 && h2) return `${h1}/${h2}`;
  return h1 ?? h2 ?? '—';
}
