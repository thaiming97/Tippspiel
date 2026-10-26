"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createUser, deleteUser, resetUserPassword } from "@/lib/admin";
import { START_PASSWORD } from "@/lib/username";
import {
  createGroup,
  deleteGroup,
  removeUserFromGroups,
  updateGroup,
} from "@/lib/groupStore";

export type AdminState =
  | { error?: string; ok?: string; password?: string }
  | undefined;

export async function createUserAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const role = formData.get("role") === "admin" ? "admin" : "user";
    let startPassword = String(formData.get("startPassword") ?? "").trim();
    if (!name.trim()) return { error: "Name ist Pflicht." };
    if (!startPassword) startPassword = START_PASSWORD;

    await createUser({ email, name, startPassword, role });
    revalidatePath("/admin/users");
    return {
      ok: `Benutzer „${name}" angelegt.`,
      password: startPassword,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function resetPasswordAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    // Vorgabe „start123": vorhersagbar für die Weitergabe, muss beim
    // nächsten Login geändert werden. Ein eigenes Passwort ist möglich.
    const startPassword = String(formData.get("startPassword") ?? "").trim() || START_PASSWORD;
    await resetUserPassword(userId, startPassword);
    revalidatePath("/admin/users");
    return { ok: "Passwort zurückgesetzt.", password: startPassword };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (userId) {
    await deleteUser(userId);
    await removeUserFromGroups(userId);
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/gruppen");
}

// --- Gruppen: wer sieht welche Umfrage ----------------------------------

/** Nach einer Gruppenänderung alles neu aufbauen, was Sichtbarkeit zeigt. */
function revalidateGroups(): void {
  revalidatePath("/", "layout");
}

export type GroupState = { error?: string; ok?: string } | undefined;

export async function createGroupAction(
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "");
    await createGroup(name, formData.getAll("memberId").map(String));
    revalidateGroups();
    return { ok: `Gruppe „${name.trim()}" angelegt.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function updateGroupAction(
  _prev: GroupState,
  formData: FormData,
): Promise<GroupState> {
  try {
    await requireAdmin();
    await updateGroup(String(formData.get("groupId") ?? ""), {
      name: String(formData.get("name") ?? ""),
      memberIds: formData.getAll("memberId").map(String),
    });
    revalidateGroups();
    return { ok: "Gespeichert." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteGroup(String(formData.get("groupId") ?? ""));
  revalidateGroups();
}
