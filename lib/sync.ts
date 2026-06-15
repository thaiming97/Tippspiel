import "server-only";
import { db, Collections } from "./firebaseAdmin";
import { fetchMatches } from "./football";
import { recomputePoints } from "./data";
import { fixtureId } from "@/data/fixtures";
import type { MatchDoc } from "./types";

export interface SyncResult {
  fetched: number;
  upserted: number;
  finished: number;
}

/**
 * Zieht den aktuellen Spielplan inkl. Ergebnisse aus dem Internet,
 * schreibt ihn nach Firestore und berechnet die Punkte neu.
 *
 * Spiele werden anhand ihrer externen ID bzw. einer stabilen ID
 * (Datum + Teams) zusammengeführt, damit nichts doppelt entsteht.
 */
export async function syncFromInternet(): Promise<SyncResult> {
  const external = await fetchMatches();

  // Bestehende Spiele nach externer ID indizieren.
  const existingSnap = await db().collection(Collections.matches).get();
  const byExternal = new Map<number, string>();
  existingSnap.docs.forEach((d) => {
    const ext = (d.data() as MatchDoc).externalId;
    if (ext) byExternal.set(ext, d.id);
  });

  let upserted = 0;
  let finished = 0;
  const batch = db().batch();

  for (const m of external) {
    const docId =
      byExternal.get(m.externalId) ??
      fixtureId({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, kickoff: m.kickoff });

    const data: Omit<MatchDoc, "id"> = {
      externalId: m.externalId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      stage: m.stage,
      kickoff: m.kickoff,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    };
    batch.set(db().collection(Collections.matches).doc(docId), data, {
      merge: true,
    });
    upserted += 1;
    if (m.status === "FINISHED") finished += 1;
  }

  await batch.commit();
  await recomputePoints();

  return { fetched: external.length, upserted, finished };
}
