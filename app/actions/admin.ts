"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createUser,
  deleteUser,
  generateStartPassword,
  resetUserPassword,
} from "@/lib/admin";

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
    const role = formData.get("role") === "user" ? "user" : "admin";
    let startPassword = String(formData.get("startPassword") ?? "").trim();
    if (!name.trim()) return { error: "Name ist Pflicht." };
    if (!startPassword) startPassword = "Start123";

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
    const startPassword = generateStartPassword();
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
  }
  revalidatePath("/admin/users");
}
