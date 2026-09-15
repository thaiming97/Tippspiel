import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db, Collections, DINNER_SETTINGS_DOC } from "./firebaseAdmin";
import {
  DINNER_DATES,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_RESPONSES,
  RESTAURANTS,
  dinnerKey,
} from "./dinner";
import type { DinnerResponseDoc, DinnerSettingsDoc, DinnerVote } from "./types";

/**
 * Datenzugriff der Weihnachtsessen-Umfrage.
 *
 * Wie im restlichen Projekt läuft alles serverseitig über das Admin SDK –
 * der Browser spricht nie direkt mit Firestore. Die Umfrage-Seite ist
 * öffentlich, wird also womöglich oft aufgerufen; Antworten und
 * Einstellungen liegen deshalb im Next.js Data Cache und werden bei jedem
 * Schreibvorgang gezielt entwertet (Tag DINNER_TAG).
 */
export const DINNER_TAG = "dinner";

/** Vorgabe, solange der Admin nichts gespeichert hat. */
const DEFAULT_SETTINGS: DinnerSettingsDoc = {
  open: true,
  showResults: true,
  finalDate: null,
  finalRestaurant: null,
  note: "",
  updatedAt: 0,
};

const loadResponses = unstable_cache(
  async (): Promise<DinnerResponseDoc[]> => {
    const snap = await db()
      .collection(Collections.dinnerResponses)
      .orderBy("createdAt")
      .get();
    return snap.docs.map((d) => {
      const data = d.data() as Omit<DinnerResponseDoc, "id">;
      return {
        id: d.id,
        name: data.name,
        dates: data.dates ?? {},
        restaurants: data.restaurants ?? [],
        comment: data.comment ?? "",
        createdAt: data.createdAt ?? 0,
        updatedAt: data.updatedAt ?? 0,
      };
    });
  },
  ["dinner-responses"],
  { tags: [DINNER_TAG], revalidate: 3600 },
);

/** Alle Antworten, in der Reihenfolge ihrer Abgabe. */
export async function getDinnerResponses(): Promise<DinnerResponseDoc[]> {
  return loadResponses();
}

const loadSettings = unstable_cache(
  async (): Promise<DinnerSettingsDoc> => {
    const snap = await db()
      .collection(Collections.dinnerSettings)
      .doc(DINNER_SETTINGS_DOC)
      .get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<DinnerSettingsDoc>) };
  },
  ["dinner-settings"],
  { tags: [DINNER_TAG], revalidate: 3600 },
);

export async function getDinnerSettings(): Promise<DinnerSettingsDoc> {
  return loadSettings();
}

export interface DinnerSubmission {
  name: string;
  /** Nur „yes"/„maybe" – „no" wird als fehlender Schlüssel gespeichert. */
  dates: Record<string, Exclude<DinnerVote, "no">>;
  restaurants: string[];
  comment: string;
}

/**
 * Speichert eine Antwort. Der normalisierte Name ist die Doc-ID: Wer noch
 * einmal mit demselben Namen abstimmt, aktualisiert seine Antwort, statt
 * eine zweite Zeile anzulegen.
 */
export async function saveDinnerResponse(
  input: DinnerSubmission,
): Promise<{ updated: boolean }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  const id = dinnerKey(name);
  if (!id) throw new Error("Bitte gib deinen Namen ein.");
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen haben.`);
  }

  // Nur bekannte Termine/Restaurants übernehmen – das Formular ist öffentlich.
  const dates: Record<string, DinnerVote> = {};
  for (const date of DINNER_DATES) {
    const vote = input.dates[date];
    if (vote === "yes" || vote === "maybe") dates[date] = vote;
  }
  if (Object.keys(dates).length === 0) {
    throw new Error(
      "Bitte wähle mindestens einen Termin aus („Ja“ oder „Wenn nötig“).",
    );
  }

  const restaurants = RESTAURANTS.filter((r) =>
    input.restaurants.includes(r.id),
  ).map((r) => r.id);

  const comment = input.comment.trim().slice(0, MAX_COMMENT_LENGTH);

  const ref = db().collection(Collections.dinnerResponses).doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    // Die Umfrage ist ohne Anmeldung erreichbar – Zeilenzahl deckeln.
    const count = (await getDinnerResponses()).length;
    if (count >= MAX_RESPONSES) {
      throw new Error("Die Umfrage hat zu viele Einträge. Bitte melde dich beim Organisator.");
    }
  }

  const now = Date.now();
  await ref.set(
    {
      name,
      dates,
      restaurants,
      comment,
      createdAt: existing.exists
        ? ((existing.data() as DinnerResponseDoc).createdAt ?? now)
        : now,
      updatedAt: now,
    },
    { merge: false },
  );

  revalidateTag(DINNER_TAG);
  return { updated: existing.exists };
}

/** Entfernt eine Antwort (nur Admin). */
export async function deleteDinnerResponse(id: string): Promise<void> {
  await db().collection(Collections.dinnerResponses).doc(id).delete();
  revalidateTag(DINNER_TAG);
}

/** Schreibt die Einstellungen (nur Admin). */
export async function updateDinnerSettings(
  patch: Partial<Omit<DinnerSettingsDoc, "updatedAt">>,
): Promise<void> {
  await db()
    .collection(Collections.dinnerSettings)
    .doc(DINNER_SETTINGS_DOC)
    .set({ ...patch, updatedAt: Date.now() }, { merge: true });
  revalidateTag(DINNER_TAG);
}
