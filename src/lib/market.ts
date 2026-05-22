import type {
  MarketState, TransferListing, TransferOffer, Transfer,
  TeamPersonality, PlayerContract, MarketWindow, ContractRenewalProposal,
} from '../types/market';
import type { Career, Player, PlayerState } from '../types';
import { PLAYERS, TEAMS, getTeamById } from '../data';
import { uuid } from './utils';
import { formatCurrency } from './finance';
import { mulberry32, hashStr } from './simulation/prng';

// ── Personalidades dos times ──────────────────────────────────

const PERSONALITIES: Record<number, TeamPersonality> = {
  1:  { team_id: 1,  philosophy: 'star_collector', preferred_style: 'offensive', spending_aggressiveness: 0.85 }, // FLA
  2:  { team_id: 2,  philosophy: 'star_collector', preferred_style: 'balanced',  spending_aggressiveness: 0.80 }, // PAL
  3:  { team_id: 3,  philosophy: 'balanced',        preferred_style: 'offensive', spending_aggressiveness: 0.75 }, // ATM
  4:  { team_id: 4,  philosophy: 'balanced',        preferred_style: 'balanced',  spending_aggressiveness: 0.65 }, // FLU
  5:  { team_id: 5,  philosophy: 'balanced',        preferred_style: 'defensive', spending_aggressiveness: 0.60 }, // COR
  6:  { team_id: 6,  philosophy: 'balanced',        preferred_style: 'balanced',  spending_aggressiveness: 0.60 }, // SPF
  7:  { team_id: 7,  philosophy: 'youth_focused',   preferred_style: 'balanced',  spending_aggressiveness: 0.65 }, // INT
  8:  { team_id: 8,  philosophy: 'youth_focused',   preferred_style: 'defensive', spending_aggressiveness: 0.60 }, // GRE
  9:  { team_id: 9,  philosophy: 'youth_focused',   preferred_style: 'offensive', spending_aggressiveness: 0.55 }, // CAP
  10: { team_id: 10, philosophy: 'balanced',        preferred_style: 'balanced',  spending_aggressiveness: 0.50 }, // BOT
  11: { team_id: 11, philosophy: 'balanced',        preferred_style: 'balanced',  spending_aggressiveness: 0.50 }, // VAS
  12: { team_id: 12, philosophy: 'balanced',        preferred_style: 'offensive', spending_aggressiveness: 0.50 }, // SAN
  13: { team_id: 13, philosophy: 'balanced',        preferred_style: 'balanced',  spending_aggressiveness: 0.45 }, // CRU
  14: { team_id: 14, philosophy: 'survival',        preferred_style: 'balanced',  spending_aggressiveness: 0.35 }, // BAH
  15: { team_id: 15, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.35 }, // FOR
  16: { team_id: 16, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.25 }, // CEA
  17: { team_id: 17, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.25 }, // VIT
  18: { team_id: 18, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.20 }, // JUV
  19: { team_id: 19, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.20 }, // CUI
  20: { team_id: 20, philosophy: 'survival',        preferred_style: 'defensive', spending_aggressiveness: 0.20 }, // SPT
};

export function getPersonality(teamId: number): TeamPersonality {
  return PERSONALITIES[teamId] ?? {
    team_id: teamId,
    philosophy: 'balanced',
    preferred_style: 'balanced',
    spending_aggressiveness: 0.4,
  };
}

// ── Valor de mercado ──────────────────────────────────────────

const AGE_MULTIPLIER: Record<number, number> = {
  16:1.4, 17:1.4, 18:1.5, 19:1.5, 20:1.4, 21:1.3, 22:1.2,
  23:1.15, 24:1.1, 25:1.0, 26:1.0, 27:0.95, 28:0.85,
  29:0.75, 30:0.65, 31:0.55, 32:0.45, 33:0.35, 34:0.25,
};

export function calculateMarketValue(
  player: Player,
  _state?: PlayerState,
  contract?: PlayerContract,
  currentSeason?: number,
): number {
  // Base por força (curva exponencial)
  let value = Math.pow(player.force, 2.5) * 100_000;

  // Posição
  const posMultiplier = { G: 0.85, Z: 0.90, L: 0.90, M: 1.0, A: 1.20 }[player.position] ?? 1.0;
  value *= posMultiplier;

  // Idade
  value *= AGE_MULTIPLIER[player.age] ?? 0.15;

  // Estrela
  if (player.is_world_top) value *= 3.5;
  else if (player.is_star)  value *= 1.8;

  // Características destacadas
  if (player.highlighted_attr_1) value *= 1.2;
  if (player.highlighted_attr_2) value *= 1.3;

  // Contrato expirando
  if (contract && currentSeason !== undefined) {
    const yearsLeft = contract.contract_until_season - currentSeason;
    if (yearsLeft <= 0)     value *= 0.4;
    else if (yearsLeft === 1) value *= 0.75;
  }

  return Math.max(50_000, Math.round(value / 10_000) * 10_000);
}

// ── Salário sugerido ──────────────────────────────────────────

export function suggestedWeeklyWage(player: Player): number {
  const base = Math.pow(player.force / 20, 2.5) * 500_000;
  if (player.is_world_top) return Math.round(base * 1.5 / 1000) * 1000;
  if (player.is_star)      return Math.round(base * 1.2 / 1000) * 1000;
  return Math.round(base / 1000) * 1000;
}

// ── Janelas de transferência ──────────────────────────────────

export function getWindowForRound(round: number): MarketWindow {
  if (round >= 1 && round <= 5)   return 'summer';
  if (round >= 20 && round <= 25) return 'winter';
  return null;
}

export function createDefaultMarketState(careerId: string): MarketState {
  return {
    career_id: careerId,
    is_open: false,
    current_window: null,
    closes_at_round: null,
    listings: [],
    pending_offers_to_user: [],
    pending_offers_from_user: [],
    history: [],
    notifications: [],
  };
}

export function createDefaultContracts(careerId: string, teamId: number, currentSeason: number): PlayerContract[] {
  const players = PLAYERS.filter((p) => p.team_id === teamId);
  return players.map((p) => ({
    player_id: p.id,
    career_id: careerId,
    weekly_wage: suggestedWeeklyWage(p),
    contract_until_season: currentSeason + 2 + Math.floor(Math.random() * 3),
    release_clause: calculateMarketValue(p) * 2,
  }));
}

// ── Abrir / fechar mercado ────────────────────────────────────

export function openMarketWindow(
  career: Career,
  window: MarketWindow,
): { career: Career; notifications: string[] } {
  if (!window || !career.market_state) return { career, notifications: [] };

  const round = career.current_round;
  const notifications: string[] = [
    `🏪 Janela de transferências ${window === 'summer' ? 'de verão' : 'de inverno'} aberta! (até rodada ${round + 5})`,
  ];

  let market: MarketState = {
    ...career.market_state,
    is_open: true,
    current_window: window as MarketWindow,
    closes_at_round: round + 5,
    notifications: [],
  };

  // CPU toma decisões de mercado
  const result = runCPUTransferDecisions({ ...career, market_state: market });
  market = result.market;
  notifications.push(...result.notifications);

  return {
    career: { ...career, market_state: market },
    notifications,
  };
}

export function closeMarketWindow(market: MarketState): MarketState {
  // Expirar propostas pendentes
  const updatedFrom = market.pending_offers_from_user.map((o) =>
    o.status === 'pending' ? { ...o, status: 'expired' as const } : o
  );
  return {
    ...market,
    is_open: false,
    current_window: null,
    closes_at_round: null,
    pending_offers_from_user: updatedFrom,
  };
}

// ── IA CPU: decisões de mercado ───────────────────────────────

interface CPUResult {
  market: MarketState;
  notifications: string[];
}

function identifyWeakPositions(teamId: number): string[] {
  const teamPlayers = PLAYERS.filter((p) => p.team_id === teamId);
  const positions = ['G', 'Z', 'L', 'M', 'A'];
  const weak: string[] = [];

  const MIN_COUNT: Record<string, number> = { G: 2, Z: 4, L: 2, M: 5, A: 3 };

  for (const pos of positions) {
    const posPlayers = teamPlayers.filter((p) => p.position === pos);
    if (posPlayers.length < (MIN_COUNT[pos] ?? 2)) {
      weak.push(pos);
    } else {
      const avgForce = posPlayers.reduce((s, p) => s + p.force, 0) / posPlayers.length;
      if (avgForce < 8) weak.push(pos);
    }
  }

  return weak;
}

function identifySurplus(teamId: number): Player[] {
  const teamPlayers = PLAYERS.filter((p) => p.team_id === teamId);
  const MAX_COUNT: Record<string, number> = { G: 3, Z: 7, L: 5, M: 9, A: 6 };

  const surplus: Player[] = [];
  const positions = ['G', 'Z', 'L', 'M', 'A'];

  for (const pos of positions) {
    const posPlayers = teamPlayers
      .filter((p) => p.position === pos)
      .sort((a, b) => a.force - b.force);

    const max = MAX_COUNT[pos] ?? 4;
    if (posPlayers.length > max) {
      surplus.push(...posPlayers.slice(0, posPlayers.length - max));
    }
  }

  return surplus.slice(0, 3); // max 3 vendas por janela
}

export function runCPUTransferDecisions(career: Career): CPUResult {
  let market = { ...career.market_state! };
  const notifications: string[] = [];
  const round = career.current_round;
  const seed = hashStr(career.id + 'cpu' + round);
  const rng  = mulberry32(seed);

  const cpuTeamIds = TEAMS
    .filter((t) => t.id !== career.team_id)
    .map((t) => t.id);

  for (const teamId of cpuTeamIds) {
    const personality = getPersonality(teamId);
    const team = getTeamById(teamId);
    if (!team) continue;

    // Listar excessos pra venda
    const surplus = identifySurplus(teamId);
    for (const player of surplus) {
      const alreadyListed = market.listings.some((l) => l.player_id === player.id);
      if (!alreadyListed) {
        const fairValue = calculateMarketValue(player);
        market = {
          ...market,
          listings: [...market.listings, {
            player_id: player.id,
            asking_price: Math.round(fairValue * (0.85 + rng() * 0.3)),
            listed_by_team_id: teamId,
            listed_at_round: round,
            is_loan_only: false,
          }],
        };
      }
    }

    // Identificar carências e tentar comprar
    const weakPositions = identifyWeakPositions(teamId);
    if (weakPositions.length === 0) continue;

    // Budget disponível baseado na personalidade
    // Sem finances de CPU no MVP, estimamos por tier
    const tier = team.tier ?? 'mid';
    const budgetByTier = { top: 5_000_000, strong: 2_000_000, mid: 800_000, bottom: 300_000 };
    const budget = budgetByTier[tier] * personality.spending_aggressiveness;

    for (const pos of weakPositions.slice(0, 2)) {
      // Encontrar candidatos disponíveis (de outros times CPU ou listados)
      const candidates = PLAYERS
        .filter((p) =>
          p.position === pos &&
          p.team_id !== teamId &&
          p.team_id !== career.team_id && // CPU não compra do user automaticamente (só com proposta)
          calculateMarketValue(p) <= budget
        )
        .sort((a, b) => {
          if (personality.philosophy === 'youth_focused') return a.age - b.age;
          if (personality.philosophy === 'star_collector') return b.force - a.force;
          return b.force - a.force;
        });

      const target = candidates[0];
      if (!target || rng() > 0.4) continue; // 40% de chance de executar por rodada

      // CPU→CPU transferência direta
      const fee = Math.round(calculateMarketValue(target) * (0.85 + rng() * 0.2));
      const transfer: Transfer = {
        round,
        season: career.season,
        player_id: target.id,
        player_name: target.name,
        from_team_id: target.team_id,
        to_team_id: teamId,
        fee,
        is_free_transfer: false,
        is_loan: false,
      };

      market = {
        ...market,
        history: [...market.history, transfer],
        listings: market.listings.filter((l) => l.player_id !== target.id),
      };
    }

    // CPU tenta comprar jogador do user (5% de chance por rodada)
    if (rng() < 0.05) {
      const userPlayers = PLAYERS.filter((p) => p.team_id === career.team_id);
      const targetUser = userPlayers[Math.floor(rng() * userPlayers.length)];
      if (targetUser) {
        const fairValue = calculateMarketValue(targetUser);
        const offerAmount = Math.round(fairValue * (team.tier === 'top' ? 1.0 : 0.85));
        const alreadyPending = market.pending_offers_to_user.some(
          (o) => o.player_id === targetUser.id && o.status === 'pending'
        );
        if (!alreadyPending) {
          const offer: TransferOffer = {
            id: uuid(),
            player_id: targetUser.id,
            from_team_id: teamId,
            to_team_id: career.team_id,
            amount: offerAmount,
            status: 'pending',
            created_at_round: round,
          };
          market = { ...market, pending_offers_to_user: [...market.pending_offers_to_user, offer] };
          notifications.push(
            `💰 ${team.short_name} oferece ${formatCurrency(offerAmount)} por ${targetUser.name}`
          );
        }
      }
    }
  }

  return { market, notifications };
}

// ── Fazer proposta de compra (user) ───────────────────────────

export function submitOffer(
  career: Career,
  playerId: number,
  amount: number,
): { career: Career; error?: string } {
  if (!career.market_state?.is_open) {
    return { career, error: 'Mercado fechado. Aguarde a janela de transferências.' };
  }

  if ((career.finances?.cash_balance ?? 0) < amount) {
    return { career, error: 'Saldo insuficiente.' };
  }

  const target = PLAYERS.find((p) => p.id === playerId);
  if (!target) return { career, error: 'Jogador não encontrado.' };

  if (target.team_id === career.team_id) {
    return { career, error: 'Esse jogador já é seu!' };
  }

  const alreadyPending = career.market_state.pending_offers_from_user.some(
    (o) => o.player_id === playerId && o.status === 'pending'
  );
  if (alreadyPending) return { career, error: 'Já existe uma proposta pendente para este jogador.' };

  const offer: TransferOffer = {
    id: uuid(),
    player_id: playerId,
    from_team_id: career.team_id,
    to_team_id: target.team_id,
    amount,
    status: 'pending',
    created_at_round: career.current_round,
  };

  // Avaliar imediatamente (CPU responde)
  const evaluated = evaluateOffer(career, offer);
  const market = {
    ...career.market_state,
    pending_offers_from_user: [...career.market_state.pending_offers_from_user, evaluated],
  };

  return { career: { ...career, market_state: market } };
}

function evaluateOffer(career: Career, offer: TransferOffer): TransferOffer {
  const player = PLAYERS.find((p) => p.id === offer.player_id);
  if (!player) return { ...offer, status: 'rejected' };

  const sellingTeam = getTeamById(offer.to_team_id);
  const fairValue = calculateMarketValue(player);
  const ratio = offer.amount / fairValue;

  // Jogador essencial?
  const teamPlayers = PLAYERS.filter((p) => p.team_id === offer.to_team_id);
  const isKey = teamPlayers.filter((p) => p.position === player.position).length <= 2
    && player.force >= 12;

  if (isKey && ratio < 1.3) {
    return { ...offer, status: 'rejected', responded_at_round: career.current_round };
  }

  if (ratio < 0.65) {
    return { ...offer, status: 'rejected', responded_at_round: career.current_round };
  }

  if (ratio < 0.85) {
    const counter = Math.round(fairValue * (sellingTeam?.tier === 'top' ? 1.0 : 0.92));
    return { ...offer, status: 'countered', counter_amount: counter, responded_at_round: career.current_round };
  }

  // Aceitar → executar transferência
  return { ...offer, status: 'accepted', responded_at_round: career.current_round };
}

// ── Completar transferência (após proposta aceita) ────────────

export function completeTransfer(
  career: Career,
  offer: TransferOffer,
): { career: Career; error?: string } {
  if (offer.status !== 'accepted') {
    return { career, error: 'Proposta não foi aceita.' };
  }

  const player = PLAYERS.find((p) => p.id === offer.player_id);
  if (!player) return { career, error: 'Jogador não encontrado.' };

  // Deduzir valor das finanças
  const finances = career.finances
    ? {
        ...career.finances,
        cash_balance: career.finances.cash_balance - offer.amount,
        expenses: {
          ...career.finances.expenses,
          player_purchases: career.finances.expenses.player_purchases + offer.amount,
        },
      }
    : career.finances;

  // Adicionar ao histórico
  const transfer: Transfer = {
    round: career.current_round,
    season: career.season,
    player_id: player.id,
    player_name: player.name,
    from_team_id: offer.to_team_id,
    to_team_id: career.team_id,
    fee: offer.amount,
    is_free_transfer: false,
    is_loan: false,
  };

  // Adicionar contrato do jogador comprado
  const newContract: PlayerContract = {
    player_id: player.id,
    career_id: career.id,
    weekly_wage: suggestedWeeklyWage(player),
    contract_until_season: career.season + 3,
    release_clause: calculateMarketValue(player) * 2.5,
  };

  // Atualizar player_states
  const player_states = [
    ...career.player_states.filter((ps) => ps.player_id !== player.id),
    {
      player_id: player.id,
      yellow_cards: 0,
      injury_until_round: null,
      suspended_until_round: null,
      fitness: 100,
      goals_season: 0,
      assists_season: 0,
      games_season: 0,
    },
  ];

  const updatedOffers = career.market_state!.pending_offers_from_user.map((o) =>
    o.id === offer.id ? { ...o, status: 'accepted' as const } : o
  );

  const market = {
    ...career.market_state!,
    history: [...career.market_state!.history, transfer],
    pending_offers_from_user: updatedOffers,
  };

  const contracts = [
    ...(career.contracts ?? []).filter((c) => c.player_id !== player.id),
    newContract,
  ];

  return {
    career: { ...career, finances, market_state: market, contracts, player_states },
  };
}

// ── Aceitar proposta recebida (user vende jogador) ────────────

export function acceptIncomingOffer(
  career: Career,
  offerId: string,
): { career: Career; error?: string } {
  const offer = career.market_state?.pending_offers_to_user.find((o) => o.id === offerId);
  if (!offer) return { career, error: 'Proposta não encontrada.' };

  const player = PLAYERS.find((p) => p.id === offer.player_id);
  if (!player) return { career, error: 'Jogador não encontrado.' };

  // Adicionar dinheiro
  const finances = career.finances
    ? {
        ...career.finances,
        cash_balance: career.finances.cash_balance + offer.amount,
        revenue: {
          ...career.finances.revenue,
          player_sales: career.finances.revenue.player_sales + offer.amount,
        },
      }
    : career.finances;

  const transfer: Transfer = {
    round: career.current_round,
    season: career.season,
    player_id: player.id,
    player_name: player.name,
    from_team_id: career.team_id,
    to_team_id: offer.from_team_id,
    fee: offer.amount,
    is_free_transfer: false,
    is_loan: false,
  };

  const market: MarketState = {
    ...career.market_state!,
    history: [...career.market_state!.history, transfer],
    pending_offers_to_user: career.market_state!.pending_offers_to_user.map((o) =>
      o.id === offerId ? { ...o, status: 'accepted' as const } : o
    ),
  };

  // Remover player_states do jogador vendido
  const player_states = career.player_states.filter((ps) => ps.player_id !== player.id);
  const contracts = (career.contracts ?? []).filter((c) => c.player_id !== player.id);

  return {
    career: { ...career, finances, market_state: market, contracts, player_states },
  };
}

// ── Rejeitar proposta recebida ────────────────────────────────

export function rejectIncomingOffer(career: Career, offerId: string): Career {
  if (!career.market_state) return career;
  const market: MarketState = {
    ...career.market_state,
    pending_offers_to_user: career.market_state.pending_offers_to_user.map((o) =>
      o.id === offerId ? { ...o, status: 'rejected' as const } : o
    ),
  };
  return { ...career, market_state: market };
}

// ── Listar jogador do user para venda ────────────────────────

export function listUserPlayerForSale(
  career: Career,
  playerId: number,
  askingPrice: number,
): Career {
  if (!career.market_state) return career;
  const existing = career.market_state.listings.find((l) => l.player_id === playerId);
  if (existing) return career;

  const listing: TransferListing = {
    player_id: playerId,
    asking_price: askingPrice,
    listed_by_team_id: career.team_id,
    listed_at_round: career.current_round,
    is_loan_only: false,
  };

  return {
    ...career,
    market_state: {
      ...career.market_state,
      listings: [...career.market_state.listings, listing],
    },
  };
}

export function delistUserPlayer(career: Career, playerId: number): Career {
  if (!career.market_state) return career;
  return {
    ...career,
    market_state: {
      ...career.market_state,
      listings: career.market_state.listings.filter((l) => l.player_id !== playerId),
    },
  };
}

// ── Renovação de contrato ─────────────────────────────────────

export function generateRenewalProposal(
  player: Player,
  contract: PlayerContract,
): ContractRenewalProposal {
  const raise = player.force >= 15 ? 1.2 : player.force >= 10 ? 1.1 : 1.05;
  return {
    player_id: player.id,
    current_wage: contract.weekly_wage,
    proposed_wage: Math.round(contract.weekly_wage * raise / 1000) * 1000,
    proposed_seasons: 3,
    deadline_round: 38, // fim da temporada
  };
}

// ── Processar mercado por rodada ──────────────────────────────

export function processMarketRound(career: Career): {
  career: Career;
  notifications: string[];
} {
  const round = career.current_round;
  const notifications: string[] = [];

  if (!career.market_state) return { career, notifications };

  let market = { ...career.market_state };

  // Fechar janela se chegou a hora
  if (market.is_open && market.closes_at_round !== null && round >= market.closes_at_round) {
    market = closeMarketWindow(market);
    notifications.push('🔒 Janela de transferências encerrada.');
    return { career: { ...career, market_state: market }, notifications };
  }

  // Abrir janela se deve abrir
  if (!market.is_open) {
    const window = getWindowForRound(round);
    if (window) {
      const result = openMarketWindow({ ...career, market_state: market }, window);
      notifications.push(...result.notifications);
      return { career: result.career, notifications };
    }
  }

  return { career: { ...career, market_state: market }, notifications };
}

// ── Contrapropor ──────────────────────────────────────────────

export function counterOffer(career: Career, offerId: string, newAmount: number): Career {
  if (!career.market_state) return career;

  const offer = career.market_state.pending_offers_from_user.find((o) => o.id === offerId);
  if (!offer || offer.status !== 'countered') return career;

  // Re-avaliar com novo valor
  const newOffer: TransferOffer = { ...offer, amount: newAmount, status: 'pending' };
  const evaluated = evaluateOffer(career, newOffer);

  return {
    ...career,
    market_state: {
      ...career.market_state,
      pending_offers_from_user: career.market_state.pending_offers_from_user.map((o) =>
        o.id === offerId ? evaluated : o
      ),
    },
  };
}
