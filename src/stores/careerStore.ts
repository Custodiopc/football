import { create } from 'zustand';
import { getCurrentCareer, getCurrentCareerRaw, setCurrentCareer } from '../lib/storage';
import type { Career, Lineup, Match, StandingsRow, PlayerState } from '../types';
import { isLegacySave } from '../lib/career';
import type { UserMatchSummary, FinancialRoundUpdate, AcademyRoundUpdate, MarketRoundUpdate, MatchSimulationResult } from '../lib/simulation/engine';
import { submitOffer, completeTransfer, acceptIncomingOffer, rejectIncomingOffer, listUserPlayerForSale, delistUserPlayer, counterOffer } from '../lib/market';
import { dismissJunior, setJuniorNickname, promoteJunior } from '../lib/academy';

interface CareerState {
  career: Career | null;
  hydrated: boolean;
  lastResult: UserMatchSummary | null;
  legacySaveDetected: boolean;
  pendingLiveMatch: MatchSimulationResult | null; // true = save V1 incompatível encontrado

  hydrate: () => Promise<void>;
  startCareer: (career: Career) => Promise<void>;
  updateCareer: (partial: Partial<Career>) => Promise<void>;
  clearCareer: () => Promise<void>;
  saveLineup: (lineup: Lineup) => Promise<void>;
  applyRoundResult: (
    matchesWithResults: Match[],
    updatedStandings: StandingsRow[],
    updatedPlayerStates: PlayerState[],
    summary: UserMatchSummary,
    financeUpdate?: FinancialRoundUpdate | null,
    academyUpdate?: AcademyRoundUpdate | null,
    marketUpdate?: MarketRoundUpdate | null
  ) => Promise<void>;
  clearLastResult: () => void;
  dismissLegacyWarning: () => void;
  setPendingLiveMatch: (match: MatchSimulationResult | null) => void;
  // Academia
  promoteJuniorAction: (juniorId: number) => Promise<{ error?: string }>;
  dismissJuniorAction: (juniorId: number) => Promise<void>;
  setJuniorNicknameAction: (juniorId: number, nickname: string) => Promise<void>;
  // Mercado
  submitOfferAction: (playerId: number, amount: number) => Promise<{ error?: string }>;
  completeTransferAction: (offerId: string) => Promise<{ error?: string }>;
  acceptIncomingOfferAction: (offerId: string) => Promise<{ error?: string }>;
  rejectIncomingOfferAction: (offerId: string) => Promise<void>;
  listForSaleAction: (playerId: number, price: number) => Promise<void>;
  delistAction: (playerId: number) => Promise<void>;
  counterOfferAction: (offerId: string, newAmount: number) => Promise<void>;
}

export const useCareerStore = create<CareerState>((set, get) => ({
  career: null,
  hydrated: false,
  lastResult: null,
  legacySaveDetected: false,
  pendingLiveMatch: null,

  hydrate: async () => {
    const raw = await getCurrentCareerRaw();
    if (raw && isLegacySave(raw)) {
      // Save V1 encontrado — não carrega, avisa usuário
      set({ career: null, hydrated: true, legacySaveDetected: true });
      return;
    }
    const career = await getCurrentCareer();
    set({ career, hydrated: true, legacySaveDetected: false });
  },

  startCareer: async (career: Career) => {
    await setCurrentCareer(career);
    set({ career, lastResult: null, legacySaveDetected: false });
  },

  updateCareer: async (partial: Partial<Career>) => {
    const current = get().career;
    if (!current) return;
    const updated = { ...current, ...partial };
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  clearCareer: async () => {
    await setCurrentCareer(null);
    set({ career: null, lastResult: null, legacySaveDetected: false });
  },

  saveLineup: async (lineup: Lineup) => {
    const career = get().career;
    if (!career) return;
    const lineups = career.lineups.filter((l) => l.round !== lineup.round);
    lineups.push(lineup);
    const updated = { ...career, lineups };
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  applyRoundResult: async (matchesWithResults, updatedStandings, updatedPlayerStates, summary, financeUpdate, academyUpdate, marketUpdate) => {
    const career = get().career;
    if (!career) return;

    const updatedMatches = career.matches.map((m) => {
      const found = matchesWithResults.find(
        (r) => r.round === m.round &&
          r.home_team_id === m.home_team_id &&
          r.away_team_id === m.away_team_id
      );
      return found ?? m;
    });

    const updated: Career = {
      ...career,
      matches: updatedMatches,
      standings: updatedStandings,
      player_states: updatedPlayerStates,
      current_round: career.current_round + 1,
      manager_points: career.manager_points + summary.points_earned,
      status: career.current_round >= 38 ? 'finished' : 'active',
      finances: financeUpdate?.updatedFinances ?? career.finances,
      stadium:  financeUpdate?.updatedStadium  ?? career.stadium,
      academy:      academyUpdate?.updatedAcademy     ?? career.academy,
      market_state: marketUpdate?.updatedMarketState ?? career.market_state,
    };

    await setCurrentCareer(updated);
    set({ career: updated, lastResult: summary });
  },

  clearLastResult: () => set({ lastResult: null }),

  submitOfferAction: async (playerId, amount) => {
    const career = get().career;
    if (!career) return { error: 'Sem carreira' };
    const result = submitOffer(career, playerId, amount);
    if (result.error) return { error: result.error };
    await setCurrentCareer(result.career);
    set({ career: result.career });
    return {};
  },

  completeTransferAction: async (offerId) => {
    const career = get().career;
    if (!career) return { error: 'Sem carreira' };
    const offer = career.market_state?.pending_offers_from_user.find((o) => o.id === offerId);
    if (!offer) return { error: 'Proposta não encontrada' };
    const result = completeTransfer(career, offer);
    if (result.error) return { error: result.error };
    await setCurrentCareer(result.career);
    set({ career: result.career });
    return {};
  },

  acceptIncomingOfferAction: async (offerId) => {
    const career = get().career;
    if (!career) return { error: 'Sem carreira' };
    const result = acceptIncomingOffer(career, offerId);
    if (result.error) return { error: result.error };
    await setCurrentCareer(result.career);
    set({ career: result.career });
    return {};
  },

  rejectIncomingOfferAction: async (offerId) => {
    const career = get().career;
    if (!career) return;
    const updated = rejectIncomingOffer(career, offerId);
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  listForSaleAction: async (playerId, price) => {
    const career = get().career;
    if (!career) return;
    const updated = listUserPlayerForSale(career, playerId, price);
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  delistAction: async (playerId) => {
    const career = get().career;
    if (!career) return;
    const updated = delistUserPlayer(career, playerId);
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  counterOfferAction: async (offerId, newAmount) => {
    const career = get().career;
    if (!career) return;
    const updated = counterOffer(career, offerId, newAmount);
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  promoteJuniorAction: async (juniorId) => {
    const career = get().career;
    if (!career) return { error: 'Sem carreira' };
    const result = promoteJunior(career, juniorId);
    if (result.error) return { error: result.error };
    await setCurrentCareer(result.career);
    set({ career: result.career });
    return {};
  },

  dismissJuniorAction: async (juniorId) => {
    const career = get().career;
    if (!career?.academy) return;
    const academy = dismissJunior(career.academy, juniorId);
    const updated = { ...career, academy };
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  setJuniorNicknameAction: async (juniorId, nickname) => {
    const career = get().career;
    if (!career?.academy) return;
    const academy = setJuniorNickname(career.academy, juniorId, nickname);
    const updated = { ...career, academy };
    await setCurrentCareer(updated);
    set({ career: updated });
  },

  setPendingLiveMatch: (match) => set({ pendingLiveMatch: match }),

  dismissLegacyWarning: async () => {
    // Apaga o save legado e permite criar um novo
    await setCurrentCareer(null);
    set({ legacySaveDetected: false });
  },
}));
