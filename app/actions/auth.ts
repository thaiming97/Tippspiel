"use server";

import { redirect } from "next/navigation";
import { db, Collections } from "@/lib/firebaseAdmin";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { normalizeUsername } from "@/lib/username";
import type { UserDoc } from "@/lib/types";

export type ActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = normalizeUsername(String(formData.get("name") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Bitte Name und Passwort eingeben." };
  }

  const snap = await db()
    .collection(Collections.users)
    .where("username", "==", username)
    .limit(1)
    .get();

  if (snap.empty) {
    return { error: "Name oder Passwort ist falsch." };
  }

  const doc = snap.docs[0];
  const user = { id: doc.id, ...(doc.data() as Omit<UserDoc, "id">) };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Name oder Passwort ist falsch." };
  }

  // Letzten Login festhalten (für die Admin-Übersicht).
  await doc.ref.update({ lastLoginAt: Date.now() });

  await createSession({
    sub: user.id,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });

  if (user.mustChangePassword) redirect("/change-password");
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  destroySession();
  redirect("/login");
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const scope = formData.get("scope") === "all" ? "all" : "group_e";

  if (next.length < 8) {
    return { error: "Das neue Passwort muss mindestens 8 Zeichen haben." };
  }
  if (next !== confirm) {
    return { error: "Die Passwörter stimmen nicht überein." };
  }

  const ok = await verifyPassword(current, user!.passwordHash);
  if (!ok) {
    return { error: "Das aktuelle Passwort ist falsch." };
  }
  if (current === next) {
    return { error: "Das neue Passwort muss sich vom alten unterscheiden." };
  }

  await db().collection(Collections.users).doc(user!.id).update({
    passwordHash: await hashPassword(next),
    mustChangePassword: false,
    scope,
  });

  // Session mit aktualisiertem Flag neu setzen.
  await createSession({
    sub: user!.id,
    name: user!.name,
    role: user!.role,
    mustChangePassword: false,
  });

  redirect("/");
}
