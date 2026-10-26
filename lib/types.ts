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
// Umfragen (Termin- und Ortswahl, Antwort gehört einem Konto)
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
 * Wer eine Umfrage sieht: alle Angemeldeten oder nur die Mitglieder
 * bestimmter Gruppen. Organisatoren sehen immer alles.
 */
export type PollAudience = "all" | "groups";

/**
 * Eine Gruppe von Teilnehmern, z.B. „Abteilung" oder „Familie". Über Gruppen
 * legt der Organisator fest, wer welche Umfrage sieht – so laufen mehrere
 * Runden unabhängig voneinander.
 */
export interface GroupDoc {
  id: string;
  name: string;
  /** Benutzer-IDs der Mitglieder. */
  memberIds: string[];
  createdAt: number;
}

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
  /** Sichtbarkeit; ältere Umfragen ohne Feld gelten als „alle". */
  audience: PollAudience;
  /**
   * Gruppen, die die Umfrage sehen (nur bei `audience: "groups"`). Leer oder
   * nur gelöschte Gruppen = nur die Organisatoren sehen sie – nie „alle".
   */
  groupIds: string[];
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
 * Eine abgegebene Antwort. Die Dokument-ID ist die Benutzer-ID: jede Person
 * hat je Umfrage genau eine Antwort und kann nur ihre eigene ändern.
 */
export interface ResponseDoc {
  id: string;
  /**
   * Konto, dem die Antwort gehört. Leer bei Antworten aus der Zeit, in der
   * ohne Anmeldung abgestimmt wurde – die kann nur der Organisator löschen.
   */
  userId: string;
  /** Anzeigename des Kontos zum Zeitpunkt der Antwort (denormalisiert). */
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
