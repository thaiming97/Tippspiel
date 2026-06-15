import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Initialisiert das Firebase Admin SDK genau einmal (Singleton).
 * Alle Schreib-/Lesezugriffe auf Firestore laufen serverseitig über diesen
 * Client – der Browser spricht nie direkt mit Firestore.
 *
 * - Sind die Service-Account-Variablen gesetzt (lokal / Vercel), wird dieser
 *   Schlüssel verwendet.
 * - Sonst werden die Google-Standard-Credentials genutzt (z.B. auf Firebase
 *   App Hosting / Cloud Run läuft der Dienst automatisch mit einem
 *   Service-Account).
 */
function initAdmin(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Fallback: Application Default Credentials (managed Google-Umgebungen).
  return initializeApp({
    credential: applicationDefault(),
    projectId: projectId || process.env.GCLOUD_PROJECT,
  });
}

let _db: Firestore | null = null;

export function db(): Firestore {
  if (!_db) {
    _db = getFirestore(initAdmin());
  }
  return _db;
}

// Firestore-Sammlungen an einer Stelle gebündelt.
export const Collections = {
  users: "users",
  matches: "matches",
  bets: "bets",
  // Vorberechnete Ranglisten (1 Dokument statt der ganzen DB pro Aufruf).
  standings: "standings",
} as const;

/** Doc-ID des einzigen Ranglisten-Caches in der Collection "standings". */
export const STANDINGS_DOC = "current";
