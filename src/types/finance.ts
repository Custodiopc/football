// ── Estádio ──────────────────────────────────────────────────

export type StadiumSector = 'geral' | 'arquibancada' | 'cadeira' | 'camarote';

export interface StadiumCapacity {
  geral: number;
  arquibancada: number;
  cadeira: number;
  camarote: number;
}

export interface StadiumPrices {
  geral: number;
  arquibancada: number;
  cadeira: number;
  camarote: number;
}

export interface StadiumUpgrade {
  sector: StadiumSector;
  additional_seats: number;
  completes_at_round: number;
  cost: number;
}

export interface Stadium {
  career_id: string;
  team_id: number;
  name: string;
  capacity: StadiumCapacity;
  ticket_prices: StadiumPrices;
  use_suggested_prices: boolean;
  upgrade_in_progress?: StadiumUpgrade;
}

// ── Finanças ─────────────────────────────────────────────────

export interface FinanceRevenue {
  tickets: number;
  player_sales: number;
  prizes: number;
  sponsorship: number;
  others: number;
}

export interface FinanceExpenses {
  player_purchases: number;
  stadium: number;
  wages: number;
  loan_interest: number;
  rescission_fines: number;
  others: number;
}

export interface Loan {
  principal: number;
  monthly_interest_rate: number;   // ex: 0.02 = 2%/mês
  monthly_interest_amount: number; // pré-calculado
}

export interface Sponsorship {
  weekly_amount: number;
  contract_until_round: number;
}

export interface Finances {
  career_id: string;
  current_season: number;
  cash_balance: number;
  revenue: FinanceRevenue;
  expenses: FinanceExpenses;
  loan: Loan;
  sponsorship: Sponsorship;
}

// ── Contrato de jogador ──────────────────────────────────────

export interface PlayerContract {
  player_id: number;
  career_id: string;
  weekly_wage: number;
  contract_until_season: number;
  release_clause?: number;
}

// ── Resultado financeiro de uma partida ──────────────────────

export interface MatchRevenue {
  total: number;
  occupancy: number;
  breakdown: {
    sector: StadiumSector;
    seats: number;
    sold: number;
    price: number;
    revenue: number;
  }[];
}

// ── Constantes de custo de expansão ─────────────────────────

export const SEAT_COST: Record<StadiumSector, number> = {
  geral:        50,
  arquibancada: 200,
  cadeira:      500,
  camarote:     5_000,
};

export const SECTOR_LABELS: Record<StadiumSector, string> = {
  geral:        'Geral',
  arquibancada: 'Arquibancada',
  cadeira:      'Cadeira',
  camarote:     'Camarote',
};

export const SECTORS: StadiumSector[] = ['geral', 'arquibancada', 'cadeira', 'camarote'];
