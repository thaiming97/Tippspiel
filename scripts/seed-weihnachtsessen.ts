/**
 * Legt die Weihnachtsessen-Umfrage an (Do + Fr vom 12.11. bis 18.12.) und
 * übernimmt Antworten aus der alten, fest verdrahteten Fassung.
 *
 * Aufruf:  npm run seed:weihnachtsessen
 *
 * Mehrfach aufrufbar: Eine bereits vorhandene Umfrage wird nicht überschrieben,
 * nur fehlende Antworten werden nachgetragen.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { buildDates, slugify } from "../lib/polls";

const SLUG = "weihnachtsessen";

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
  const ref = db.collection("polls").doc(SLUG);

  const choices = [
    { name: "Krone", hint: "Unsleben" },
    { name: "Braunsmühle", hint: "Bischofsheim" },
    { name: "Brückenschenke", hint: "Wülfershausen" },
  ].map((c) => ({ id: slugify(c.name), name: c.name, hint: c.hint }));

  // Jeden Donnerstag (4) und Freitag (5) im Zeitraum.
  const dates = buildDates("2026-11-12", "2026-12-18", [4, 5]);

  const existing = await ref.get();
  if (existing.exists) {
    console.log(`Umfrage „${SLUG}" gibt es schon – bleibt unverändert.`);
  } else {
    const now = Date.now();
    await ref.set({
      title: "Weihnachtsessen der Abteilung",
      description:
        "Wir suchen Termin und Restaurant. Trag einfach ein, wann du kannst – Mehrfachauswahl ausdrücklich erwünscht.",
      theme: "weihnachten",
      dates,
      choicesTitle: "Wo soll's hingehen?",
      choices,
      open: true,
      showResults: true,
      finalDate: null,
      finalChoice: null,
      note: "",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Umfrage „${SLUG}" angelegt (${dates.length} Termine).`);
  }

  // Alte Einstellungen übernehmen, falls vorhanden.
  const oldSettings = await db.collection("dinnerSettings").doc("current").get();
  if (oldSettings.exists) {
    const s = oldSettings.data() as Record<string, unknown>;
    await ref.update({
      open: s.open ?? true,
      showResults: s.showResults ?? true,
      finalDate: (s.finalDate as string | null) ?? null,
      finalChoice: (s.finalRestaurant as string | null) ?? null,
      note: (s.note as string) ?? "",
      updatedAt: Date.now(),
    });
    console.log("Alte Einstellungen übernommen.");
  }

  // Alte Antworten übernehmen (Feld „restaurants" heißt jetzt „choices").
  const old = await db.collection("dinnerResponses").get();
  if (old.empty) {
    console.log("Keine alten Antworten gefunden.");
  } else {
    let copied = 0;
    for (const doc of old.docs) {
      const target = ref.collection("responses").doc(doc.id);
      if ((await target.get()).exists) continue;
      const d = doc.data() as Record<string, unknown>;
      await target.set({
        name: d.name ?? doc.id,
        dates: d.dates ?? {},
        choices: d.restaurants ?? [],
        comment: d.comment ?? "",
        createdAt: d.createdAt ?? Date.now(),
        updatedAt: d.updatedAt ?? Date.now(),
      });
      copied += 1;
    }
    console.log(`${copied} alte Antwort(en) übernommen.`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
