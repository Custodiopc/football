import { create } from 'zustand';
import {
  getNickname, setNickname as saveNickname,
  getSettings, setSettings as saveSettings,
  getOnboardingDone, setOnboardingDone,
  getTutorialCompleted, setTutorialCompleted,
  getAchievements, unlockAchievement,
  type Achievement, type AchievementId,
} from '../lib/storage';
import type { Settings } from '../types';

interface SettingsState {
  nickname: string | null;
  settings: Settings;
  hydrated: boolean;
  onboardingDone: boolean;
  tutorialCompleted: boolean;
  achievements: Achievement[];

  hydrate: () => Promise<void>;
  setNickname: (n: string) => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeTutorial: () => Promise<void>;
  tryUnlockAchievement: (id: AchievementId) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  nickname: null,
  settings: { sound_enabled: true, volume: 70, language: 'pt-BR' },
  hydrated: false,
  onboardingDone: false,
  tutorialCompleted: false,
  achievements: [],

  hydrate: async () => {
    const [nickname, settings, onboardingDone, tutorialCompleted, achievements] =
      await Promise.all([
        getNickname(),
        getSettings(),
        getOnboardingDone(),
        getTutorialCompleted(),
        getAchievements(),
      ]);
    set({ nickname, settings: { ...settings, volume: settings.volume ?? 70 }, hydrated: true, onboardingDone, tutorialCompleted, achievements });
  },

  setNickname: async (n: string) => {
    await saveNickname(n);
    set({ nickname: n });
  },

  updateSettings: async (partial: Partial<Settings>) => {
    const next = { ...get().settings, ...partial };
    await saveSettings(next);
    set({ settings: next });
  },

  completeOnboarding: async () => {
    await setOnboardingDone();
    set({ onboardingDone: true });
  },

  completeTutorial: async () => {
    await setTutorialCompleted();
    set({ tutorialCompleted: true });
  },

  tryUnlockAchievement: async (id: AchievementId) => {
    const isNew = await unlockAchievement(id);
    if (isNew) {
      const achievements = await getAchievements();
      set({ achievements });
    }
    return isNew;
  },
}));
