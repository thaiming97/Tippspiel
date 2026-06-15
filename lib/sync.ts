import "server-only";
import { db, Collections } from "./firebaseAdmin";
import { fetchMatches } from "./football";
import { getMatches, recomputePoints } from "./data";
import { fixtureId } from "@/data/fixtures";
import { pairKey, teamKey, translateTeam } from "./teams";
import type { MatchDoc } from "./types";

export interface SyncResult {
  fetched: number;
  updated: number;
  created: number;
  finished: number;
  /** true, wenn wegen geänderter Ergebnisse neu ausgewertet wurde. */
  recomputed: boolean;
}

/** Aktives Zeitfenster eines Spiels: ab 15 Min vor Anstoß bis 3h danach. */
const PRE_KICKOFF_MS = 15 * 60 * 1000;
const POST_KICKOFF_MS = 180 * 60 * 1000;

/**
 * Entscheidet anhand des (gecachten) Spielplans, ob ein Sync gerade überhaupt
 * sinnvoll ist – nämlich nur, wenn mindestens ein noch nicht beendetes Spiel
 * läuft oder in seinem aktiven Zeitfenster liegt (kurz vor Anstoß bis einige
 * Stunden danach, damit der Wechsel auf „beendet" sicher erfasst wird).
 *
 * Der Check nutzt den gecachten Spielplan und kostet im Normalfall 0
 * Firestore-Reads.
 */
export async function matchesAreActive(): Promise<boolean> {
  const matches = await getMatches();
  const now = Date.now();
  return matches.some((m) => {
    if (m.status === "IN_PLAY" || m.status === "PAUSED") return true;
    if (
      m.status === "FINISHED" ||
      m.status === "CANCELLED" ||
      m.status === "POSTPONED"
    ) {
      return false;
    }
    const kickoff = new Date(m.kickoff).getTime();
    if (Number.isNaN(kickoff)) return false;
    return now >= kickoff - PRE_KICKOFF_MS && now <= kickoff + POST_KICKOFF_MS;
  });
}

export interface GatedSyncResult extends SyncResult {
  /** true, wenn der Sync übersprungen wurde (kein Spiel im aktiven Fenster). */
  skipped: boolean;
}

/**
 * Sync nur ausführen, wenn gerade Spiele laufen/anstehen (siehe
 * matchesAreActive). Sonst wird ohne API-Aufruf und ohne DB-Read abgebrochen –
 * gedacht für den automatischen Cron, der sonst rund um die Uhr liefe.
 */
export async function syncIfMatchesActive(): Promise<GatedSyncResult> {
  if (!(await matchesAreActive())) {
    return {
      fetched: 0,
      updated: 0,
      created: 0,
      finished: 0,
      recomputed: false,
      skipped: true,
    };
  }
  const result = await syncFromInternet();
  return { ...result, skipped: false };
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
  // Nur neu auswerten, wenn sich tatsächlich ein Ergebnis/Status ändert –
  // sonst würde jeder Sync (alle 10 Min) unnötig die ganze DB lesen.
  let resultsChanged = false;
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

      // Ergebnis-relevante Änderung? (zählt für die Punkte-Neuberechnung)
      const resultDiff =
        cur.status !== ext.status ||
        cur.homeScore !== homeScore ||
        cur.awayScore !== awayScore;
      // Schreib-relevante Änderung? (zusätzlich Anstoß/externe ID)
      const writeDiff =
        resultDiff ||
        cur.kickoff !== ext.kickoff ||
        cur.externalId !== ext.externalId;

      if (writeDiff) {
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
      }
      if (resultDiff) resultsChanged = true;
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
      // Neues Spiel mit bereits feststehendem Ergebnis -> neu auswerten.
      if (ext.homeScore !== null || ext.awayScore !== null) {
        resultsChanged = true;
      }
    }

    if (ext.status === "FINISHED") finished += 1;
  }

  await batch.commit();
  // Punkte + Rangliste nur bei echten Ergebnis-Änderungen neu berechnen.
  if (resultsChanged) await recomputePoints();

  return { fetched: external.length, updated, created, finished, recomputed: resultsChanged };
}
