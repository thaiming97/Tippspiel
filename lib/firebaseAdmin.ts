import {
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
 */
function initAdmin(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin nicht konfiguriert: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL und FIREBASE_PRIVATE_KEY setzen (.env.local).",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
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
} as const;
