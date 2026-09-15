/**
 * Legt die Konten der Kollegen an bzw. setzt ihr Passwort auf `start123`.
 * Beim ersten Login muss jeder sein eigenes Passwort festlegen.
 *
 * Aufruf:  npm run seed:users
 *
 * Mehrfach aufrufbar. Bestehende Konten behalten ihre Rolle und ihre
 * E-Mail – nur das Passwort wird zurückgesetzt. Namen werden über den
 * normalisierten Login-Namen erkannt, es entstehen also keine Dubletten.
 *
 * ACHTUNG: Das betrifft auch dein eigenes Konto, wenn dein Name in der Liste
 * steht. Du meldest dich danach mit `start123` an und setzt ein neues.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
import { normalizeUsername } from "../lib/username";

/** Die Runde aus dem früheren Tippspiel. */
const NAMES = [
  "Peter",
  "Niklas",
  "Jens",
  "Christian",
  "Elena",
  "Feli",
  "Jürgen B.",
  "Reiner",
  "Olli",
  "Leon",
  "Alex",
  "Felix",
  "Karo",
  "Kurt",
];

const START_PASSWORD = "start123";

function init() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else {
    initializeApp({ credential: applicationDefault(), projectId });
  }
}

async function main() {
  init();
  const db = getFirestore();
  const users = db.collection("users");
  const passwordHash = await bcrypt.hash(START_PASSWORD, 10);

  for (const name of NAMES) {
    const username = normalizeUsername(name);
    const existing = await users.where("username", "==", username).limit(1).get();

    if (existing.empty) {
      await users.add({
        username,
        name,
        email: "",
        passwordHash,
        role: "user" as const,
        mustChangePassword: true,
        createdAt: Date.now(),
      });
      console.log(`+ ${name.padEnd(12)} neu angelegt`);
    } else {
      const doc = existing.docs[0];
      const role = (doc.data().role as string) ?? "user";
      await doc.ref.update({ passwordHash, mustChangePassword: true });
      console.log(`~ ${name.padEnd(12)} Passwort zurückgesetzt (Rolle: ${role})`);
    }
  }

  console.log(
    `\nFertig. ${NAMES.length} Konten, Passwort für alle: ${START_PASSWORD}` +
      `\nLogin mit dem Namen (nicht der E-Mail). Beim ersten Login legt jeder` +
      `\nsein eigenes Passwort fest.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
