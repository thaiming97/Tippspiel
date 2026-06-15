/**
 * Punktelogik des Tippspiels – Wertung wie beim CHECK24-Tippspiel.
 *
 *  - Exaktes Ergebnis ...................... 4 Punkte
 *  - Richtige Tordifferenz (kein Remis) .... 3 Punkte
 *  - Richtige Tendenz (Sieg/Remis/Nied.) ... 2 Punkte
 *  - Sonst ................................. 0 Punkte
 *
 * Die Werte sind bewusst an einer Stelle gebündelt, damit man die
 * Wertung leicht anpassen kann.
 */
export const POINTS = {
  exact: 4,
  goalDiff: 3,
  tendency: 2,
} as const;

type Score = { homeScore: number; awayScore: number };

function tendency(s: Score): -1 | 0 | 1 {
  if (s.homeScore > s.awayScore) return 1;
  if (s.homeScore < s.awayScore) return -1;
  return 0;
}

/** Berechnet die Punkte eines Tipps gegen das tatsächliche Ergebnis. */
export function calcPoints(bet: Score, result: Score): number {
  const sameTendency = tendency(bet) === tendency(result);
  if (!sameTendency) return 0;

  const exact =
    bet.homeScore === result.homeScore && bet.awayScore === result.awayScore;
  if (exact) return POINTS.exact;

  // Bei Sieg/Niederlage zählt zusätzlich die exakte Tordifferenz.
  const sameDiff =
    bet.homeScore - bet.awayScore === result.homeScore - result.awayScore;
  if (sameDiff && tendency(result) !== 0) return POINTS.goalDiff;

  return POINTS.tendency;
}
