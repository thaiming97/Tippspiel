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
import { createUser } from "@/lib/admin";
import type { UserDoc } from "@/lib/types";

/**
 * Nach dem Anmelden dorthin, wo man hin wollte. Nur seiteneigene Pfade
 * zulassen – sonst wäre das eine offene Weiterleitung nach außen.
 */
function safeTarget(value: unknown): string {
  const target = String(value ?? "");
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  if (target.startsWith("/login") || target.startsWith("/registrieren")) return "/";
  return target;
}

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

  const target = safeTarget(formData.get("weiter"));
  if (user.mustChangePassword) {
    redirect(`/change-password?weiter=${encodeURIComponent(target)}`);
  }
  redirect(target);
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
  });

  // Session mit aktualisiertem Flag neu setzen.
  await createSession({
    sub: user!.id,
    name: user!.name,
    role: user!.role,
    mustChangePassword: false,
  });

  redirect(safeTarget(formData.get("weiter")));
}

/**
 * Selbstregistrierung: Wer mitabstimmen will, legt sich hier ein Konto an
 * und setzt sein Passwort gleich selbst (also kein Passwortwechsel beim
 * ersten Login). Angelegt wird immer ein Teilnehmer-Konto, niemals ein
 * Organisator – Rollen vergibt nur ein Admin.
 */
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2) {
    return { error: "Bitte gib deinen Namen ein (mindestens 2 Zeichen)." };
  }
  if (name.length > 40) {
    return { error: "Der Name darf höchstens 40 Zeichen haben." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen haben." };
  }
  if (password !== confirm) {
    return { error: "Die Passwörter stimmen nicht überein." };
  }

  let id: string;
  try {
    ({ id } = await createUser({
      name,
      startPassword: password,
      role: "user",
      mustChangePassword: false,
    }));
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Anlegen fehlgeschlagen. Probiere es nochmal.",
    };
  }

  await createSession({
    sub: id,
    name,
    role: "user",
    mustChangePassword: false,
  });

  redirect(safeTarget(formData.get("weiter")));
}
