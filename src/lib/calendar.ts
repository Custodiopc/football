import type { Match } from '../types';

/**
 * Gera calendário round-robin para N times.
 * Método do círculo: fixa o time[0], rotaciona os demais.
 * 20 times = 19 rodadas no turno, 38 total com returno.
 */
export function generateCalendar(teamIds: number[]): Match[] {
  const n = teamIds.length;
  if (n % 2 !== 0) throw new Error('generateCalendar: número de times deve ser par');

  const matches: Match[] = [];

  // Cria array de slots: [0] fixo, [1..n-1] rotacionam
  const slots = [...teamIds];
  const half = n / 2;

  // Turno
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < half; i++) {
      const home = slots[i];
      const away = slots[n - 1 - i];
      matches.push({
        round: round + 1,
        home_team_id: home,
        away_team_id: away,
        home_goals: null,
        away_goals: null,
        events: [],
      });
    }

    // Rotacionar slots[1..n-1] (slots[0] é fixo)
    const last = slots[n - 1];
    for (let j = n - 1; j > 1; j--) {
      slots[j] = slots[j - 1];
    }
    slots[1] = last;
  }

  // Returno: invertir mando de campo, rodadas n..2n-2
  const turnoLength = matches.length;
  for (let i = 0; i < turnoLength; i++) {
    const orig = matches[i];
    matches.push({
      round: orig.round + (n - 1),
      home_team_id: orig.away_team_id,
      away_team_id: orig.home_team_id,
      home_goals: null,
      away_goals: null,
      events: [],
    });
  }

  return matches;
}

/** Retorna os jogos de uma rodada específica */
export function getMatchesByRound(matches: Match[], round: number): Match[] {
  return matches.filter((m) => m.round === round);
}

/** Retorna o jogo do time do usuário numa rodada */
export function getUserMatch(
  matches: Match[],
  round: number,
  teamId: number
): Match | undefined {
  return matches.find(
    (m) => m.round === round && (m.home_team_id === teamId || m.away_team_id === teamId)
  );
}
