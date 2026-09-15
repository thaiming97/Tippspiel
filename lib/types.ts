/** Gemeinsame Typdefinitionen für FF Entertainment. */

export type Role = "admin" | "user";

export interface UserDoc {
  id: string;
  /** Login-Name (normalisiert, eindeutig). */
  username: string;
  /** Optional – nur informativ, nicht für den Login. */
  email?: string;
  name: string;
  passwordHash: string;
  role: Role;
  /** true, solange der Nutzer sein Startpasswort noch nicht geändert hat. */
  mustChangePassword: boolean;
  createdAt: number;
  /** Zeitpunkt des letzten erfolgreichen Logins (ms seit Epoch). */
  lastLoginAt?: number;
  /** Zeitpunkt der letzten Aktivität (ms seit Epoch), gedrosselt gepflegt. */
  lastSeenAt?: number;
}

// ---------------------------------------------------------------------------
// Umfragen (Termin- und Ortswahl, öffentlich ohne Anmeldung)
// ---------------------------------------------------------------------------

/** Antwort zu einem einzelnen Termin. */
export type Vote = "yes" | "maybe" | "no";

/** Eine Auswahl-Option, z.B. ein Restaurant oder ein Ausflugsziel. */
export interface PollChoice {
  /** Kurz-ID innerhalb der Umfrage (aus dem Namen erzeugt). */
  id: string;
  name: string;
  /** Zusatz unter dem Namen, z.B. der Ort. Darf leer sein. */
  hint: string;
}

/** Optik der öffentlichen Seite. */
export type PollTheme = "weihnachten" | "neutral";

/**
 * Eine Umfrage. Die Dokument-ID ist der Slug und damit Teil des Links
 * (`/umfrage/<slug>`) – sie steht nach dem Anlegen fest.
 */
export interface PollDoc {
  id: string;
  title: string;
  /** Einleitungstext auf der öffentlichen Seite. */
  description: string;
  theme: PollTheme;
  /** Zur Wahl stehende Termine als `YYYY-MM-DD`, chronologisch. */
  dates: string[];
  /** Überschrift über den Optionen, z.B. „Wo soll's hingehen?". */
  choicesTitle: string;
  choices: PollChoice[];
  /** Solange offen, kann jeder abstimmen. */
  open: boolean;
  /** Ob alle den Stand sehen oder nur die Organisatoren. */
  showResults: boolean;
  /** Festgelegter Termin (`YYYY-MM-DD`) oder null. */
  finalDate: string | null;
  /** Festgelegte Option (Choice-ID) oder null. */
  finalChoice: string | null;
  /** Hinweis vom Organisator, z.B. „Treffpunkt 19:00 Uhr". */
  note: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Eine abgegebene Antwort. Die Dokument-ID ist der normalisierte Name, damit
 * dieselbe Person ihre Antwort bearbeitet statt eine zweite anzulegen.
 */
export interface ResponseDoc {
  id: string;
  /** Anzeigename, so wie eingegeben. */
  name: string;
  /**
   * Termin -> Stimme. „Nein" wird nicht gespeichert, ein fehlender
   * Schlüssel bedeutet also „passt nicht".
   */
  dates: Record<string, Vote>;
  /** IDs der gewählten Optionen (Mehrfachauswahl). */
  choices: string[];
  /**
   * true = „bin komplett raus": kann an keinem Termin. Dann sind `dates` und
   * `choices` leer, die Antwort zählt aber als abgegeben – so weiß der
   * Organisator, dass er nicht auf diese Person warten muss.
   */
  declined: boolean;
  /** Freiwillige Anmerkung, z.B. „erst ab 19 Uhr". */
  comment: string;
  createdAt: number;
  updatedAt: number;
}
