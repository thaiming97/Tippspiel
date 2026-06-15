import "server-only";
import { db, Collections } from "./firebaseAdmin";
import { fetchMatches } from "./football";
import { recomputePoints } from "./data";
import { fixtureId } from "@/data/fixtures";
import { pairKey, teamKey, translateTeam } from "./teams";
import type { MatchDoc } from "./types";

export interface SyncResult {
  fetched: number;
  updated: number;
  created: number;
  finished: number;
}

/**
 * Zieht Spielplan + Ergebnisse aus dem Internet, übersetzt die Team-Namen ins
 * Deutsche und führt sie mit den bereits angelegten Spielen zusammen:
 *
 *  - Treffer per externer ID oder per Mannschafts-Paarung -> bestehendes Spiel
 *    wird aktualisiert (Ergebnis/Status/Anstoß); Heim/Gast-Reihenfolge wird
 *    dabei korrekt zugeordnet (Tore ggf. getauscht).
 *  - kein Treffer -> neues Spiel mit deutschen Namen anlegen.
 *
 * Dadurch docken automatische Ergebnisse an die getippten Spiele an, statt
 * Duplikate zu erzeugen.
 */
export async function syncFromInternet(): Promise<SyncResult> {
  const external = await fetchMatches();

  const existingSnap = await db().collection(Collections.matches).get();
  const byId = new Map<string, MatchDoc>();
  existingSnap.docs.forEach((d) =>
    byId.set(d.id, { id: d.id, ...(d.data() as Omit<MatchDoc, "id">) }),
  );

  const byExternal = new Map<number, string>();
  const byPair = new Map<string, string>();
  for (const m of byId.values()) {
    if (m.externalId) byExternal.set(m.externalId, m.id);
    byPair.set(pairKey(m.homeTeam, m.awayTeam), m.id);
  }

  let updated = 0;
  let created = 0;
  let finished = 0;
  const batch = db().batch();

  for (const ext of external) {
    const homeDE = translateTeam(ext.homeTeam);
    const awayDE = translateTeam(ext.awayTeam);

    const matchId =
      byExternal.get(ext.externalId) ?? byPair.get(pairKey(homeDE, awayDE));

    if (matchId) {
      // Bestehendes Spiel aktualisieren – Namen/Stage beibehalten.
      const cur = byId.get(matchId)!;
      const sameOrientation = teamKey(cur.homeTeam) === teamKey(homeDE);
      const homeScore = sameOrientation ? ext.homeScore : ext.awayScore;
      const awayScore = sameOrientation ? ext.awayScore : ext.homeScore;

      batch.set(
        db().collection(Collections.matches).doc(matchId),
        {
          externalId: ext.externalId,
          status: ext.status,
          kickoff: ext.kickoff,
          homeScore,
          awayScore,
        },
        { merge: true },
      );
      updated += 1;
    } else {
      // Neues Spiel mit deutschen Namen anlegen.
      const newId = fixtureId({
        homeTeam: homeDE,
        awayTeam: awayDE,
        kickoff: ext.kickoff,
      });
      const data: Omit<MatchDoc, "id"> = {
        externalId: ext.externalId,
        homeTeam: homeDE,
        awayTeam: awayDE,
        stage: ext.stage,
        kickoff: ext.kickoff,
        status: ext.status,
        homeScore: ext.homeScore,
        awayScore: ext.awayScore,
      };
      batch.set(db().collection(Collections.matches).doc(newId), data, {
        merge: true,
      });
      created += 1;
    }

    if (ext.status === "FINISHED") finished += 1;
  }

  await batch.commit();
  await recomputePoints();

  return { fetched: external.length, updated, created, finished };
}
