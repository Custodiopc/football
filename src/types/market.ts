import type { Position, Side, AttrKey } from './player';
export type { Position, Side };
export type Style = 'defensive' | 'balanced' | 'offensive';

// ── Contrato de jogador ──────────────────────────────────────

export interface PlayerContract {
  player_id: number;
  career_id: string;
  weekly_wage: number;
  contract_until_season: number;
  release_clause?: number;
}

// ── Listagem pra venda ────────────────────────────────────────

export interface TransferListing {
  player_id: number;
  asking_price: number;
  listed_by_team_id: number;
  listed_at_round: number;
  is_loan_only: boolean;
}

// ── Proposta de transferência ─────────────────────────────────

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

export interface TransferOffer {
  id: string;
  player_id: number;
  from_team_id: number;
  to_team_id: number;
  amount: number;
  status: OfferStatus;
  counter_amount?: number;
  created_at_round: number;
  responded_at_round?: number;
}

// ── Histórico de transferências ───────────────────────────────

export interface Transfer {
  round: number;
  season: number;
  player_id: number;
  player_name: string;
  from_team_id: number;
  to_team_id: number;
  fee: number;
  is_free_transfer: boolean;
  is_loan: boolean;
}

// ── Estado do mercado ────────────────────────────────────────

export type MarketWindow = 'winter' | 'summer' | null;

export interface MarketState {
  career_id: string;
  is_open: boolean;
  current_window: MarketWindow;
  closes_at_round: number | null;
  listings: TransferListing[];
  pending_offers_to_user: TransferOffer[];
  pending_offers_from_user: TransferOffer[];
  history: Transfer[];
  notifications: string[];
}

// ── Personalidade dos times ───────────────────────────────────

export type Philosophy = 'youth_focused' | 'star_collector' | 'balanced' | 'survival';

export interface TeamPersonality {
  team_id: number;
  philosophy: Philosophy;
  preferred_style: Style;
  spending_aggressiveness: number; // 0.0–1.0
}

// ── Filtros de busca ──────────────────────────────────────────

export interface SearchFilters {
  name: string;
  position: Position | '';
  side: Side | '';
  char1: AttrKey | '';
  char2: AttrKey | '';
  force_min: number;
  force_max: number;
  age_min: number;
  age_max: number;
  only_star: boolean;
  only_world_top: boolean;
  only_for_sale: boolean;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  name: '',
  position: '',
  side: '',
  char1: '',
  char2: '',
  force_min: 1,
  force_max: 20,
  age_min: 16,
  age_max: 45,
  only_star: false,
  only_world_top: false,
  only_for_sale: false,
};

// ── Renovação de contrato ─────────────────────────────────────

export interface ContractRenewalProposal {
  player_id: number;
  current_wage: number;
  proposed_wage: number;
  proposed_seasons: number;
  deadline_round: number;
}
