/**
 * Umfragen – gemeinsame Konstanten und reine Helfer.
 *
 * Absichtlich frei von Server-Code (kein `server-only`, kein Firestore),
 * damit die Datei sowohl in Server- als auch in Client-Komponenten
 * importiert werden kann.
 */

import type { PollChoice, PollDoc, ResponseDoc, Vote } from "./types";

// --- Grenzen -------------------------------------------------------------

export const MAX_NAME_LENGTH = 40;
export const MAX_COMMENT_LENGTH = 200;
export const MAX_TITLE_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 400;
export const MAX_NOTE_LENGTH = 300;
export const MAX_DATES = 40;
export const MAX_CHOICES = 12;
/** Obergrenze je Umfrage, damit ein offener Link nicht zugespamt wird. */
export const MAX_RESPONSES = 300;

// --- Text -> Slug --------------------------------------------------------

/** Deutsche Sonderzeichen für die Slug-Bildung. */
const UMLAUTS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

/**
 * Macht aus einem Titel einen Link-taugliches Slug:
 * „Weihnachtsessen der Abteilung" -> „weihnachtsessen-der-abteilung".
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUTS[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Normalisiert den Namen einer Antwort zur Dokument-ID: klein, getrimmt,
 * Mehrfach-Leerzeichen reduziert, Punkt am Ende entfernt.
 */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "");
}

// --- Termine -------------------------------------------------------------

/** Wochentage für den Termin-Generator, Montag zuerst. */
export const WEEKDAYS = [
  { value: 1, short: "Mo", long: "Montag" },
  { value: 2, short: "Di", long: "Dienstag" },
  { value: 3, short: "Mi", long: "Mittwoch" },
  { value: 4, short: "Do", long: "Donnerstag" },
  { value: 5, short: "Fr", long: "Freitag" },
  { value: 6, short: "Sa", long: "Samstag" },
  { value: 0, short: "So", long: "Sonntag" },
];

/** Prüft ein Datum im Format `YYYY-MM-DD` auf Gültigkeit. */
export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * Erzeugt alle Termine zwischen zwei Daten, die auf einen der gewählten
 * Wochentage fallen (z.B. „jeden Do und Fr vom 12.11. bis 18.12.").
 *
 * Gerechnet wird mit 12:00 UTC, damit weder Zeitzone noch Sommer-/Winterzeit
 * den Kalendertag verschieben können.
 */
export function buildDates(
  from: string,
  to: string,
  weekdays: number[],
): string[] {
  if (!isDate(from) || !isDate(to) || weekdays.length === 0) return [];
  const dates: string[] = [];
  const end = new Date(`${to}T12:00:00Z`);
  const day = new Date(`${from}T12:00:00Z`);
  while (day <= end && dates.length < MAX_DATES) {
    if (weekdays.includes(day.getUTCDay())) {
      dates.push(day.toISOString().slice(0, 10));
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}

/** Sortiert, entdoppelt und begrenzt eine Terminliste. */
export function cleanDates(dates: string[]): string[] {
  return Array.from(new Set(dates.filter(isDate)))
    .sort()
    .slice(0, MAX_DATES);
}

function asDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** „Do, 12.11." – kompakt für Chips und Listen. */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(asDate(date));
}

/** „Donnerstag, 12. November" – für Überschriften und Banner. */
export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(asDate(date));
}

/** Wochentag-Kürzel, z.B. „Do" – für Tabellenköpfe. */
export function weekdayShort(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    timeZone: "UTC",
  }).format(asDate(date));
}

/** Tag und Monat, z.B. „12.11." – für Tabellenköpfe. */
export function dayMonth(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(asDate(date));
}

/** Monatsname, z.B. „November" – zum Gruppieren im Formular. */
export function monthLabel(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    month: "long",
    timeZone: "UTC",
  }).format(asDate(date));
}

/** Termine nach Monat gruppieren (für die Darstellung im Formular). */
export function groupByMonth(
  dates: string[],
): { label: string; dates: string[] }[] {
  const groups: { label: string; dates: string[] }[] = [];
  for (const date of dates) {
    const label = monthLabel(date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.dates.push(date);
    else groups.push({ label, dates: [date] });
  }
  return groups;
}

/** „12.11. – 18.12." als Kurzinfo für die Übersicht. */
export function dateRangeLabel(dates: string[]): string {
  if (dates.length === 0) return "keine Termine";
  if (dates.length === 1) return formatDate(dates[0]);
  return `${dayMonth(dates[0])} – ${dayMonth(dates[dates.length - 1])}`;
}

// --- Antwort-Möglichkeiten ----------------------------------------------

/** Beschriftung und Symbol je Antwort. */
export const VOTE_LABELS: Record<Vote, { label: string; icon: string; title: string }> = {
  yes: { label: "Ja", icon: "✓", title: "passt" },
  maybe: { label: "Wenn nötig", icon: "~", title: "geht, wenn nötig" },
  no: { label: "Nein", icon: "–", title: "passt nicht" },
};

// --- Auszählung ----------------------------------------------------------

export interface DateTally {
  date: string;
  yes: number;
  maybe: number;
  /** „Ja" zählt doppelt, „Wenn nötig" einfach – nur zum Sortieren. */
  score: number;
}

/** Zählt für jeden Termin die Zusagen aus (in der Reihenfolge der Umfrage). */
export function tallyDates(
  dates: string[],
  responses: ResponseDoc[],
): DateTally[] {
  return dates.map((date) => {
    let yes = 0;
    let maybe = 0;
    for (const r of responses) {
      if (r.dates[date] === "yes") yes += 1;
      else if (r.dates[date] === "maybe") maybe += 1;
    }
    return { date, yes, maybe, score: yes * 2 + maybe };
  });
}

/** Termine nach Beliebtheit: viele „Ja", dann viele „Wenn nötig", dann früh. */
export function rankDates(tallies: DateTally[]): DateTally[] {
  return [...tallies].sort(
    (a, b) => b.yes - a.yes || b.maybe - a.maybe || a.date.localeCompare(b.date),
  );
}

export interface ChoiceTally {
  choice: PollChoice;
  votes: number;
}

/** Zählt die Stimmen je Option aus, meiste zuerst. */
export function tallyChoices(
  choices: PollChoice[],
  responses: ResponseDoc[],
): ChoiceTally[] {
  return choices
    .map((choice) => ({
      choice,
      votes: responses.filter((r) => r.choices.includes(choice.id)).length,
    }))
    .sort((a, b) => b.votes - a.votes);
}

/** Kürzel für die Tabellenspalte, eindeutig innerhalb der Umfrage. */
export function choiceShorts(choices: PollChoice[]): Record<string, string> {
  const used = new Set<string>();
  const shorts: Record<string, string> = {};
  for (const choice of choices) {
    const letters = choice.name.replace(/[^\p{L}\p{N}]/gu, "");
    let short = letters.slice(0, 2) || "?";
    // Bei Dopplung weiterrutschen: „Br" -> „Bs" -> „Bc" …
    for (let i = 2; used.has(short.toLowerCase()) && i < letters.length; i += 1) {
      short = letters[0] + letters[i];
    }
    let n = 2;
    while (used.has(short.toLowerCase())) {
      short = `${letters[0] ?? "?"}${n}`;
      n += 1;
    }
    used.add(short.toLowerCase());
    shorts[choice.id] = short;
  }
  return shorts;
}

/** Findet eine Option anhand ihrer ID. */
export function choiceById(
  poll: PollDoc,
  id: string | null,
): PollChoice | undefined {
  if (!id) return undefined;
  return poll.choices.find((c) => c.id === id);
}

/** Anzeigename einer Option inkl. Zusatz, z.B. „Krone Unsleben". */
export function choiceLabel(choice: PollChoice): string {
  return choice.hint ? `${choice.name} ${choice.hint}` : choice.name;
}
