import { get, set, del, keys } from 'idb-keyval';
import type { Career, Settings } from '../types';

const KEYS = {
  nickname:           'nickname',
  settings:           'settings',
  currentCareer:      'current_career',
  tutorialCompleted:  'tutorial_completed',
  onboardingDone:     'onboarding_done',
  achievements:       'achievements',
  careerHistory:      'career_history',
} as const;

const DEFAULT_SETTINGS: Settings = {
  sound_enabled: true,
  volume: 70,
  language: 'pt-BR',
};

// ── Nickname ──────────────────────────────────────────────────
export async function getNickname(): Promise<string | null> {
  return (await get<string>(KEYS.nickname)) ?? null;
}
export async function setNickname(nickname: string): Promise<void> {
  await set(KEYS.nickname, nickname);
}

// ── Settings ─────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const saved = await get<Settings>(KEYS.settings);
  return saved ?? DEFAULT_SETTINGS;
}
export async function setSettings(s: Settings): Promise<void> {
  await set(KEYS.settings, s);
}

// ── Career ───────────────────────────────────────────────────
export async function getCurrentCareer(): Promise<Career | null> {
  return (await get<Career>(KEYS.currentCareer)) ?? null;
}

/** Retorna o save bruto (sem tipagem) para detectar versão */
export async function getCurrentCareerRaw(): Promise<Record<string, unknown> | null> {
  return (await get<Record<string, unknown>>(KEYS.currentCareer)) ?? null;
}
export async function setCurrentCareer(c: Career | null): Promise<void> {
  await set(KEYS.currentCareer, c);
}

// ── Tutorial / Onboarding ─────────────────────────────────────
export async function getTutorialCompleted(): Promise<boolean> {
  return (await get<boolean>(KEYS.tutorialCompleted)) ?? false;
}
export async function setTutorialCompleted(): Promise<void> {
  await set(KEYS.tutorialCompleted, true);
}
export async function getOnboardingDone(): Promise<boolean> {
  return (await get<boolean>(KEYS.onboardingDone)) ?? false;
}
export async function setOnboardingDone(): Promise<void> {
  await set(KEYS.onboardingDone, true);
}

// ── Achievements ─────────────────────────────────────────────
export type AchievementId =
  | 'goleada_historica'
  | 'invicto'
  | 'artilheiro'
  | 'anfitriao'
  | 'primeira_temporada';

export interface Achievement {
  id: AchievementId;
  unlocked_at: number;
}

export async function getAchievements(): Promise<Achievement[]> {
  return (await get<Achievement[]>(KEYS.achievements)) ?? [];
}

export async function unlockAchievement(id: AchievementId): Promise<boolean> {
  const current = await getAchievements();
  if (current.some((a) => a.id === id)) return false; // já tem
  await set(KEYS.achievements, [...current, { id, unlocked_at: Date.now() }]);
  return true; // novo!
}

// ── Histórico de carreiras ────────────────────────────────────
export interface CareerRecord {
  id: string;
  team_name: string;
  season: number;
  position: number;
  points: number;
  difficulty: string;
  manager_points: number;
  finished_at: number;
}

export async function getCareerHistory(): Promise<CareerRecord[]> {
  return (await get<CareerRecord[]>(KEYS.careerHistory)) ?? [];
}

export async function addCareerToHistory(record: CareerRecord): Promise<void> {
  const history = await getCareerHistory();
  await set(KEYS.careerHistory, [record, ...history].slice(0, 20)); // máx 20
}

// ── Limpar tudo ───────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  const allKeys = await keys();
  await Promise.all(allKeys.map((k) => del(k)));
}
// ── World Config ─────────────────────────────────────────────
export async function getWorldConfig(): Promise<import("../types/world").WorldConfig | null> {
  return (await get<import("../types/world").WorldConfig>('world_config')) ?? null;
}

export async function setWorldConfig(config: import("../types/world").WorldConfig): Promise<void> {
  await set('world_config', config);
}
