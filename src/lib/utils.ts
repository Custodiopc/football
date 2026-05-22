/** Gera UUID v4 simples — suficiente para IDs de carreira local */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retorna cor de texto (preto ou branco) com bom contraste
 * sobre uma cor de fundo hexadecimal.
 */
export function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Fórmula de luminância relativa (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#f5f5f0';
}

/** Validação de nickname: 3-20 chars, letras/números/_ */
export function isValidNickname(value: string): boolean {
  return /^[a-zA-Z0-9_À-ÿ]{3,20}$/.test(value);
}

const POSITION_LABELS: Record<string, string> = {
  GK: 'GL',
  DEF: 'ZAG',
  MID: 'MEI',
  ATK: 'ATA',
};

export function positionLabel(pos: string): string {
  return POSITION_LABELS[pos] ?? pos;
}
