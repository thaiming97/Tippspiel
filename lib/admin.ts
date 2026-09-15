import "server-only";
import { db, Collections } from "./firebaseAdmin";
import { hashPassword } from "./auth";
import { normalizeUsername } from "./username";
import type { Role, UserDoc } from "./types";

/**
 * Legt einen Organisator mit Startpasswort an. Beim ersten Login muss dieses
 * geändert werden (mustChangePassword = true).
 */
export async function createUser(input: {
  name: string;
  startPassword: string;
  email?: string;
  role?: Role;
  /** false, wenn der Nutzer sein Passwort selbst gesetzt hat. */
  mustChangePassword?: boolean;
}): Promise<{ id: string }> {
  const name = input.name.trim();
  const username = normalizeUsername(name);
  if (!username) throw new Error("Name ist Pflicht.");

  const existing = await db()
    .collection(Collections.users)
    .where("username", "==", username)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error("Diesen Namen gibt es schon. Wähle einen anderen.");
  }

  const ref = db().collection(Collections.users).doc();
  const user: Omit<UserDoc, "id"> = {
    username,
    name,
    email: input.email?.trim().toLowerCase() || "",
    passwordHash: await hashPassword(input.startPassword),
    role: input.role ?? "user",
    mustChangePassword: input.mustChangePassword ?? true,
    createdAt: Date.now(),
  };
  await ref.set(user);
  return { id: ref.id };
}

export async function listUsers(): Promise<UserDoc[]> {
  const snap = await db().collection(Collections.users).orderBy("name").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserDoc, "id">) }));
}

export async function deleteUser(userId: string): Promise<void> {
  await db().collection(Collections.users).doc(userId).delete();
}

/** Setzt das Passwort eines Nutzers zurück (neues Startpasswort). */
export async function resetUserPassword(
  userId: string,
  startPassword: string,
): Promise<void> {
  await db().collection(Collections.users).doc(userId).update({
    passwordHash: await hashPassword(startPassword),
    mustChangePassword: true,
  });
}
