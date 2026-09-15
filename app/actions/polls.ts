"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  buildDates,
  cleanDates,
} from "@/lib/polls";
import {
  createPoll,
  deletePoll,
  deleteResponse,
  getPoll,
  saveResponse,
  updatePoll,
  updatePollSettings,
  type PollInput,
} from "@/lib/pollStore";
import type { PollTheme, Vote } from "@/lib/types";

/** Öffentliche Seite und Admin-Ansicht nach einer Änderung neu aufbauen. */
function revalidatePoll(slug: string): void {
  revalidatePath("/");
  revalidatePath(`/umfrage/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/umfragen/${slug}`);
}

// --- Öffentlich: abstimmen ----------------------------------------------

export type ResponseState =
  | { error?: string; ok?: string; savedName?: string }
  | undefined;

/**
 * Nimmt eine Antwort aus dem öffentlichen Formular an – ohne Anmeldung.
 * Geprüft wird serverseitig: Name, mindestens ein Termin, und dass nur
 * Termine/Optionen dieser Umfrage gespeichert werden.
 */
export async function submitResponseAction(
  _prev: ResponseState,
  formData: FormData,
): Promise<ResponseState> {
  const slug = String(formData.get("slug") ?? "");
  const poll = await getPoll(slug);
  if (!poll) return { error: "Diese Umfrage gibt es nicht (mehr)." };
  if (!poll.open) return { error: "Diese Umfrage ist geschlossen." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Bitte gib deinen Namen ein (mindestens 2 Zeichen)." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen haben.` };
  }

  const dates: Record<string, Exclude<Vote, "no">> = {};
  for (const date of poll.dates) {
    const vote = String(formData.get(`date_${date}`) ?? "no");
    if (vote === "yes" || vote === "maybe") dates[date] = vote;
  }

  const choices = formData.getAll("choice").map(String);
  const comment = String(formData.get("comment") ?? "").slice(0, MAX_COMMENT_LENGTH);

  try {
    const { updated } = await saveResponse(slug, { name, dates, choices, comment });
    revalidatePoll(slug);
    return {
      ok: updated
        ? "Deine Antwort wurde aktualisiert. Danke!"
        : "Gespeichert – danke fürs Mitmachen!",
      savedName: name,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Speichern fehlgeschlagen." };
  }
}

// --- Admin: Umfragen verwalten ------------------------------------------

/** Liest die Umfrage-Felder aus dem Formular (Anlegen und Bearbeiten). */
function readPollInput(formData: FormData): PollInput {
  // Termine: entweder aus dem Generator (von/bis/Wochentage) oder einzeln.
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const weekdays = formData.getAll("weekday").map((w) => Number(w));
  const generated = buildDates(from, to, weekdays);
  const manual = String(formData.get("dates") ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);

  const names = formData.getAll("choiceName").map(String);
  const hints = formData.getAll("choiceHint").map(String);

  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    theme: (String(formData.get("theme") ?? "neutral") === "weihnachten"
      ? "weihnachten"
      : "neutral") as PollTheme,
    dates: cleanDates([...generated, ...manual]),
    choicesTitle: String(formData.get("choicesTitle") ?? ""),
    choices: names.map((name, i) => ({ name, hint: hints[i] ?? "" })),
  };
}

export type PollFormState = { error?: string; ok?: string } | undefined;

/** Legt eine neue Umfrage an und springt danach in ihre Verwaltung. */
export async function createPollAction(
  _prev: PollFormState,
  formData: FormData,
): Promise<PollFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nicht autorisiert." };
  }

  let slug: string;
  try {
    slug = await createPoll(readPollInput(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Anlegen fehlgeschlagen." };
  }

  revalidatePoll(slug);
  redirect(`/admin/umfragen/${slug}`);
}

/** Speichert Titel, Beschreibung, Termine und Optionen einer Umfrage. */
export async function updatePollAction(
  _prev: PollFormState,
  formData: FormData,
): Promise<PollFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nicht autorisiert." };
  }

  const slug = String(formData.get("slug") ?? "");
  try {
    await updatePoll(slug, readPollInput(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Speichern fehlgeschlagen." };
  }

  revalidatePoll(slug);
  return { ok: "Umfrage gespeichert." };
}

/** Schaltet Zustand und Festlegungen einer Umfrage. */
export async function updateSettingsAction(
  _prev: PollFormState,
  formData: FormData,
): Promise<PollFormState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nicht autorisiert." };
  }

  const slug = String(formData.get("slug") ?? "");
  try {
    await updatePollSettings(slug, {
      open: formData.get("open") === "on",
      showResults: formData.get("showResults") === "on",
      finalDate: String(formData.get("finalDate") ?? "") || null,
      finalChoice: String(formData.get("finalChoice") ?? "") || null,
      note: String(formData.get("note") ?? ""),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Speichern fehlgeschlagen." };
  }

  revalidatePoll(slug);
  return { ok: "Einstellungen gespeichert." };
}

/** Löscht eine Umfrage samt Antworten. */
export async function deletePollAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;
  await deletePoll(slug);
  revalidatePoll(slug);
  redirect("/admin");
}

/** Löscht eine einzelne Antwort. */
export async function deleteResponseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!slug || !id) return;
  await deleteResponse(slug, id);
  revalidatePoll(slug);
}
