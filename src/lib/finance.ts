import type {
  Stadium, Finances, MatchRevenue,
  StadiumCapacity, StadiumPrices, StadiumSector,
} from '../types/finance';
import { SECTORS, SEAT_COST } from '../types/finance';
import type { Team } from '../types';

// ── Formatação de moeda estilo Brasfoot ───────────────────────

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs === 0) return '0 mil';
  if (abs < 1_000_000) {
    const k = Math.round(abs / 1000);
    return `${sign}${k} mil`;
  }
  const millions = Math.floor(abs / 1_000_000);
  const remainder = Math.round((abs % 1_000_000) / 1000);
  const mLabel = millions === 1 ? 'milhão' : 'milhões';
  if (remainder === 0) return `${sign}${millions} ${mLabel}`;
  return `${sign}${millions} ${mLabel} ${remainder} mil`;
}

export function formatCurrencyShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1000)} mil`;
  return `${sign}${abs}`;
}

// ── Capacidade default por tier ───────────────────────────────

const CAPACITY_BY_TIER: Record<string, StadiumCapacity> = {
  top:    { geral: 15_000, arquibancada: 25_000, cadeira: 15_000, camarote: 2_000 },
  strong: { geral:  8_000, arquibancada: 12_000, cadeira:  5_000, camarote:   800 },
  mid:    { geral:  3_000, arquibancada:  6_000, cadeira:  2_000, camarote:   300 },
  bottom: { geral:  2_000, arquibancada:  3_000, cadeira:    800, camarote:   100 },
};

const PRICES_DEFAULT: StadiumPrices = {
  geral: 3, arquibancada: 12, cadeira: 15, camarote: 30,
};

const SPONSORSHIP_BY_TIER: Record<string, number> = {
  top:    450_000,
  strong: 200_000,
  mid:     80_000,
  bottom:  30_000,
};

const CASH_BY_TIER: Record<string, number> = {
  top:    5_000_000,
  strong: 2_500_000,
  mid:    1_000_000,
  bottom:   500_000,
};

// ── Criar Stadium default ─────────────────────────────────────

export function createDefaultStadium(careerId: string, team: Team): Stadium {
  const tier = team.tier ?? 'mid';
  return {
    career_id: careerId,
    team_id: team.id,
    name: `Estádio ${team.short_name}`,
    capacity: { ...CAPACITY_BY_TIER[tier] },
    ticket_prices: { ...PRICES_DEFAULT },
    use_suggested_prices: true,
  };
}

export function totalStadiumCapacity(capacity: StadiumCapacity): number {
  return Object.values(capacity).reduce((s, v) => s + v, 0);
}

// ── Criar Finances default ────────────────────────────────────

export function createDefaultFinances(careerId: string, team: Team, season: number): Finances {
  const tier = team.tier ?? 'mid';
  const weeklySponsorship = Math.round(SPONSORSHIP_BY_TIER[tier] / 4);

  return {
    career_id: careerId,
    current_season: season,
    cash_balance: CASH_BY_TIER[tier],
    revenue: { tickets: 0, player_sales: 0, prizes: 0, sponsorship: 0, others: 0 },
    expenses: { player_purchases: 0, stadium: 0, wages: 0, loan_interest: 0, rescission_fines: 0, others: 0 },
    loan: { principal: 0, monthly_interest_rate: 0.02, monthly_interest_amount: 0 },
    sponsorship: {
      weekly_amount: weeklySponsorship,
      contract_until_round: 38,
    },
  };
}

// ── Preços sugeridos ──────────────────────────────────────────

export function getSuggestedPrices(importanceFactor: number): StadiumPrices {
  const base = PRICES_DEFAULT;
  return {
    geral:        Math.round(base.geral        * importanceFactor),
    arquibancada: Math.round(base.arquibancada  * importanceFactor),
    cadeira:      Math.round(base.cadeira       * importanceFactor),
    camarote:     Math.round(base.camarote      * importanceFactor),
  };
}

// ── Bilheteria por jogo ───────────────────────────────────────

export function calculateMatchRevenue(
  stadium: Stadium,
  opponentTier: string,
  userPosition: number,
): MatchRevenue {
  // Ocupação base
  let occupancy = 0.55;
  if (opponentTier === 'top')    occupancy += 0.15;
  if (opponentTier === 'strong') occupancy += 0.08;
  if (userPosition <= 3)         occupancy += 0.08;
  if (userPosition <= 10)        occupancy += 0.04;
  // Alguma aleatoriedade ±10%
  occupancy += (Math.random() - 0.5) * 0.2;
  occupancy = Math.max(0.2, Math.min(1.0, occupancy));

  const prices = stadium.use_suggested_prices
    ? getSuggestedPrices(1.0)
    : stadium.ticket_prices;

  const breakdown = SECTORS.map((sector) => {
    const seats = stadium.capacity[sector];
    const sold  = Math.round(seats * occupancy);
    const price = prices[sector];
    return { sector, seats, sold, price, revenue: sold * price };
  });

  const total = breakdown.reduce((s, b) => s + b.revenue, 0);
  return { total, occupancy, breakdown };
}

// ── Salários ──────────────────────────────────────────────────

/**
 * Salário semanal estimado por força (sem contratos explícitos ainda).
 * Fase 11 adiciona contratos reais.
 */
export function estimateWeeklyWage(force: number): number {
  // F:1 → ~1k, F:10 → ~50k, F:20 → ~500k
  const base = Math.pow(force / 20, 2.5) * 500_000;
  return Math.round(base / 1000) * 1000;
}

export function totalWeeklyWages(forces: number[]): number {
  return forces.reduce((s, f) => s + estimateWeeklyWage(f), 0);
}

export function totalMonthlyWages(forces: number[]): number {
  return totalWeeklyWages(forces) * 4;
}

// ── Aplicar patrocínio semanal ────────────────────────────────

export function applyWeeklySponsorship(finances: Finances, round: number): Finances {
  if (round > finances.sponsorship.contract_until_round) return finances;
  const amount = finances.sponsorship.weekly_amount;
  return {
    ...finances,
    cash_balance: finances.cash_balance + amount,
    revenue: { ...finances.revenue, sponsorship: finances.revenue.sponsorship + amount },
  };
}

// ── Aplicar salários mensais (a cada ~4 rodadas) ──────────────

export function applyMonthlySalaries(finances: Finances, forces: number[]): Finances {
  const monthly = totalMonthlyWages(forces);
  return {
    ...finances,
    cash_balance: finances.cash_balance - monthly,
    expenses: { ...finances.expenses, wages: finances.expenses.wages + monthly },
  };
}

// ── Aplicar bilheteria ────────────────────────────────────────

export function applyMatchRevenue(finances: Finances, revenue: MatchRevenue): Finances {
  return {
    ...finances,
    cash_balance: finances.cash_balance + revenue.total,
    revenue: { ...finances.revenue, tickets: finances.revenue.tickets + revenue.total },
  };
}

// ── Aplicar prêmio de partida ─────────────────────────────────

const MATCH_PRIZE: Record<string, number> = { W: 200_000, D: 80_000, L: 0 };

export function applyMatchPrize(finances: Finances, result: 'W' | 'D' | 'L'): Finances {
  const amount = MATCH_PRIZE[result] ?? 0;
  if (amount === 0) return finances;
  return {
    ...finances,
    cash_balance: finances.cash_balance + amount,
    revenue: { ...finances.revenue, prizes: finances.revenue.prizes + amount },
  };
}

// ── Juros de empréstimo ───────────────────────────────────────

export function applyMonthlyInterest(finances: Finances): Finances {
  if (finances.loan.principal <= 0) return finances;
  const interest = Math.round(finances.loan.principal * finances.loan.monthly_interest_rate);
  return {
    ...finances,
    cash_balance: finances.cash_balance - interest,
    loan: { ...finances.loan, monthly_interest_amount: interest },
    expenses: { ...finances.expenses, loan_interest: finances.expenses.loan_interest + interest },
  };
}

export function maxLoanAmount(finances: Finances): number {
  // Limite: 2x a receita de patrocínio mensal
  const monthlyRef = finances.sponsorship.weekly_amount * 8;
  const available = Math.max(0, monthlyRef * 2 - finances.loan.principal);
  return Math.round(available / 500_000) * 500_000;
}

export function takeLoan(finances: Finances, amount: number): Finances {
  return {
    ...finances,
    cash_balance: finances.cash_balance + amount,
    loan: {
      ...finances.loan,
      principal: finances.loan.principal + amount,
      monthly_interest_amount: Math.round((finances.loan.principal + amount) * finances.loan.monthly_interest_rate),
    },
  };
}

export function repayLoan(finances: Finances, amount: number): Finances {
  const actual = Math.min(amount, finances.loan.principal, Math.max(0, finances.cash_balance));
  if (actual <= 0) return finances;
  return {
    ...finances,
    cash_balance: finances.cash_balance - actual,
    loan: {
      ...finances.loan,
      principal: finances.loan.principal - actual,
      monthly_interest_amount: Math.round((finances.loan.principal - actual) * finances.loan.monthly_interest_rate),
    },
  };
}

// ── Expansão de estádio ───────────────────────────────────────

export function calcUpgradeCost(sector: StadiumSector, seats: number): number {
  return seats * SEAT_COST[sector];
}

export function calcUpgradeDuration(seats: number): number {
  return Math.max(1, Math.ceil(seats / 2000));
}

// ── Aplicar expansão concluída ────────────────────────────────

export function applyCompletedUpgrade(stadium: Stadium): Stadium {
  if (!stadium.upgrade_in_progress) return stadium;
  const { sector, additional_seats } = stadium.upgrade_in_progress;
  return {
    ...stadium,
    capacity: {
      ...stadium.capacity,
      [sector]: stadium.capacity[sector] + additional_seats,
    },
    upgrade_in_progress: undefined,
  };
}

// ── Receitas + despesas totais ────────────────────────────────

export function totalRevenue(f: Finances): number {
  return Object.values(f.revenue).reduce((s, v) => s + v, 0);
}

export function totalExpenses(f: Finances): number {
  return Object.values(f.expenses).reduce((s, v) => s + v, 0);
}

export function netBalance(f: Finances): number {
  return totalRevenue(f) - totalExpenses(f);
}
