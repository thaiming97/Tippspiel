"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db, Collections } from "@/lib/firebaseAdmin";
import { refreshStandings } from "@/lib/data";

export type SettingsState = { ok?: string; error?: string } | undefined;

export async function updateScopeAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Nicht angemeldet." };

  const scope = formData.get("scope") === "all" ? "all" : "group_e";
  await db().collection(Collections.users).doc(user.id).update({ scope });
  // Umfang ändert, in welcher Wertung der Nutzer erscheint -> Cache neu bauen.
  await refreshStandings();

  revalidatePath("/settings");
  revalidatePath("/matches");
  revalidatePath("/");
  return { ok: "Gespeichert." };
}
