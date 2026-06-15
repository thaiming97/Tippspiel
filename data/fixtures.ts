import type { MatchDoc } from "@/lib/types";

/**
 * Start-Seed der WM-2026-Spiele ab dem 15.06.2026 (Gruppenphase).
 *
 * Diese Liste bringt das Tippspiel sofort zum Laufen. Die vollständige
 * Spielliste und vor allem die Live-Ergebnisse werden anschließend über die
 * automatische Synchronisation (`/api/cron/sync`, football-data.org) gepflegt
 * – dabei werden Anstoßzeiten und Endstände korrigiert/ergänzt.
 *
 * Anstoßzeiten in UTC (WM 2026 läuft in Nordamerika).
 */
type SeedMatch = Omit<MatchDoc, "id">;

export const SEED_FIXTURES: SeedMatch[] = [
  // ---------------- Montag, 15.06.2026 ----------------
  m("Schweden", "Tunesien", "Gruppe F", "2026-06-15T16:00:00Z"),
  m("Spanien", "Kap Verde", "Gruppe H", "2026-06-15T17:00:00Z"),
  m("Belgien", "Ägypten", "Gruppe G", "2026-06-15T22:00:00Z"),
  m("Saudi-Arabien", "Uruguay", "Gruppe H", "2026-06-15T22:00:00Z"),

  // ---------------- Dienstag, 16.06.2026 ----------------
  m("Iran", "Neuseeland", "Gruppe G", "2026-06-16T17:00:00Z"),
  m("Frankreich", "Senegal", "Gruppe I", "2026-06-16T19:00:00Z"),
  m("Irak", "Norwegen", "Gruppe I", "2026-06-16T22:00:00Z"),
  m("Argentinien", "Algerien", "Gruppe J", "2026-06-17T01:00:00Z"),
  m("Österreich", "Jordanien", "Gruppe J", "2026-06-17T04:00:00Z"),

  // ---------------- Mittwoch, 17.06.2026 ----------------
  m("Portugal", "DR Kongo", "Gruppe K", "2026-06-17T17:00:00Z"),
  m("England", "Kroatien", "Gruppe L", "2026-06-17T20:00:00Z"),
  m("Ghana", "Panama", "Gruppe L", "2026-06-17T23:00:00Z"),
  m("Usbekistan", "Kolumbien", "Gruppe K", "2026-06-18T02:00:00Z"),
];

function m(
  homeTeam: string,
  awayTeam: string,
  stage: string,
  kickoff: string,
): SeedMatch {
  return {
    externalId: null,
    homeTeam,
    awayTeam,
    stage,
    kickoff,
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
  };
}

/** Erzeugt eine stabile, lesbare Dokument-ID für ein Spiel. */
export function fixtureId(match: {
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
}): string {
  const date = match.kickoff.slice(0, 10);
  const slug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${date}_${slug(match.homeTeam)}_vs_${slug(match.awayTeam)}`;
}
