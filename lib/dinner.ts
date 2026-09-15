/**
 * Weihnachtsessen-Umfrage – gemeinsame Konstanten und reine Helfer.
 *
 * Diese Datei ist absichtlich frei von Server-Code (kein `server-only`,
 * kein Firestore), damit sie sowohl in Server- als auch in Client-
 * Komponenten importiert werden kann.
 */

import type { DinnerResponseDoc, DinnerVote } from "./types";

/** Zeitraum der Umfrage: ab 12.11. bis 18.12. */
export const DINNER_RANGE = { from: "2026-11-12", to: "2026-12-18" } as const;

/** Wochentage, an denen ein Termin möglich ist: Donnerstag (4), Freitag (5). */
const DINNER_WEEKDAYS = [4, 5];

/**
 * Baut die Terminliste aus der Regel „jeden Donnerstag und Freitag im
 * Zeitraum". Gerechnet wird mit 12:00 UTC, damit weder Zeitzone noch
 * Sommer-/Winterzeit den Kalendertag verschieben können.
 */
export function buildDinnerDates(
  from: string = DINNER_RANGE.from,
  to: string = DINNER_RANGE.to,
): string[] {
  const dates: string[] = [];
  const end = new Date(`${to}T12:00:00Z`);
  const day = new Date(`${from}T12:00:00Z`);
  while (day <= end) {
    if (DINNER_WEEKDAYS.includes(day.getUTCDay())) {
      dates.push(day.toISOString().slice(0, 10));
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}

/** Alle zur Wahl stehenden Termine als `YYYY-MM-DD` (chronologisch). */
export const DINNER_DATES = buildDinnerDates();

export interface Restaurant {
  id: string;
  name: string;
  /** Ort, wird unter dem Namen angezeigt. */
  town: string;
  /** Zwei Buchstaben für die Übersichts-Tabelle (eindeutig). */
  short: string;
}

/** Die Restaurants zur Auswahl. */
export const RESTAURANTS: Restaurant[] = [
  { id: "krone", name: "Krone", town: "Unsleben", short: "Kr" },
  { id: "braunsmuehle", name: "Braunsmühle", town: "Bischofsheim", short: "Bm" },
  {
    id: "brueckenschenke",
    name: "Brückenschenke",
    town: "Wülfershausen",
    short: "Bs",
  },
];

export function restaurantById(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}

/** Anzeigename inkl. Ort, z.B. „Krone Unsleben". */
export function restaurantLabel(id: string): string {
  const r = restaurantById(id);
  return r ? `${r.name} ${r.town}` : id;
}

/** Beschriftung und Symbol je Antwort-Möglichkeit. */
export const VOTE_LABELS: Record<DinnerVote, { short: string; long: string; icon: string }> = {
  yes: { short: "Ja", long: "Passt", icon: "✓" },
  maybe: { short: "Wenn nötig", long: "Geht, wenn nötig", icon: "~" },
  no: { short: "Nein", long: "Passt nicht", icon: "–" },
};

/** Grenzen für die Eingaben aus dem öffentlichen Formular. */
export const MAX_NAME_LENGTH = 40;
export const MAX_COMMENT_LENGTH = 200;
/** Obergrenze an Antworten, damit die Umfrage nicht zugespamt werden kann. */
export const MAX_RESPONSES = 300;

/**
 * Normalisiert den Namen zu einer Dokument-ID. Derselbe Name aktualisiert
 * damit die eigene Antwort, statt eine zweite Zeile anzulegen.
 */
export function dinnerKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "");
}

/** Auszählung eines einzelnen Termins. */
export interface DateTally {
  date: string;
  yes: number;
  maybe: number;
  /** „Ja" zählt doppelt, „Wenn nötig" einfach – zum Sortieren. */
  score: number;
}

/** Zählt für jeden Termin die Zusagen aus (chronologisch). */
export function tallyDates(responses: DinnerResponseDoc[]): DateTally[] {
  return DINNER_DATES.map((date) => {
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

/** Auszählung eines Restaurants. */
export interface RestaurantTally {
  id: string;
  votes: number;
}

/** Zählt die Restaurant-Stimmen aus, meiste zuerst. */
export function tallyRestaurants(
  responses: DinnerResponseDoc[],
): RestaurantTally[] {
  return RESTAURANTS.map((r) => ({
    id: r.id,
    votes: responses.filter((x) => x.restaurants.includes(r.id)).length,
  })).sort((a, b) => b.votes - a.votes);
}

/** „Do, 12.11." – kompakt für Tabellenköpfe und Chips. */
export function formatDinnerDate(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Wochentag-Kürzel, z.B. „Do" – für die Tabellenüberschrift. */
export function dinnerWeekday(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Tag und Monat, z.B. „12.11." – für die Tabellenüberschrift. */
export function dinnerDayMonth(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** „Donnerstag, 12. November" – für Überschriften und Ergebnis-Banner. */
export function formatDinnerDateLong(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Monat als Gruppierungs-Beschriftung, z.B. „November". */
export function monthLabel(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
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
