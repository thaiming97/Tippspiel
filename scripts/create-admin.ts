/**
 * Legt den ersten Admin-Benutzer an (oder macht einen bestehenden zum Admin).
 * Aufruf:  npm run create-admin
 *
 * Werte aus .env.local: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
 * Dieser Admin muss das Passwort beim ersten Login NICHT ändern.
 */
import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

function init() {
  if (getApps().length) return;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Admin";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL und ADMIN_PASSWORD in .env.local setzen.");
  }

  init();
  const db = getFirestore();

  const existing = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  const data = {
    email,
    name,
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin" as const,
    scope: "all" as const,
    mustChangePassword: false,
    createdAt: Date.now(),
  };

  if (!existing.empty) {
    await existing.docs[0].ref.set(data, { merge: true });
    console.log(`Admin „${email}" aktualisiert.`);
  } else {
    await db.collection("users").add(data);
    console.log(`Admin „${email}" angelegt.`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
