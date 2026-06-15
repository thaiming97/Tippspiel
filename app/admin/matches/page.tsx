import { getMatches } from "@/lib/data";
import { deleteMatchAction } from "@/app/actions/admin";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";
import { SetResultForm } from "@/components/admin/SetResultForm";
import { SyncButton } from "@/components/admin/SyncButton";
import { formatKickoff } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const matches = await getMatches();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Spiele & Ergebnisse</h1>

      <div className="card space-y-2">
        <h3 className="font-semibold">Automatischer Ergebnis-Sync</h3>
        <p className="text-sm text-gray-500">
          Holt Spielplan & aktuelle Ergebnisse aus dem Internet und berechnet
          die Punkte neu.
        </p>
        <SyncButton />
      </div>

      <CreateMatchForm />

      <div className="space-y-2">
        <h3 className="font-semibold">Alle Spiele ({matches.length})</h3>
        {matches.map((m) => (
          <div
            key={m.id}
            className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-xs text-gray-400">
                {m.stage} · {formatKickoff(m.kickoff)} · {m.status}
              </div>
              <div className="font-medium">
                {m.homeTeam} – {m.awayTeam}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SetResultForm
                matchId={m.id}
                defaultHome={m.homeScore}
                defaultAway={m.awayScore}
              />
              <form action={deleteMatchAction}>
                <input type="hidden" name="matchId" value={m.id} />
                <button className="btn-ghost py-1 text-xs text-red-600">
                  Löschen
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
