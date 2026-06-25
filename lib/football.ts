import "server-only";
import type { MatchStatus } from "./types";

/**
 * Anbindung an football-data.org, um Spielplan und Live-Ergebnisse aus dem
 * Internet zu ziehen. Kostenloses API-Token: https://www.football-data.org
 *
 * Liefert das Token fehlt, wird ein leeres Ergebnis zurückgegeben – das
 * Tippspiel funktioniert dann mit dem Seed + manueller Ergebnis-Eingabe.
 */
export interface ExternalMatch {
  externalId: number;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  kickoff: string; // ISO UTC
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "SCHEDULED",
  TIMED: "TIMED",
  IN_PLAY: "IN_PLAY",
  PAUSED: "PAUSED",
  FINISHED: "FINISHED",
  SUSPENDED: "PAUSED",
  POSTPONED: "POSTPONED",
  CANCELLED: "CANCELLED",
  AWARDED: "FINISHED",
};

function prettyStage(raw: string | undefined, group: string | null): string {
  if (group) return group.replace("GROUP_", "Gruppe ");
  switch (raw) {
    case "GROUP_STAGE":
      return "Gruppenphase";
    case "LAST_32":
      return "Sechzehntelfinale";
    case "LAST_16":
      return "Achtelfinale";
    case "QUARTER_FINALS":
      return "Viertelfinale";
    case "SEMI_FINALS":
      return "Halbfinale";
    case "THIRD_PLACE":
      return "Spiel um Platz 3";
    case "FINAL":
      return "Finale";
    default:
      return raw ?? "WM 2026";
  }
}

/**
 * Holt alle Spiele des konfigurierten Wettbewerbs (inkl. aktueller Ergebnisse).
 */
export async function fetchMatches(): Promise<ExternalMatch[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  const competition = process.env.FOOTBALL_DATA_COMPETITION || "WC";
  if (!token) return [];

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competition}/matches`,
    {
      headers: { "X-Auth-Token": token },
      // Immer frische Daten ziehen.
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      `football-data.org antwortete mit ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as { matches?: any[] };
  const matches = data.matches ?? [];

  return matches.map((mt): ExternalMatch => ({
    externalId: mt.id,
    homeTeam: mt.homeTeam?.name ?? "TBD",
    awayTeam: mt.awayTeam?.name ?? "TBD",
    stage: prettyStage(mt.stage, mt.group ?? null),
    kickoff: mt.utcDate,
    status: STATUS_MAP[mt.status] ?? "SCHEDULED",
    homeScore: mt.score?.fullTime?.home ?? null,
    awayScore: mt.score?.fullTime?.away ?? null,
  }));
}
