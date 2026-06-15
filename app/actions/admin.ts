"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createMatch,
  createUser,
  deleteMatch,
  deleteUser,
  generateStartPassword,
  resetUserPassword,
  setMatchResult,
} from "@/lib/admin";
import { syncFromInternet } from "@/lib/sync";

export type AdminState =
  | { error?: string; ok?: string; password?: string }
  | undefined;

export async function createUserAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const role = formData.get("role") === "admin" ? "admin" : "user";
    let startPassword = String(formData.get("startPassword") ?? "").trim();
    if (!email || !name) return { error: "Name und E-Mail sind Pflicht." };
    if (!startPassword) startPassword = generateStartPassword();

    await createUser({ email, name, startPassword, role });
    revalidatePath("/admin/users");
    return {
      ok: `Benutzer „${name}" angelegt.`,
      password: startPassword,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function resetPasswordAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    const startPassword = generateStartPassword();
    await resetUserPassword(userId, startPassword);
    revalidatePath("/admin/users");
    return { ok: "Passwort zurückgesetzt.", password: startPassword };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (userId) await deleteUser(userId);
  revalidatePath("/admin/users");
}

export async function createMatchAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const homeTeam = String(formData.get("homeTeam") ?? "");
    const awayTeam = String(formData.get("awayTeam") ?? "");
    const stage = String(formData.get("stage") ?? "WM 2026");
    const kickoff = String(formData.get("kickoff") ?? "");
    if (!homeTeam || !awayTeam || !kickoff) {
      return { error: "Teams und Anstoßzeit sind Pflicht." };
    }
    await createMatch({ homeTeam, awayTeam, stage, kickoff });
    revalidatePath("/admin/matches");
    revalidatePath("/matches");
    return { ok: "Spiel angelegt." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function setResultAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  try {
    await requireAdmin();
    const matchId = String(formData.get("matchId") ?? "");
    const home = Number(formData.get("homeScore"));
    const away = Number(formData.get("awayScore"));
    if (!matchId || Number.isNaN(home) || Number.isNaN(away)) {
      return { error: "Bitte gültiges Ergebnis eingeben." };
    }
    await setMatchResult(matchId, home, away);
    revalidatePath("/admin/matches");
    revalidatePath("/leaderboard");
    return { ok: "Ergebnis gespeichert & Punkte aktualisiert." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fehlgeschlagen." };
  }
}

export async function deleteMatchAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  if (matchId) await deleteMatch(matchId);
  revalidatePath("/admin/matches");
}

export async function syncAction(_prev: AdminState): Promise<AdminState> {
  try {
    await requireAdmin();
    const result = await syncFromInternet();
    revalidatePath("/admin/matches");
    revalidatePath("/leaderboard");
    if (result.fetched === 0) {
      return {
        error:
          "Keine Daten erhalten – ist FOOTBALL_DATA_API_TOKEN gesetzt? (Ergebnisse können manuell eingetragen werden.)",
      };
    }
    return {
      ok: `Sync ok: ${result.fetched} Spiele geladen, ${result.finished} beendet.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sync fehlgeschlagen." };
  }
}
