import "server-only";
import { unstable_cache } from "next/cache";
import { db, Collections, STANDINGS_DOC } from "./firebaseAdmin";
import { calcPoints } from "./points";
import { GROUP_E_STAGE } from "./types";
import type { BetDoc, MatchDoc, Scope, StandingRow, UserDoc } from "./types";

/**
 * Cache-Tag für den Spielplan. Der Spielplan ändert sich selten (nur bei Sync
 * oder Admin-Eingriff), wird aber bei jedem Seitenaufruf gebraucht. Wir cachen
 * ihn deshalb serverseitig und entwerten den Cache gezielt über diesen Tag,
 * sobald sich etwas ändert (siehe revalidateTag in den Admin-/Sync-Aktionen).
 */
export const MATCHES_TAG = "matches";

/**
 * Liest die komplette matches-Collection. Teurer Read (1 pro Spiel) – deshalb
 * über den Next.js Data Cache gepuffert: Treffer kosten 0 Firestore-Reads, der
 * Cache hält bis zur nächsten Änderung (revalidateTag) bzw. max. 5 Minuten.
 */
const loadMatches = unstable_cache(
  async (): Promise<MatchDoc[]> => {
    const snap = await db()
      .collection(Collections.matches)
      .orderBy("kickoff")
      .get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MatchDoc, "id">),
    }));
  },
  ["matches-all"],
  { tags: [MATCHES_TAG], revalidate: 300 },
);

/** Alle Spiele, nach Anstoß sortiert (aus dem Cache, siehe loadMatches). */
export async function getMatches(): Promise<MatchDoc[]> {
  return loadMatches();
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

/** Alle Tipps zu einem Spiel als Map userId -> Tipp (für den Admin). */
export async function getBetsForMatch(
  matchId: string,
): Promise<Map<string, BetDoc>> {
  const snap = await db()
    .collection(Collections.bets)
    .where("matchId", "==", matchId)
    .get();
  const map = new Map<string, BetDoc>();
  snap.docs.forEach((d) => {
    const bet = { id: d.id, ...(d.data() as Omit<BetDoc, "id">) };
    map.set(bet.userId, bet);
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

  // Rangliste nach jeder Neuauswertung einmal vorberechnen und cachen.
  await refreshStandings();
}

/** Im Cache-Dokument abgelegte Rangliste für beide Wertungen. */
interface StandingsCache {
  group_e: StandingRow[];
  all: StandingRow[];
  updatedAt: number;
}

/**
 * Berechnet eine Rangliste aus bereits geladenen Daten (kein DB-Zugriff).
 *
 *  - scope "group_e": nur Punkte aus Gruppe-E-Spielen, alle Teilnehmer.
 *  - scope "all":     Punkte aus allen Spielen, nur Teilnehmer mit
 *                     Tipp-Umfang "alle" (die anderen tippen nur Gruppe E).
 */
function computeStandings(
  scope: Scope,
  users: UserDoc[],
  groupEMatchIds: Set<string>,
  bets: BetDoc[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  users.forEach((u) => {
    // Admins sind Organisatoren, keine Mitspieler -> nicht werten.
    if (u.role === "admin") return;
    const userScope = u.scope ?? "group_e";
    // In der Gesamtwertung erscheinen nur „alle"-Tipper.
    if (scope === "all" && userScope !== "all") return;
    rows.set(u.id, { userId: u.id, name: u.name, points: 0, exact: 0, played: 0 });
  });

  bets.forEach((bet) => {
    if (bet.points === null) return;
    if (scope === "group_e" && !groupEMatchIds.has(bet.matchId)) return;
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

/**
 * Liest die ganze DB einmal und berechnet beide Wertungen. Teurer Pfad – nur
 * über refreshStandings (selten, bei Datenänderung) oder als Fallback genutzt.
 */
async function computeAllStandings(): Promise<StandingsCache> {
  const [usersSnap, matchesSnap, betsSnap] = await Promise.all([
    db().collection(Collections.users).get(),
    db().collection(Collections.matches).get(),
    db().collection(Collections.bets).get(),
  ]);

  const users = usersSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<UserDoc, "id">),
  }));
  const groupEMatchIds = new Set(
    matchesSnap.docs
      .filter((d) => (d.data() as MatchDoc).stage === GROUP_E_STAGE)
      .map((d) => d.id),
  );
  const bets = betsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<BetDoc, "id">),
  }));

  return {
    group_e: computeStandings("group_e", users, groupEMatchIds, bets),
    all: computeStandings("all", users, groupEMatchIds, bets),
    updatedAt: Date.now(),
  };
}

/**
 * Berechnet beide Ranglisten neu und legt sie als EIN Dokument ab. Aufrufen,
 * wann immer sich Punkte, Teilnehmer oder Tipp-Umfang ändern (Sync, Ergebnis,
 * Admin-Korrekturen, User-/Scope-Änderungen).
 */
export async function refreshStandings(): Promise<void> {
  const cache = await computeAllStandings();
  await db()
    .collection(Collections.standings)
    .doc(STANDINGS_DOC)
    .set(cache);
}

/**
 * Beide Wertungen aus dem Cache (ein Read). Existiert der Cache noch nicht,
 * wird er einmalig live berechnet und geschrieben.
 */
async function readStandingsCache(): Promise<StandingsCache> {
  const snap = await db()
    .collection(Collections.standings)
    .doc(STANDINGS_DOC)
    .get();

  if (snap.exists) {
    const cache = snap.data() as StandingsCache;
    return {
      group_e: cache.group_e ?? [],
      all: cache.all ?? [],
      updatedAt: cache.updatedAt ?? 0,
    };
  }

  // Fallback: noch nie berechnet -> einmal berechnen, cachen und ausliefern.
  const cache = await computeAllStandings();
  await db()
    .collection(Collections.standings)
    .doc(STANDINGS_DOC)
    .set(cache);
  return cache;
}

/**
 * Aktuelle Rangliste einer Wertung, absteigend nach Punkten. Liest nur das
 * vorberechnete Cache-Dokument (1 Read statt der ganzen DB).
 */
export async function getStandings(scope: Scope): Promise<StandingRow[]> {
  const cache = await readStandingsCache();
  return cache[scope];
}

/** Beide Wertungen gemeinsam (für die Übersicht: Rang in Gruppe & Gesamt). */
export async function getStandingsBoth(): Promise<{
  group_e: StandingRow[];
  all: StandingRow[];
}> {
  const { group_e, all } = await readStandingsCache();
  return { group_e, all };
}
