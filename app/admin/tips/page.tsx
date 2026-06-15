import Link from "next/link";
import { listUsers } from "@/lib/admin";
import { getBetsForMatch, getMatches } from "@/lib/data";
import { adminDeleteTipAction } from "@/app/actions/admin";
import { AdminTipForm } from "@/components/admin/AdminTipForm";
import { formatKickoff } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: { match?: string };
}) {
  const matches = await getMatches();
  const selectedId = searchParams.match ?? matches[0]?.id;
  const selected = matches.find((m) => m.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tipps bearbeiten (Admin)</h1>
      <p className="text-sm text-gray-500">
        Hier können Tipps der Spieler auch nach Anstoß korrigiert werden. Die
        Punkte werden danach automatisch neu berechnet.
      </p>

      <div className="flex flex-wrap gap-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/admin/tips?match=${m.id}`}
            className={`rounded-md border px-2 py-1 text-xs ${
              m.id === selectedId
                ? "border-pitch bg-pitch text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {m.homeTeam} – {m.awayTeam}
          </Link>
        ))}
      </div>

      {selected ? (
        <MatchTips matchId={selected.id} />
      ) : (
        <p className="text-gray-500">Keine Spiele vorhanden.</p>
      )}
    </div>
  );
}

async function MatchTips({ matchId }: { matchId: string }) {
  const [users, bets, matches] = await Promise.all([
    listUsers(),
    getBetsForMatch(matchId),
    getMatches(),
  ]);
  const match = matches.find((m) => m.id === matchId)!;

  return (
    <div className="card space-y-3">
      <div>
        <div className="text-xs text-gray-400">
          {match.stage} · {formatKickoff(match.kickoff)} · {match.status}
        </div>
        <div className="font-semibold">
          {match.homeTeam} – {match.awayTeam}
          {match.status === "FINISHED" && (
            <span className="ml-2 text-pitch">
              ({match.homeScore}:{match.awayScore})
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {users.map((u) => {
          const bet = bets.get(u.id);
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">{u.name}</span>
                {bet?.points != null && (
                  <span className="ml-2 text-xs text-gray-500">
                    {bet.points} Pkt
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AdminTipForm
                  userId={u.id}
                  matchId={matchId}
                  defaultHome={bet?.homeScore}
                  defaultAway={bet?.awayScore}
                />
                {bet && (
                  <form action={adminDeleteTipAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="matchId" value={matchId} />
                    <button className="btn-ghost py-1 text-xs text-red-600">
                      ×
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
