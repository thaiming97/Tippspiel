/**
 * Legt Teilnehmer, Spiele (inkl. Ergebnisse) und alle Tipps aus dem
 * Excel-Tippblatt in Firestore an.   Aufruf:  npm run seed
 *
 * - Teilnehmer der Gruppe E (mit zufälligem Startpasswort, muss beim ersten
 *   Login geändert werden)
 * - Die 6 Gruppe-E-Spiele inkl. echter Ergebnisse der gespielten Partien
 * - Zusätzliche WM-Spiele ab 15.06. (für den Modus „alle Spiele")
 * - Alle abgegebenen Tipps + Punkteberechnung (Check24-Wertung 4/3/2)
 *
 * Idempotent: vorhandene Teilnehmer/Spiele werden nicht überschrieben
 * (Tipps werden aktualisiert).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
import { SEED_FIXTURES, fixtureId } from "../data/fixtures";
import {
  GROUP_E_MATCHES,
  GROUP_E_TIPS,
  PARTICIPANTS,
} from "../data/groupE";
import { calcPoints } from "../lib/points";
import { normalizeUsername } from "../lib/username";

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

// Einheitliches Start-Passwort für alle Teilnehmer (beim ersten Login zu ändern).
const START_PASSWORD = "Start123";

async function main() {
  init();
  const db = getFirestore();

  // 1) Teilnehmer anlegen ----------------------------------------------------
  const credentials: { name: string; email: string; password: string }[] = [];
  const userIdByName = new Map<string, string>();

  for (const p of PARTICIPANTS) {
    const existing = await db
      .collection("users")
      .where("email", "==", p.email)
      .limit(1)
      .get();

    if (!existing.empty) {
      userIdByName.set(p.name, existing.docs[0].id);
      console.log(`· Teilnehmer existiert: ${p.name} (${p.email})`);
      continue;
    }

    const pw = START_PASSWORD;
    const ref = db.collection("users").doc();
    await ref.set({
      username: normalizeUsername(p.name),
      email: p.email,
      name: p.name,
      passwordHash: await bcrypt.hash(pw, 10),
      role: "user",
      scope: p.scope,
      mustChangePassword: true,
      createdAt: Date.now(),
    });
    userIdByName.set(p.name, ref.id);
    credentials.push({ name: p.name, email: p.email, password: pw });
    console.log(`+ Teilnehmer angelegt: ${p.name}`);
  }

  // 2) Spiele anlegen --------------------------------------------------------
  const groupEIds: string[] = [];
  for (const m of GROUP_E_MATCHES) {
    const id = fixtureId(m);
    groupEIds.push(id);
    await db.collection("matches").doc(id).set(m, { merge: true });
  }
  for (const m of SEED_FIXTURES) {
    await db.collection("matches").doc(fixtureId(m)).set(m, { merge: true });
  }
  console.log(
    `\nSpiele: ${GROUP_E_MATCHES.length} (Gruppe E) + ${SEED_FIXTURES.length} weitere`,
  );

  // 3) Tipps + Punkte --------------------------------------------------------
  let bets = 0;
  const writes: Promise<unknown>[] = [];
  for (const [name, tips] of Object.entries(GROUP_E_TIPS)) {
    const userId = userIdByName.get(name);
    if (!userId) {
      console.warn(`! kein Nutzer für Tipp gefunden: ${name}`);
      continue;
    }
    tips.forEach((tip, idx) => {
      if (!tip) return;
      const match = GROUP_E_MATCHES[idx];
      const matchId = groupEIds[idx];
      const [home, away] = tip;
      let points: number | null = null;
      if (
        match.status === "FINISHED" &&
        match.homeScore !== null &&
        match.awayScore !== null
      ) {
        points = calcPoints(
          { homeScore: home, awayScore: away },
          { homeScore: match.homeScore, awayScore: match.awayScore },
        );
      }
      const betId = `${userId}_${matchId}`;
      writes.push(
        db.collection("bets").doc(betId).set({
          userId,
          matchId,
          homeScore: home,
          awayScore: away,
          points,
          updatedAt: Date.now(),
        }),
      );
      bets += 1;
    });
  }
  await Promise.all(writes);
  console.log(`Tipps importiert: ${bets}`);

  // 4) Zugangsdaten ausgeben -------------------------------------------------
  if (credentials.length) {
    console.log("\n===== STARTPASSWÖRTER (notieren & verteilen) =====");
    console.log("Name\tE-Mail\tStartpasswort");
    credentials.forEach((c) =>
      console.log(`${c.name}\t${c.email}\t${c.password}`),
    );
    console.log("==================================================");
  }

  console.log("\nFertig.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
