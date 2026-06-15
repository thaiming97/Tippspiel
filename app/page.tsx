import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatches, getStandings, getUserBets, isBettable } from "@/lib/data";
import { formatKickoff } from "@/lib/format";
import { GROUP_E_STAGE } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scope = user.scope ?? "group_e";
  const [allMatches, bets, standings] = await Promise.all([
    getMatches(),
    getUserBets(user.id),
    getStandings(scope),
  ]);

  const matches =
    scope === "group_e"
      ? allMatches.filter((m) => m.stage === GROUP_E_STAGE)
      : allMatches;
  const upcoming = matches.filter(isBettable).slice(0, 5);
  const leader = standings[0];
  const me = standings.find((s) => s.userId === user.id);
  const myRank = me ? standings.findIndex((s) => s.userId === user.id) + 1 : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hallo {user.name} 👋</h1>
        <p className="text-gray-500">Willkommen beim WM-Tippspiel 2026.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="text-sm text-gray-500">Aktuell führt</div>
          <div className="mt-1 text-xl font-semibold">
            {leader ? `${leader.name}` : "– noch niemand –"}
          </div>
          {leader && (
            <div className="text-sm text-gray-500">{leader.points} Punkte</div>
          )}
          <Link href="/leaderboard" className="mt-3 inline-block text-sm text-pitch hover:underline">
            Zur Live-Rangliste →
          </Link>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Dein Stand</div>
          <div className="mt-1 text-xl font-semibold">
            {me ? `${me.points} Punkte` : "0 Punkte"}
          </div>
          <div className="text-sm text-gray-500">
            {myRank ? `Platz ${myRank} von ${standings.length}` : "noch ungewertet"}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nächste Spiele</h2>
          <Link href="/matches" className="text-sm text-pitch hover:underline">
            Alle Spiele & Tipps →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">Aktuell keine offenen Spiele zum Tippen.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((m) => {
              const bet = bets.get(m.id);
              return (
                <li key={m.id} className="card flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">
                      {m.stage} · {formatKickoff(m.kickoff)}
                    </div>
                    <div className="font-medium">
                      {m.homeTeam} – {m.awayTeam}
                    </div>
                  </div>
                  <div className="text-sm">
                    {bet ? (
                      <span className="rounded bg-green-50 px-2 py-1 text-green-700">
                        Tipp: {bet.homeScore}:{bet.awayScore}
                      </span>
                    ) : (
                      <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
                        noch kein Tipp
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
