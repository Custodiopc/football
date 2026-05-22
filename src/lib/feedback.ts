import confetti from 'canvas-confetti';

// ── Confetti para título ──────────────────────────────────────

export function fireChampionConfetti(): void {
  const duration = 4000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#d4a017', '#f0c040', '#ffffff', '#0d3b1f'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#d4a017', '#f0c040', '#ffffff', '#0d3b1f'],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Confetti discreto para vitória */
export function fireWinConfetti(): void {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#d4a017', '#f0c040', '#ffffff'],
  });
}

// ── Shake de derrota ─────────────────────────────────────────

export function shakeElement(element: HTMLElement | null, intensity = 8): void {
  if (!element) return;
  const keyframes = [
    { transform: 'translateX(0)' },
    { transform: `translateX(-${intensity}px)` },
    { transform: `translateX(${intensity}px)` },
    { transform: `translateX(-${intensity}px)` },
    { transform: `translateX(${intensity}px)` },
    { transform: 'translateX(0)' },
  ];
  element.animate(keyframes, { duration: 400, easing: 'ease-in-out' });
}

// ── Frases do narrador ────────────────────────────────────────

const NARRATOR_PHRASES = {
  win: [
    'Que atuação! O time foi cirúrgico!',
    'Isso é futebol de alto nível!',
    'Merecida! Dominou do início ao fim!',
    'Categoria total! Sem discussão!',
    'O treinador acertou em cheio!',
    'A torcida vai à loucura!',
    'Que partida, senhoras e senhores!',
  ],
  draw: [
    'Empate justo, os dois times se equivaleram.',
    'Um ponto que pode valer ouro lá na frente.',
    'Dividiu o saldo, dividiu os aplausos.',
    'Jogo truncado, mas combativo.',
    'Cada um levou o seu.',
  ],
  loss: [
    'Que resultado amargo...',
    'O futebol é assim, tem que levantar a cabeça.',
    'Dia para esquecer, mas a vida continua.',
    'Isso dói, mas serve de lição.',
    'Roubaram! (brincadeira... ou não?)',
    'O treinador vai ter muito trabalho essa semana.',
  ],
  big_win: [
    'Foi de lavada! Goleada histórica!',
    'Isso não foi jogo, foi um treino!',
    'Cinco a zero! Que vexame para os adversários!',
    'Placar elástico! A torcida quer mais!',
    'Isso vai ficar na memória por muito tempo!',
  ],
  big_loss: [
    'Que derrota vexatória...',
    'O técnico vai trabalhar muito durante a semana.',
    'Isso vai doer por um bom tempo.',
    'Humilhante. Ponto final.',
    'O que aconteceu aqui hoje?',
  ],
  champion: [
    'CAMPEÃO BRASILEIRO! QUE TEMPORADA INCRÍVEL!',
    'Escreveu o nome na história! CAMPEÃO!',
    'Mereceu! Do primeiro ao último minuto!',
    'Título! A festa pode começar!',
  ],
  relegated: [
    'Que temporada para esquecer...',
    'Rebaixamento. Uma página triste do futebol.',
    'Hora de reconstruir. Tem muito trabalho pela frente.',
  ],
};

export function getNarratorPhrase(
  result: 'W' | 'D' | 'L',
  scoreDiff: number,
  isChampion = false,
  isRelegated = false,
): string {
  if (isChampion) return pick(NARRATOR_PHRASES.champion);
  if (isRelegated) return pick(NARRATOR_PHRASES.relegated);
  if (result === 'W' && scoreDiff >= 4) return pick(NARRATOR_PHRASES.big_win);
  if (result === 'L' && scoreDiff >= 4) return pick(NARRATOR_PHRASES.big_loss);
  if (result === 'W') return pick(NARRATOR_PHRASES.win);
  if (result === 'D') return pick(NARRATOR_PHRASES.draw);
  return pick(NARRATOR_PHRASES.loss);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Definições de achievements ────────────────────────────────

import type { AchievementId } from './storage';

export const ACHIEVEMENT_DEFS: Record<AchievementId, { label: string; description: string; icon: string }> = {
  goleada_historica: {
    label: 'Goleada Histórica',
    description: 'Vencer por 5 ou mais gols de diferença.',
    icon: '💥',
  },
  invicto: {
    label: 'Invicto',
    description: 'Terminar a temporada sem nenhuma derrota.',
    icon: '🛡️',
  },
  artilheiro: {
    label: 'Artilheiro',
    description: 'Um jogador seu marcar 20+ gols em uma temporada.',
    icon: '⚽',
  },
  anfitriao: {
    label: 'Anfitrião',
    description: 'Hospedar uma partida multiplayer.',
    icon: '🏠',
  },
  primeira_temporada: {
    label: 'Primeira Temporada',
    description: 'Completar sua primeira temporada.',
    icon: '🏆',
  },
};
