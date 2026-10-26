import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { db, Collections } from "./firebaseAdmin";
import { POLLS_TAG } from "./pollStore";
import type { GroupDoc, PollDoc, UserDoc } from "./types";

/**
 * Gruppen bestimmen, wer welche Umfrage sieht. Sie werden bei jedem
 * Seitenaufruf gebraucht und liegen deshalb wie die Umfragen im Data Cache.
 */
export const GROUPS_TAG = "groups";

export const MAX_GROUP_NAME_LENGTH = 40;
export const MAX_GROUPS = 50;

function groups() {
  return db().collection(Collections.groups);
}

/**
 * Gruppen- und Benutzer-IDs (Firestore-Auto-IDs) kommen aus Formularen –
 * Form prüfen, bevor sie als Dokument-ID verwendet werden.
 */
function isDocId(value: string): boolean {
  return /^[A-Za-z0-9]{1,40}$/.test(value);
}

function toGroup(id: string, data: Partial<GroupDoc>): GroupDoc {
  return {
    id,
    name: data.name ?? id,
    memberIds: data.memberIds ?? [],
    createdAt: data.createdAt ?? 0,
  };
}

/** Alle Gruppen, alphabetisch. */
export async function listGroups(): Promise<GroupDoc[]> {
  return unstable_cache(
    async () => {
      const snap = await groups().orderBy("name").get();
      return snap.docs.map((d) => toGroup(d.id, d.data() as Partial<GroupDoc>));
    },
    ["group-list"],
    { tags: [GROUPS_TAG], revalidate: 3600 },
  )();
}

function cleanName(name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) throw new Error("Bitte gib der Gruppe einen Namen.");
  if (clean.length > MAX_GROUP_NAME_LENGTH) {
    throw new Error(`Der Name darf höchstens ${MAX_GROUP_NAME_LENGTH} Zeichen haben.`);
  }
  return clean;
}

/** Nur Konten übernehmen, die es wirklich gibt. */
async function existingUserIds(ids: string[]): Promise<string[]> {
  const wanted = Array.from(new Set(ids)).filter(isDocId);
  if (wanted.length === 0) return [];
  const refs = wanted.map((id) => db().collection(Collections.users).doc(id));
  const snaps = await db().getAll(...refs);
  return snaps.filter((s) => s.exists).map((s) => s.id);
}

async function checkUniqueName(name: string, exceptId?: string): Promise<void> {
  const all = await groups().get();
  const key = name.toLowerCase();
  const clash = all.docs.some(
    (d) => d.id !== exceptId && String(d.get("name") ?? "").toLowerCase() === key,
  );
  if (clash) throw new Error("Eine Gruppe mit diesem Namen gibt es schon.");
  if (!exceptId && all.size >= MAX_GROUPS) {
    throw new Error(`Mehr als ${MAX_GROUPS} Gruppen sind zu viel.`);
  }
}

/** Legt eine Gruppe an und gibt ihre ID zurück. */
export async function createGroup(name: string, memberIds: string[]): Promise<string> {
  const clean = cleanName(name);
  await checkUniqueName(clean);
  const ref = groups().doc();
  await ref.set({
    name: clean,
    memberIds: await existingUserIds(memberIds),
    createdAt: Date.now(),
  });
  revalidateTag(GROUPS_TAG);
  return ref.id;
}

/** Ändert Name und Mitglieder einer Gruppe. */
export async function updateGroup(
  id: string,
  input: { name: string; memberIds: string[] },
): Promise<void> {
  if (!isDocId(id)) throw new Error("Diese Gruppe gibt es nicht (mehr).");
  const ref = groups().doc(id);
  if (!(await ref.get()).exists) throw new Error("Diese Gruppe gibt es nicht (mehr).");
  const clean = cleanName(input.name);
  await checkUniqueName(clean, id);
  await ref.update({ name: clean, memberIds: await existingUserIds(input.memberIds) });
  revalidateTag(GROUPS_TAG);
}

/**
 * Löscht eine Gruppe. Umfragen behalten den Verweis: Eine Umfrage, die nur
 * für diese Gruppe sichtbar war, sehen danach nur noch die Organisatoren –
 * sie wird nicht stillschweigend für alle geöffnet.
 */
export async function deleteGroup(id: string): Promise<void> {
  if (!isDocId(id)) return;
  await groups().doc(id).delete();
  revalidateTag(GROUPS_TAG);
  revalidateTag(POLLS_TAG);
}

/** Nimmt ein gelöschtes Konto aus allen Gruppen. */
export async function removeUserFromGroups(userId: string): Promise<void> {
  const snap = await groups().where("memberIds", "array-contains", userId).get();
  if (snap.empty) return;
  const batch = db().batch();
  snap.docs.forEach((d) =>
    batch.update(d.ref, { memberIds: FieldValue.arrayRemove(userId) }),
  );
  await batch.commit();
  revalidateTag(GROUPS_TAG);
}

/** Behält nur IDs von Gruppen, die es gibt – für Formulareingaben. */
export async function knownGroupIds(ids: string[]): Promise<string[]> {
  const known = new Set((await listGroups()).map((g) => g.id));
  return Array.from(new Set(ids)).filter((id) => known.has(id));
}

/**
 * Darf dieses Konto die Umfrage sehen (und darin abstimmen)? Organisatoren
 * immer; sonst bei „alle" oder als Mitglied einer der freigegebenen Gruppen.
 */
export function canSeePoll(
  poll: PollDoc,
  user: Pick<UserDoc, "id" | "role"> | null,
  allGroups: GroupDoc[],
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (poll.audience === "all") return true;
  return allGroups.some(
    (g) => poll.groupIds.includes(g.id) && g.memberIds.includes(user.id),
  );
}
