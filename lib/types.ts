/** Gemeinsame Typdefinitionen für das Tippspiel. */

export type Role = "admin" | "user";

export interface UserDoc {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  /** true, solange der Nutzer sein Startpasswort noch nicht geändert hat. */
  mustChangePassword: boolean;
  createdAt: number;
}

/** Status eines Spiels (angelehnt an football-data.org). */
export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export interface MatchDoc {
  id: string;
  /** Externe ID aus der Fußball-API (für den Sync). */
  externalId?: number | null;
  homeTeam: string;
  awayTeam: string;
  /** Gruppe/Phase, z.B. "Gruppe F" oder "Achtelfinale". */
  stage: string;
  /** ISO-Zeitstempel des Anstoßes. */
  kickoff: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}

export interface BetDoc {
  id: string; // `${userId}_${matchId}`
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  /** Punkte für diesen Tipp, sobald das Spiel beendet ist. */
  points: number | null;
  updatedAt: number;
}

export interface StandingRow {
  userId: string;
  name: string;
  points: number;
  /** Anzahl exakt richtiger Tipps. */
  exact: number;
  /** Anzahl gewerteter (beendeter) Spiele. */
  played: number;
}
