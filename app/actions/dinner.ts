"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  DINNER_DATES,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  RESTAURANTS,
  restaurantById,
} from "@/lib/dinner";
import {
  deleteDinnerResponse,
  getDinnerSettings,
  saveDinnerResponse,
  updateDinnerSettings,
} from "@/lib/dinnerStore";
import type { DinnerVote } from "@/lib/types";

/** Beide Seiten (öffentlich + Admin) nach einer Änderung neu aufbauen. */
function revalidateDinner(): void {
  revalidatePath("/weihnachtsessen");
  revalidatePath("/admin/weihnachtsessen");
}

export type DinnerFormState =
  | { error?: string; ok?: string; savedName?: string }
  | undefined;

/**
 * Nimmt eine Antwort aus dem öffentlichen Formular an – ohne Anmeldung.
 * Geprüft wird serverseitig: Name, mindestens ein Termin, und dass nur
 * bekannte Termine/Restaurants gespeichert werden.
 */
export async function submitDinnerAction(
  _prev: DinnerFormState,
  formData: FormData,
): Promise<DinnerFormState> {
  const settings = await getDinnerSettings();
  if (!settings.open) {
    return { error: "Die Umfrage ist geschlossen." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { error: "Bitte gib deinen Namen ein (mindestens 2 Zeichen)." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen haben.` };
  }

  const dates: Record<string, Exclude<DinnerVote, "no">> = {};
  for (const date of DINNER_DATES) {
    const vote = String(formData.get(`date_${date}`) ?? "no");
    if (vote === "yes" || vote === "maybe") dates[date] = vote;
  }

  const restaurants = formData
    .getAll("restaurant")
    .map(String)
    .filter((id) => restaurantById(id));

  const comment = String(formData.get("comment") ?? "").slice(
    0,
    MAX_COMMENT_LENGTH,
  );

  try {
    const { updated } = await saveDinnerResponse({
      name,
      dates,
      restaurants,
      comment,
    });
    revalidateDinner();
    return {
      ok: updated
        ? "Deine Antwort wurde aktualisiert. Danke!"
        : "Gespeichert – danke fürs Mitmachen!",
      savedName: name,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen.",
    };
  }
}

/** Löscht eine Antwort (nur Admin). */
export async function deleteDinnerResponseAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteDinnerResponse(id);
  revalidateDinner();
}

export type DinnerSettingsState = { ok?: string; error?: string } | undefined;

/** Speichert die Einstellungen der Umfrage (nur Admin). */
export async function updateDinnerSettingsAction(
  _prev: DinnerSettingsState,
  formData: FormData,
): Promise<DinnerSettingsState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nicht autorisiert." };
  }

  const finalDate = String(formData.get("finalDate") ?? "");
  const finalRestaurant = String(formData.get("finalRestaurant") ?? "");

  await updateDinnerSettings({
    open: formData.get("open") === "on",
    showResults: formData.get("showResults") === "on",
    finalDate: DINNER_DATES.includes(finalDate) ? finalDate : null,
    finalRestaurant: RESTAURANTS.some((r) => r.id === finalRestaurant)
      ? finalRestaurant
      : null,
    note: String(formData.get("note") ?? "").trim().slice(0, 300),
  });

  revalidateDinner();
  return { ok: "Einstellungen gespeichert." };
}
