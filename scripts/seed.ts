/**
 * Legt die Start-Spiele (WM 2026 ab 15.06.) in Firestore an.
 * Aufruf:  npm run seed
 *
 * Liest die Firebase-Zugangsdaten aus .env.local.
 */
import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_FIXTURES, fixtureId } from "../data/fixtures";

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
  init();
  const db = getFirestore();
  let created = 0;

  for (const m of SEED_FIXTURES) {
    const id = fixtureId(m);
    const ref = db.collection("matches").doc(id);
    const exists = await ref.get();
    if (exists.exists) {
      console.log(`· überspringe (existiert): ${m.homeTeam} – ${m.awayTeam}`);
      continue;
    }
    await ref.set(m);
    created += 1;
    console.log(`+ angelegt: ${m.homeTeam} – ${m.awayTeam}`);
  }

  console.log(`\nFertig. ${created} Spiele neu angelegt.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
