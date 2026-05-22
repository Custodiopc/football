/**
 * Gerador de números pseudo-aleatórios determinístico.
 * Mulberry32 — rápido, boa distribuição, zero deps.
 * Retorna closure que gera floats em [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0; // garante uint32
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converte string em seed numérico (djb2).
 */
export function hashStr(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}
