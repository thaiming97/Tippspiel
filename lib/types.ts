/** Gemeinsame Typdefinitionen für das Tippspiel. */

export type Role = "admin" | "user";

/** Tipp-Umfang: nur Gruppe E (1€-Pool) oder alle Spiele. */
export type Scope = "group_e" | "all";

export interface UserDoc {
  id: string;
  /** Login-Name (normalisiert, eindeutig). */
  username: string;
  /** Optional – nur informativ, nicht für den Login. */
  email?: string;
  name: string;
  passwordHash: string;
  role: Role;
  /** Für welche Spiele der Nutzer tippt/gewertet wird. */
  scope: Scope;
  /** true, solange der Nutzer sein Startpasswort noch nicht geändert hat. */
  mustChangePassword: boolean;
  createdAt: number;
  /** Zeitpunkt des letzten erfolgreichen Logins (ms seit Epoch). */
  lastLoginAt?: number;
  /**
   * Zeitpunkt der letzten Aktivität (ms seit Epoch). Wird bei jedem
   * authentifizierten Seitenaufruf gedrosselt aktualisiert – im Gegensatz zu
   * lastLoginAt spiegelt das „zuletzt online" wider, auch wenn man eingeloggt
   * bleibt.
   */
  lastSeenAt?: number;
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

/** Name der Phase, anhand derer Gruppe-E-Spiele erkannt werden. */
export const GROUP_E_STAGE = "Gruppe E";

export interface StandingRow {
  userId: string;
  name: string;
  points: number;
  /** Anzahl exakt richtiger Tipps. */
  exact: number;
  /** Anzahl gewerteter (beendeter) Spiele. */
  played: number;
}

/** Eine Chat-Nachricht im Community-Bereich. */
export interface ChatMessage {
  id: string;
  /** Verfasser (User-ID) – zum Erkennen eigener Nachrichten. */
  userId: string;
  /** Anzeigename zum Zeitpunkt des Schreibens (denormalisiert). */
  name: string;
  text: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Weihnachtsessen-Umfrage (öffentlich, ohne Anmeldung)
// ---------------------------------------------------------------------------

/** Antwort zu einem Termin. */
export type DinnerVote = "yes" | "maybe" | "no";

/** Eine abgegebene Antwort. Doc-ID ist der normalisierte Name. */
export interface DinnerResponseDoc {
  id: string;
  /** Anzeigename, so wie eingegeben. */
  name: string;
  /**
   * Termin (`YYYY-MM-DD`) -> Stimme. „Nein" wird nicht gespeichert, ein
   * fehlender Schlüssel bedeutet also „passt nicht".
   */
  dates: Record<string, DinnerVote>;
  /** IDs der gewählten Restaurants (Mehrfachauswahl). */
  restaurants: string[];
  /** Freiwillige Anmerkung, z.B. „erst ab 19 Uhr". */
  comment: string;
  createdAt: number;
  updatedAt: number;
}

/** Einstellungen der Umfrage (ein einzelnes Dokument). */
export interface DinnerSettingsDoc {
  /** Solange offen, kann jeder abstimmen. */
  open: boolean;
  /** Ob alle den Überblick über die Antworten sehen. */
  showResults: boolean;
  /** Festgelegter Termin (`YYYY-MM-DD`) oder null. */
  finalDate: string | null;
  /** Festgelegtes Restaurant (ID) oder null. */
  finalRestaurant: string | null;
  /** Hinweis vom Organisator, z.B. „Treffpunkt 19:00 Uhr". */
  note: string;
  updatedAt: number;
}
