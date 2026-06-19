import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { db, Collections } from "./firebaseAdmin";
import type { ChatMessage } from "./types";

/**
 * Community-Chat. Wie der Rest der App läuft der Zugriff ausschließlich
 * serverseitig über das Admin SDK – der Browser spricht nie direkt mit
 * Firestore.
 *
 * Read-sparsam: Die letzten Nachrichten werden über den Next.js Data Cache
 * gepuffert (Tag CHAT_TAG). Das Polling (alle paar Sekunden, viele Nutzer)
 * trifft damit den Cache und kostet 0 Firestore-Reads, solange niemand etwas
 * Neues schreibt. Beim Senden wird der Tag gezielt entwertet, sodass der
 * nächste Poll genau einmal neu liest und den Cache auffrischt.
 */
export const CHAT_TAG = "chat";

/** Wie viele der jüngsten Nachrichten geladen/angezeigt werden. */
const MAX_MESSAGES = 200;

/** Maximale Länge einer Nachricht. */
export const MAX_MESSAGE_LENGTH = 1000;

const loadMessages = unstable_cache(
  async (): Promise<ChatMessage[]> => {
    const snap = await db()
      .collection(Collections.messages)
      .orderBy("createdAt", "desc")
      .limit(MAX_MESSAGES)
      .get();
    // Neueste zuerst aus der DB holen (limit greift auf die jüngsten), für die
    // Anzeige aber chronologisch (älteste oben) zurückgeben.
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) }))
      .reverse();
  },
  ["chat-messages"],
  { tags: [CHAT_TAG], revalidate: 3600 },
);

/** Die jüngsten Nachrichten, chronologisch (älteste zuerst). */
export async function getMessages(): Promise<ChatMessage[]> {
  return loadMessages();
}

/**
 * Speichert eine neue Nachricht und entwertet den Chat-Cache. Gibt die
 * gespeicherte Nachricht (inkl. ID) zurück.
 */
export async function postMessage(
  userId: string,
  name: string,
  text: string,
): Promise<ChatMessage> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Nachricht ist leer");
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Nachricht ist zu lang");
  }

  const data: Omit<ChatMessage, "id"> = {
    userId,
    name,
    text: trimmed,
    createdAt: Date.now(),
  };
  const ref = await db().collection(Collections.messages).add(data);
  revalidateTag(CHAT_TAG);
  return { id: ref.id, ...data };
}
