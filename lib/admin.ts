import "server-only";
import { randomBytes } from "crypto";
import { db, Collections } from "./firebaseAdmin";
import { hashPassword } from "./auth";
import { recomputePoints } from "./data";
import type { MatchDoc, Role, Scope, UserDoc } from "./types";

/** Erzeugt ein gut lesbares Startpasswort. */
export function generateStartPassword(): string {
  return randomBytes(6).toString("base64url");
}

/**
 * Legt einen Benutzer mit Startpasswort an. Beim ersten Login muss dieser
 * geändert werden (mustChangePassword = true).
 */
export async function createUser(input: {
  email: string;
  name: string;
  startPassword: string;
  role?: Role;
  scope?: Scope;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await db()
    .collection(Collections.users)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error("Es existiert bereits ein Benutzer mit dieser E-Mail.");
  }

  const ref = db().collection(Collections.users).doc();
  const user: Omit<UserDoc, "id"> = {
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.startPassword),
    role: input.role ?? "user",
    scope: input.scope ?? "group_e",
    mustChangePassword: true,
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
  // Tipps des Nutzers ebenfalls entfernen.
  const bets = await db()
    .collection(Collections.bets)
    .where("userId", "==", userId)
    .get();
  const batch = db().batch();
  bets.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
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

/** Legt ein Spiel manuell an. */
export async function createMatch(input: {
  homeTeam: string;
  awayTeam: string;
  stage: string;
  kickoff: string;
}): Promise<void> {
  const ref = db().collection(Collections.matches).doc();
  const match: Omit<MatchDoc, "id"> = {
    externalId: null,
    homeTeam: input.homeTeam.trim(),
    awayTeam: input.awayTeam.trim(),
    stage: input.stage.trim(),
    kickoff: new Date(input.kickoff).toISOString(),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
  };
  await ref.set(match);
}

/** Trägt ein Endergebnis manuell ein und wertet neu aus. */
export async function setMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  await db().collection(Collections.matches).doc(matchId).update({
    homeScore,
    awayScore,
    status: "FINISHED",
  });
  await recomputePoints();
}

export async function deleteMatch(matchId: string): Promise<void> {
  await db().collection(Collections.matches).doc(matchId).delete();
}

/**
 * Setzt/ändert den Tipp eines Spielers – auch nach Anstoß (Admin-Korrektur).
 * Punkte werden anschließend neu berechnet.
 */
export async function adminSetBet(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    throw new Error("Ungültiges Ergebnis");
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    throw new Error("Ungültiges Ergebnis");
  }
  const betId = `${userId}_${matchId}`;
  await db().collection(Collections.bets).doc(betId).set(
    {
      userId,
      matchId,
      homeScore,
      awayScore,
      points: null,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
  await recomputePoints();
}

/** Entfernt den Tipp eines Spielers zu einem Spiel. */
export async function adminDeleteBet(
  userId: string,
  matchId: string,
): Promise<void> {
  await db().collection(Collections.bets).doc(`${userId}_${matchId}`).delete();
  await recomputePoints();
}
