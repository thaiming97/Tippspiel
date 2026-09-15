import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db, Collections, RESPONSES } from "./firebaseAdmin";
import {
  MAX_CHOICES,
  MAX_COMMENT_LENGTH,
  MAX_DATES,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_RESPONSES,
  MAX_TITLE_LENGTH,
  cleanDates,
  isSlug,
  nameKey,
  slugify,
  type PollTemplate,
} from "./polls";
import type { PollChoice, PollDoc, PollTheme, ResponseDoc, Vote } from "./types";

/**
 * Datenzugriff der Umfragen.
 *
 * Wie im restlichen Projekt läuft alles serverseitig über das Admin SDK –
 * der Browser spricht nie direkt mit Firestore. Umfrage-Seiten sind
 * öffentlich und werden womöglich oft aufgerufen; Umfragen und Antworten
 * liegen deshalb im Next.js Data Cache und werden bei jedem Schreibvorgang
 * gezielt entwertet.
 */
export const POLLS_TAG = "polls";

/** Cache-Marke einer einzelnen Umfrage (inkl. ihrer Antworten). */
export function pollTag(slug: string): string {
  return `poll:${slug}`;
}

function polls() {
  return db().collection(Collections.polls);
}

/**
 * Dokument einer Umfrage. Der Slug kommt aus URL oder Formular, deshalb wird
 * seine Form geprüft, bevor er als Dokument-ID verwendet wird.
 */
function pollDoc(slug: string) {
  if (!isSlug(slug)) throw new Error("Diese Umfrage gibt es nicht (mehr).");
  return polls().doc(slug);
}

function responses(slug: string) {
  return pollDoc(slug).collection(RESPONSES);
}

/** Ergänzt fehlende Felder – schützt vor älteren/teilweisen Dokumenten. */
function toPoll(id: string, data: Partial<PollDoc>): PollDoc {
  return {
    id,
    title: data.title ?? id,
    description: data.description ?? "",
    theme: (data.theme as PollTheme) ?? "neutral",
    dates: data.dates ?? [],
    choicesTitle: data.choicesTitle ?? "Auswahl",
    choices: data.choices ?? [],
    open: data.open ?? true,
    showResults: data.showResults ?? true,
    finalDate: data.finalDate ?? null,
    finalChoice: data.finalChoice ?? null,
    note: data.note ?? "",
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  };
}

function toResponse(id: string, data: Partial<ResponseDoc>): ResponseDoc {
  return {
    id,
    name: data.name ?? id,
    dates: data.dates ?? {},
    choices: data.choices ?? [],
    comment: data.comment ?? "",
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  };
}

/** Eine Umfrage samt Teilnehmerzahl – für Übersichtslisten. */
export interface PollSummary {
  poll: PollDoc;
  count: number;
}

/** Alle Umfragen, neueste zuerst, mit Anzahl der Antworten. */
export async function listPolls(): Promise<PollSummary[]> {
  return unstable_cache(
    async () => {
      const snap = await polls().orderBy("createdAt", "desc").get();
      return Promise.all(
        snap.docs.map(async (d) => ({
          poll: toPoll(d.id, d.data() as Partial<PollDoc>),
          // Zählen statt laden: kostet nur einen Bruchteil der Reads.
          count: (await d.ref.collection(RESPONSES).count().get()).data().count,
        })),
      );
    },
    ["poll-list"],
    { tags: [POLLS_TAG], revalidate: 3600 },
  )();
}

/** Eine Umfrage oder null, wenn der Slug nicht existiert. */
export async function getPoll(slug: string): Promise<PollDoc | null> {
  // Unpassende Slugs sind schlicht „nicht gefunden" – kein Fehler.
  if (!isSlug(slug)) return null;
  return unstable_cache(
    async () => {
      const snap = await pollDoc(slug).get();
      if (!snap.exists) return null;
      return toPoll(snap.id, snap.data() as Partial<PollDoc>);
    },
    ["poll", slug],
    { tags: [pollTag(slug), POLLS_TAG], revalidate: 3600 },
  )();
}

/** Alle Antworten einer Umfrage, in der Reihenfolge ihrer Abgabe. */
export async function getResponses(slug: string): Promise<ResponseDoc[]> {
  return unstable_cache(
    async () => {
      const snap = await responses(slug).orderBy("createdAt").get();
      return snap.docs.map((d) => toResponse(d.id, d.data() as Partial<ResponseDoc>));
    },
    ["poll-responses", slug],
    { tags: [pollTag(slug)], revalidate: 3600 },
  )();
}

// --- Schreiben: Umfragen -------------------------------------------------

export interface PollInput {
  title: string;
  description: string;
  theme: PollTheme;
  dates: string[];
  choicesTitle: string;
  /** Optionen als Paare „Name | Zusatz" (Zusatz optional). */
  choices: { name: string; hint: string }[];
}

/** Baut die Optionen mit eindeutigen IDs aus den Eingaben. */
function buildChoices(input: PollInput["choices"]): PollChoice[] {
  const used = new Set<string>();
  const out: PollChoice[] = [];
  for (const raw of input.slice(0, MAX_CHOICES)) {
    const name = raw.name.trim().slice(0, 60);
    if (!name) continue;
    let id = slugify(name) || `option-${out.length + 1}`;
    while (used.has(id)) id = `${id}-${out.length + 1}`;
    used.add(id);
    out.push({ id, name, hint: raw.hint.trim().slice(0, 60) });
  }
  return out;
}

function checkInput(input: PollInput): void {
  if (!input.title.trim()) throw new Error("Bitte gib der Umfrage einen Titel.");
  if (input.title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Der Titel darf höchstens ${MAX_TITLE_LENGTH} Zeichen haben.`);
  }
  if (cleanDates(input.dates).length === 0) {
    throw new Error("Bitte gib mindestens einen Termin an.");
  }
  if (input.dates.length > MAX_DATES) {
    throw new Error(`Mehr als ${MAX_DATES} Termine sind zu viel für eine Umfrage.`);
  }
}

/** Legt eine Umfrage an und gibt ihren Slug zurück. */
export async function createPoll(input: PollInput): Promise<string> {
  checkInput(input);

  // Etwas Luft lassen: bei Dopplung wird "-2", "-3" … angehängt, und der
  // fertige Slug muss noch durch isSlug() passen.
  const base = (slugify(input.title) || "umfrage").slice(0, 50).replace(/-+$/, "");
  let slug = base;
  // Bei Dopplung eine Ziffer anhängen, damit der Link eindeutig bleibt.
  for (let i = 2; (await polls().doc(slug).get()).exists; i += 1) {
    slug = `${base}-${i}`;
  }

  const now = Date.now();
  const poll: Omit<PollDoc, "id"> = {
    title: input.title.trim(),
    description: input.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
    theme: input.theme,
    dates: cleanDates(input.dates),
    choicesTitle: input.choicesTitle.trim().slice(0, MAX_TITLE_LENGTH) || "Auswahl",
    choices: buildChoices(input.choices),
    open: true,
    showResults: true,
    finalDate: null,
    finalChoice: null,
    note: "",
    createdAt: now,
    updatedAt: now,
  };
  await polls().doc(slug).set(poll);

  revalidateTag(POLLS_TAG);
  revalidateTag(pollTag(slug));
  return slug;
}

/** Ändert Titel, Beschreibung, Termine und Optionen einer Umfrage. */
export async function updatePoll(slug: string, input: PollInput): Promise<void> {
  checkInput(input);
  const existing = await pollDoc(slug).get();
  if (!existing.exists) throw new Error("Diese Umfrage gibt es nicht (mehr).");

  const current = toPoll(existing.id, existing.data() as Partial<PollDoc>);
  const dates = cleanDates(input.dates);
  const choices = buildChoices(input.choices);

  await pollDoc(slug)
    .update({
      title: input.title.trim(),
      description: input.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
      theme: input.theme,
      dates,
      choicesTitle: input.choicesTitle.trim().slice(0, MAX_TITLE_LENGTH) || "Auswahl",
      choices,
      // Festlegungen zurücknehmen, wenn sie nicht mehr zur Auswahl stehen.
      finalDate: current.finalDate && dates.includes(current.finalDate) ? current.finalDate : null,
      finalChoice:
        current.finalChoice && choices.some((c) => c.id === current.finalChoice)
          ? current.finalChoice
          : null,
      updatedAt: Date.now(),
    });

  revalidateTag(POLLS_TAG);
  revalidateTag(pollTag(slug));
}

/** Schaltet Zustand und Festlegungen einer Umfrage. */
export async function updatePollSettings(
  slug: string,
  patch: {
    open: boolean;
    showResults: boolean;
    finalDate: string | null;
    finalChoice: string | null;
    note: string;
  },
): Promise<void> {
  const snap = await pollDoc(slug).get();
  if (!snap.exists) throw new Error("Diese Umfrage gibt es nicht (mehr).");
  const poll = toPoll(snap.id, snap.data() as Partial<PollDoc>);

  await pollDoc(slug)
    .update({
      open: patch.open,
      showResults: patch.showResults,
      // Nur übernehmen, was in dieser Umfrage überhaupt zur Wahl steht.
      finalDate:
        patch.finalDate && poll.dates.includes(patch.finalDate) ? patch.finalDate : null,
      finalChoice:
        patch.finalChoice && poll.choices.some((c) => c.id === patch.finalChoice)
          ? patch.finalChoice
          : null,
      note: patch.note.trim().slice(0, MAX_NOTE_LENGTH),
      updatedAt: Date.now(),
    });

  revalidateTag(POLLS_TAG);
  revalidateTag(pollTag(slug));
}

/** Löscht eine Umfrage samt allen Antworten. */
export async function deletePoll(slug: string): Promise<void> {
  const snap = await responses(slug).get();
  const batch = db().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(pollDoc(slug));
  await batch.commit();

  revalidateTag(POLLS_TAG);
  revalidateTag(pollTag(slug));
}

// --- Schreiben: Antworten ------------------------------------------------

export interface ResponseInput {
  name: string;
  /** Nur „yes"/„maybe" – „no" wird als fehlender Schlüssel gespeichert. */
  dates: Record<string, Exclude<Vote, "no">>;
  choices: string[];
  comment: string;
}

/**
 * Speichert eine Antwort. Der normalisierte Name ist die Dokument-ID: Wer
 * noch einmal mit demselben Namen abstimmt, aktualisiert seine Antwort.
 */
export async function saveResponse(
  slug: string,
  input: ResponseInput,
): Promise<{ updated: boolean }> {
  const snap = await pollDoc(slug).get();
  if (!snap.exists) throw new Error("Diese Umfrage gibt es nicht (mehr).");
  const poll = toPoll(snap.id, snap.data() as Partial<PollDoc>);
  if (!poll.open) throw new Error("Diese Umfrage ist geschlossen.");

  const name = input.name.trim().replace(/\s+/g, " ");
  const id = nameKey(name);
  if (!id) throw new Error("Bitte gib deinen Namen ein.");
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen haben.`);
  }

  // Nur bekannte Termine/Optionen übernehmen – das Formular ist öffentlich.
  const dates: Record<string, Vote> = {};
  for (const date of poll.dates) {
    const vote = input.dates[date];
    if (vote === "yes" || vote === "maybe") dates[date] = vote;
  }
  if (Object.keys(dates).length === 0) {
    throw new Error("Bitte wähle mindestens einen Termin aus.");
  }
  const choices = poll.choices
    .filter((c) => input.choices.includes(c.id))
    .map((c) => c.id);

  const ref = responses(slug).doc(id);
  const before = await ref.get();
  if (!before.exists) {
    const { count } = (await responses(slug).count().get()).data();
    if (count >= MAX_RESPONSES) {
      throw new Error("Diese Umfrage hat zu viele Einträge.");
    }
  }

  const now = Date.now();
  await ref.set({
    name,
    dates,
    choices,
    comment: input.comment.trim().slice(0, MAX_COMMENT_LENGTH),
    createdAt: before.exists
      ? ((before.data() as Partial<ResponseDoc>).createdAt ?? now)
      : now,
    updatedAt: now,
  });

  revalidateTag(pollTag(slug));
  revalidateTag(POLLS_TAG);
  return { updated: before.exists };
}

/** Entfernt eine Antwort (nur Organisatoren). */
export async function deleteResponse(slug: string, id: string): Promise<void> {
  await responses(slug).doc(id).delete();
  revalidateTag(pollTag(slug));
  revalidateTag(POLLS_TAG);
}

// --- Vorlage anlegen -----------------------------------------------------

/** Was beim Anlegen einer Vorlage passiert ist. */
export interface SeedResult {
  created: boolean;
  /** Übernommene Antworten aus der alten, fest verdrahteten Fassung. */
  migrated: number;
}

/**
 * Legt eine Umfrage aus einer Vorlage an – mehrfach aufrufbar: Eine bereits
 * vorhandene Umfrage bleibt unangetastet.
 *
 * Zusätzlich werden Antworten und Einstellungen der alten Weihnachtsessen-
 * Fassung übernommen (Sammlungen `dinnerResponses` / `dinnerSettings`), damit
 * niemand zweimal abstimmen muss.
 */
export async function seedTemplate(template: PollTemplate): Promise<SeedResult> {
  const ref = pollDoc(template.slug);
  const existing = await ref.get();
  let created = false;

  if (!existing.exists) {
    const now = Date.now();
    const poll: Omit<PollDoc, "id"> = {
      title: template.title,
      description: template.description,
      theme: template.theme,
      dates: cleanDates(template.dates),
      choicesTitle: template.choicesTitle,
      choices: template.choices,
      open: true,
      showResults: true,
      finalDate: null,
      finalChoice: null,
      note: "",
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(poll);
    created = true;
  }

  // Frühere Fassung übernehmen, falls es sie in diesem Projekt noch gibt.
  let migrated = 0;
  if (template.slug === "weihnachtsessen") {
    const oldSettings = await db().collection("dinnerSettings").doc("current").get();
    if (oldSettings.exists && created) {
      const old = oldSettings.data() as Record<string, unknown>;
      await ref.update({
        open: (old.open as boolean) ?? true,
        showResults: (old.showResults as boolean) ?? true,
        finalDate: (old.finalDate as string | null) ?? null,
        finalChoice: (old.finalRestaurant as string | null) ?? null,
        note: (old.note as string) ?? "",
        updatedAt: Date.now(),
      });
    }

    const oldResponses = await db().collection("dinnerResponses").get();
    for (const doc of oldResponses.docs) {
      const target = ref.collection(RESPONSES).doc(doc.id);
      if ((await target.get()).exists) continue;
      const d = doc.data() as Record<string, unknown>;
      await target.set({
        name: (d.name as string) ?? doc.id,
        dates: (d.dates as Record<string, Vote>) ?? {},
        choices: (d.restaurants as string[]) ?? [],
        comment: (d.comment as string) ?? "",
        createdAt: (d.createdAt as number) ?? Date.now(),
        updatedAt: (d.updatedAt as number) ?? Date.now(),
      });
      migrated += 1;
    }
  }

  revalidateTag(POLLS_TAG);
  revalidateTag(pollTag(template.slug));
  return { created, migrated };
}
