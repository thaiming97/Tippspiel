import "server-only";
import { db, Collections } from "./firebaseAdmin";
import { calcPoints } from "./points";
import type { BetDoc, MatchDoc, StandingRow, UserDoc } from "./types";

/** Alle Spiele, nach Anstoß sortiert. */
export async function getMatches(): Promise<MatchDoc[]> {
  const snap = await db()
    .collection(Collections.matches)
    .orderBy("kickoff")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MatchDoc, "id">) }));
}

/** Tipps eines Nutzers als Map matchId -> Tipp. */
export async function getUserBets(userId: string): Promise<Map<string, BetDoc>> {
  const snap = await db()
    .collection(Collections.bets)
    .where("userId", "==", userId)
    .get();
  const map = new Map<string, BetDoc>();
  snap.docs.forEach((d) => {
    const bet = { id: d.id, ...(d.data() as Omit<BetDoc, "id">) };
    map.set(bet.matchId, bet);
  });
  return map;
}

export function isBettable(match: MatchDoc): boolean {
  return new Date(match.kickoff).getTime() > Date.now();
}

/**
 * Speichert/aktualisiert einen Tipp. Nur erlaubt, solange das Spiel noch nicht
 * angestoßen wurde.
 */
export async function placeBet(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  const matchRef = db().collection(Collections.matches).doc(matchId);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) throw new Error("Spiel nicht gefunden");
  const match = matchSnap.data() as Omit<MatchDoc, "id">;

  if (new Date(match.kickoff).getTime() <= Date.now()) {
    throw new Error("Tippabgabe nach Anstoß nicht mehr möglich");
  }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    throw new Error("Ungültiges Ergebnis");
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    throw new Error("Ungültiges Ergebnis");
  }

  const betId = `${userId}_${matchId}`;
  const bet: Omit<BetDoc, "id"> = {
    userId,
    matchId,
    homeScore,
    awayScore,
    points: null,
    updatedAt: Date.now(),
  };
  await db().collection(Collections.bets).doc(betId).set(bet, { merge: true });
}

/**
 * Berechnet für alle beendeten Spiele die Punkte aller abgegebenen Tipps neu.
 * Idempotent – kann nach jedem Sync/Ergebnis-Update aufgerufen werden.
 */
export async function recomputePoints(): Promise<void> {
  const [matchesSnap, betsSnap] = await Promise.all([
    db().collection(Collections.matches).get(),
    db().collection(Collections.bets).get(),
  ]);

  const matches = new Map<string, MatchDoc>();
  matchesSnap.docs.forEach((d) =>
    matches.set(d.id, { id: d.id, ...(d.data() as Omit<MatchDoc, "id">) }),
  );

  const batch = db().batch();
  betsSnap.docs.forEach((d) => {
    const bet = d.data() as Omit<BetDoc, "id">;
    const match = matches.get(bet.matchId);
    let points: number | null = null;
    if (
      match &&
      match.status === "FINISHED" &&
      match.homeScore !== null &&
      match.awayScore !== null
    ) {
      points = calcPoints(
        { homeScore: bet.homeScore, awayScore: bet.awayScore },
        { homeScore: match.homeScore, awayScore: match.awayScore },
      );
    }
    if (points !== bet.points) {
      batch.update(d.ref, { points });
    }
  });
  await batch.commit();
}

/** Aktuelle Rangliste (live), absteigend nach Punkten. */
export async function getStandings(): Promise<StandingRow[]> {
  const [usersSnap, betsSnap] = await Promise.all([
    db().collection(Collections.users).get(),
    db().collection(Collections.bets).get(),
  ]);

  const rows = new Map<string, StandingRow>();
  usersSnap.docs.forEach((d) => {
    const u = d.data() as Omit<UserDoc, "id">;
    rows.set(d.id, { userId: d.id, name: u.name, points: 0, exact: 0, played: 0 });
  });

  betsSnap.docs.forEach((d) => {
    const bet = d.data() as Omit<BetDoc, "id">;
    if (bet.points === null) return;
    const row = rows.get(bet.userId);
    if (!row) return;
    row.points += bet.points;
    row.played += 1;
    if (bet.points === 4) row.exact += 1;
  });

  return [...rows.values()].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name),
  );
}
