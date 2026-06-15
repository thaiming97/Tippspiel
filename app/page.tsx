import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatches, getStandingsBoth, getUserBets, isBettable } from "@/lib/data";
import { formatKickoff } from "@/lib/format";
import { teamFlag } from "@/lib/flags";
import { GROUP_E_STAGE } from "@/lib/types";
import type { StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Rang (1-basiert) eines Nutzers in einer Wertung, oder null. */
function rankOf(rows: StandingRow[], userId: string): number | null {
  const i = rows.findIndex((r) => r.userId === userId);
  return i === -1 ? null : i + 1;
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scope = user.scope ?? "group_e";
  const [allMatches, bets, standings] = await Promise.all([
    getMatches(),
    getUserBets(user.id),
    getStandingsBoth(),
  ]);

  const matches =
    scope === "group_e"
      ? allMatches.filter((m) => m.stage === GROUP_E_STAGE)
      : allMatches;
  const upcoming = matches.filter(isBettable).slice(0, 5);

  const leader = standings.group_e[0];
  const groupRow = standings.group_e.find((s) => s.userId === user.id);
  const groupRank = rankOf(standings.group_e, user.id);
  const allRank = rankOf(standings.all, user.id);
  const allRow = standings.all.find((s) => s.userId === user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hallo {user.name} 👋</h1>
        <p className="text-gray-500">Willkommen beim WM-Tippspiel 2026.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="text-sm text-gray-500">Aktuell führt (Gruppe E)</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <span className="text-2xl">🥇</span>
            {leader ? leader.name : "– noch niemand –"}
          </div>
          {leader && (
            <div className="text-sm text-gray-500">{leader.points} Punkte</div>
          )}
          <Link href="/leaderboard" className="mt-3 inline-block text-sm font-medium text-pitch hover:underline">
            Zur Live-Rangliste →
          </Link>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Dein Stand</div>
          {/* Rang in der Gruppe E */}
          <div className="mt-1">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Gruppe E
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold">
                {groupRow ? `${groupRow.points} Punkte` : "0 Punkte"}
              </span>
              <span className="text-sm text-gray-500">
                {groupRank
                  ? `· Platz ${groupRank} von ${standings.group_e.length}`
                  : "· noch ungewertet"}
              </span>
            </div>
          </div>

          {/* Bei „alle"-Tippern zusätzlich der Gesamtrang. */}
          {scope === "all" && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Gesamt (alle Spiele)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold">
                  {allRow ? `${allRow.points} Punkte` : "0 Punkte"}
                </span>
                <span className="text-sm text-gray-500">
                  {allRank
                    ? `· Platz ${allRank} von ${standings.all.length}`
                    : "· noch ungewertet"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nächste Spiele</h2>
          <Link href="/matches" className="text-sm font-medium text-pitch hover:underline">
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
                <li key={m.id} className="card flex items-center justify-between transition hover:shadow-card-hover">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400">
                      <span className="chip">{m.stage}</span>
                      <span className="ml-2">{formatKickoff(m.kickoff)}</span>
                    </div>
                    <div className="mt-1 font-medium">
                      {teamFlag(m.homeTeam)} {m.homeTeam}{" "}
                      <span className="text-gray-400">–</span>{" "}
                      {m.awayTeam} {teamFlag(m.awayTeam)}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm">
                    {bet ? (
                      <span className="rounded-lg bg-green-50 px-2 py-1 font-medium text-green-700">
                        Tipp: {bet.homeScore}:{bet.awayScore}
                      </span>
                    ) : (
                      <span className="rounded-lg bg-amber-50 px-2 py-1 font-medium text-amber-700">
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
