import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db, Collections } from "./firebaseAdmin";
import type { Role, UserDoc } from "./types";

const COOKIE_NAME = "wm_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET ist nicht gesetzt (.env.local).");
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string; // userId
  name: string;
  role: Role;
  mustChangePassword: boolean;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE_NAME);
}

/** Liest die Session aus dem Cookie (nur Signaturprüfung, kein DB-Zugriff). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      role: payload.role as Role,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

/** Lädt den aktuellen Nutzer frisch aus Firestore (autoritative Quelle). */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const session = await getSession();
  if (!session) return null;
  const snap = await db().collection(Collections.users).doc(session.sub).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<UserDoc, "id">) };
}

/** Wirft, wenn kein Admin angemeldet ist – für API-Routen. */
export async function requireAdmin(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Nicht autorisiert");
  }
  return user;
}
