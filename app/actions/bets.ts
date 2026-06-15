"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { placeBet, userBetsTag } from "@/lib/data";

export type BetState = { error?: string; ok?: string } | undefined;

export async function placeBetAction(
  _prev: BetState,
  formData: FormData,
): Promise<BetState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Nicht angemeldet." };

  const matchId = String(formData.get("matchId") ?? "");
  const home = Number(formData.get("homeScore"));
  const away = Number(formData.get("awayScore"));

  if (!matchId) return { error: "Spiel fehlt." };
  if (Number.isNaN(home) || Number.isNaN(away)) {
    return { error: "Bitte beide Ergebnisse eingeben." };
  }

  try {
    await placeBet(user.id, matchId, home, away);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tipp fehlgeschlagen." };
  }

  revalidateTag(userBetsTag(user.id));
  revalidatePath("/matches");
  revalidatePath("/");
  return { ok: "Gespeichert" };
}
