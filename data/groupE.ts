import type { MatchDoc, Scope } from "@/lib/types";
import { fixtureId } from "./fixtures";

/**
 * Daten aus dem Excel-Tippblatt „WM 2026 Tippspiel" (Gruppe E, 1€-Pool).
 * Teilnehmer, die 6 Gruppe-E-Spiele inkl. echter Ergebnisse sowie alle
 * abgegebenen Tipps. Wird von `npm run seed` nach Firestore geschrieben.
 */

export interface SeedParticipant {
  name: string;
  email: string;
  scope: Scope;
}

// E-Mails sind Platzhalter (geschlossener Pool) – der Admin gibt sie zusammen
// mit dem Startpasswort aus. Felix nutzt seine echte Adresse.
export const PARTICIPANTS: SeedParticipant[] = [
  { name: "Peter", email: "peter@wm-tippspiel.local", scope: "group_e" },
  { name: "Niklas", email: "niklas@wm-tippspiel.local", scope: "group_e" },
  { name: "Jens", email: "jens@wm-tippspiel.local", scope: "group_e" },
  { name: "Christian", email: "christian@wm-tippspiel.local", scope: "group_e" },
  { name: "Elena", email: "elena@wm-tippspiel.local", scope: "group_e" },
  { name: "Feli", email: "feli@wm-tippspiel.local", scope: "group_e" },
  { name: "Jürgen B.", email: "juergen.b@wm-tippspiel.local", scope: "group_e" },
  { name: "Reiner", email: "reiner@wm-tippspiel.local", scope: "group_e" },
  { name: "Olli", email: "olli@wm-tippspiel.local", scope: "group_e" },
  { name: "Leon", email: "leon@wm-tippspiel.local", scope: "group_e" },
  { name: "Alex", email: "alex@wm-tippspiel.local", scope: "group_e" },
  { name: "Felix", email: "felix.m.martin97@gmail.com", scope: "group_e" },
  { name: "Karo", email: "karo@wm-tippspiel.local", scope: "group_e" },
  { name: "Kurt", email: "kurt@wm-tippspiel.local", scope: "group_e" },
];

type SeedMatch = Omit<MatchDoc, "id">;

/**
 * Die 6 Gruppe-E-Spiele in offizieller Reihenfolge (entspricht der
 * Block-Reihenfolge im Excel). Anstoßzeiten in UTC (EDT = UTC-4).
 */
export const GROUP_E_MATCHES: SeedMatch[] = [
  // Spieltag 1 – 14.06.2026 (gespielt)
  finished("Deutschland", "Curaçao", "2026-06-14T17:00:00Z", 7, 1),
  finished("Elfenbeinküste", "Ecuador", "2026-06-14T23:00:00Z", 1, 0),
  // Spieltag 2 – 20.06.2026
  scheduled("Deutschland", "Elfenbeinküste", "2026-06-20T20:00:00Z"),
  scheduled("Ecuador", "Curaçao", "2026-06-21T00:00:00Z"),
  // Spieltag 3 – 25.06.2026 (zeitgleich)
  scheduled("Ecuador", "Deutschland", "2026-06-25T20:00:00Z"),
  scheduled("Curaçao", "Elfenbeinküste", "2026-06-25T20:00:00Z"),
];

/**
 * Tipps je Spiel (Index 0–5 = Reihenfolge in GROUP_E_MATCHES) und Teilnehmer.
 * null = kein Tipp abgegeben.
 */
export const GROUP_E_TIPS: Record<string, (readonly [number, number] | null)[]> = {
  // [Spiel1, Spiel2, Spiel3, Spiel4, Spiel5, Spiel6]
  Peter: [[3, 1], [2, 0], [2, 2], [3, 1], [0, 1], [0, 4]],
  Niklas: [[4, 0], [1, 2], [2, 1], [3, 0], [1, 1], [0, 2]],
  Jens: [[3, 0], [3, 1], [1, 2], [2, 1], [1, 2], [0, 3]],
  Christian: [[5, 0], [1, 1], [2, 1], [2, 1], [0, 2], [1, 3]],
  Elena: [[4, 1], [1, 2], [3, 2], [3, 2], [2, 2], [0, 2]],
  Feli: [[2, 0], [1, 0], [2, 0], [2, 0], [1, 3], [1, 3]],
  "Jürgen B.": [[4, 2], [3, 1], [1, 1], [2, 0], [1, 4], [0, 4]],
  Reiner: [null, null, null, null, null, null],
  Olli: [[5, 1], [1, 2], [2, 1], [2, 0], [1, 1], [0, 2]],
  Leon: [[3, 2], [2, 1], [2, 1], [2, 1], [2, 3], [1, 3]],
  Alex: [[2, 0], [1, 1], [3, 0], [2, 0], [1, 2], [0, 2]],
  Felix: [[3, 0], [0, 0], null, null, null, null],
  Karo: [[3, 1], [2, 1], [4, 1], [2, 2], [0, 3], [2, 2]],
  Kurt: [[1, 0], [1, 1], [1, 0], [1, 0], [1, 2], [1, 1]],
};

export function groupEMatchIds(): string[] {
  return GROUP_E_MATCHES.map((m) => fixtureId(m));
}

function finished(
  homeTeam: string,
  awayTeam: string,
  kickoff: string,
  homeScore: number,
  awayScore: number,
): SeedMatch {
  return {
    externalId: null,
    homeTeam,
    awayTeam,
    stage: "Gruppe E",
    kickoff,
    status: "FINISHED",
    homeScore,
    awayScore,
  };
}

function scheduled(
  homeTeam: string,
  awayTeam: string,
  kickoff: string,
): SeedMatch {
  return {
    externalId: null,
    homeTeam,
    awayTeam,
    stage: "Gruppe E",
    kickoff,
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
  };
}
