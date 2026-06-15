import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { syncFromInternet } from "@/lib/sync";
import { MATCHES_TAG, BETS_TAG } from "@/lib/data";

export const dynamic = "force-dynamic";
// Auf Node-Runtime erzwingen (firebase-admin läuft nicht im Edge-Runtime).
export const runtime = "nodejs";

/**
 * Automatischer Ergebnis-Sync. Wird von einem Scheduler (z.B. Vercel Cron,
 * GitHub Action, Cloud Scheduler) regelmäßig aufgerufen.
 *
 * Schutz per Geheimnis:
 *   Authorization: Bearer <CRON_SECRET>   oder   ?secret=<CRON_SECRET>
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const provided =
    auth?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("secret") ??
    "";

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const result = await syncFromInternet();
    // Spielplan-Cache nur entwerten, wenn sich wirklich etwas geändert hat.
    if (result.updated > 0 || result.created > 0) {
      revalidateTag(MATCHES_TAG);
    }
    // Bei neuen Ergebnissen wurden Punkte neu berechnet -> Tipp-Cache leeren.
    if (result.recomputed) revalidateTag(BETS_TAG);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
