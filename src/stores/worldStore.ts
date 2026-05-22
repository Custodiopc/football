import { create } from 'zustand';
import { getWorldConfig, setWorldConfig } from '../lib/storage';
import { createDefaultWorldConfig } from '../lib/worldConfig';
import type { WorldConfig, LeagueDivision, RegionalCup, SalarySystem, ForceSystem } from '../types/world';

interface WorldStore {
  config: WorldConfig;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  save: (config: WorldConfig) => Promise<void>;
  reset: () => Promise<void>;

  // Actions granulares
  updateDivision: (level: number, partial: Partial<LeagueDivision>) => void;
  toggleState: (stateId: string) => void;
  toggleRegionalCup: (cup: RegionalCup) => void;
  setSalarySystem: (s: SalarySystem) => void;
  setForceSystem: (s: ForceSystem) => void;
  setStartSeason: (y: number) => void;
  setPlayStates: (v: boolean) => void;
  setPlayRegionalCups: (v: boolean) => void;
  setPlayInternationalClubs: (v: boolean) => void;
  setAlwaysInvited: (v: boolean) => void;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  config: createDefaultWorldConfig(),
  hydrated: false,

  hydrate: async () => {
    const saved = await getWorldConfig();
    set({
      config: saved ?? createDefaultWorldConfig(),
      hydrated: true,
    });
  },

  save: async (config: WorldConfig) => {
    await setWorldConfig(config);
    set({ config });
  },

  reset: async () => {
    const fresh = createDefaultWorldConfig();
    await setWorldConfig(fresh);
    set({ config: fresh });
  },

  updateDivision: (level, partial) => {
    const divisions = get().config.divisions.map((d) =>
      d.level === level ? { ...d, ...partial } : d
    );
    set((s) => ({ config: { ...s.config, divisions } }));
  },

  toggleState: (stateId) => {
    const active_states = get().config.active_states.map((s) =>
      s.id === stateId ? { ...s, enabled: !s.enabled } : s
    );
    set((s) => ({ config: { ...s.config, active_states } }));
  },

  toggleRegionalCup: (cup) => {
    const cups = get().config.active_regional_cups;
    const next = cups.includes(cup) ? cups.filter((c) => c !== cup) : [...cups, cup];
    set((s) => ({ config: { ...s.config, active_regional_cups: next } }));
  },

  setSalarySystem: (salary_system) =>
    set((s) => ({ config: { ...s.config, salary_system } })),

  setForceSystem: (force_system) =>
    set((s) => ({ config: { ...s.config, force_system } })),

  setStartSeason: (start_season) =>
    set((s) => ({ config: { ...s.config, start_season } })),

  setPlayStates: (play_states) =>
    set((s) => ({ config: { ...s.config, play_states } })),

  setPlayRegionalCups: (play_regional_cups) =>
    set((s) => ({ config: { ...s.config, play_regional_cups } })),

  setPlayInternationalClubs: (play_international_clubs) =>
    set((s) => ({ config: { ...s.config, play_international_clubs } })),

  setAlwaysInvited: (always_invited_to_regional) =>
    set((s) => ({ config: { ...s.config, always_invited_to_regional } })),
}));
