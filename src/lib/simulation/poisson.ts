/**
 * Amostragem de distribuição de Poisson via algoritmo de Knuth.
 * Usado para determinar número de gols por jogo.
 * @param lambda - média esperada de gols
 * @param rng - função geradora em [0,1)
 */
export function poissonSample(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}
