import { getCurrentUser } from "@/lib/auth";
import { getMatches, getUserBets, isBettable } from "@/lib/data";
import { dayKey, formatDay, formatKickoff } from "@/lib/format";
import { Flag } from "@/components/Flag";
import { MatchBetForm } from "@/components/MatchBetForm";
import { GROUP_E_STAGE } from "@/lib/types";
import type { BetDoc, MatchDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [allMatches, bets] = await Promise.all([
    getMatches(),
    getUserBets(user.id),
  ]);

  // Wer nur Gruppe E tippt, sieht auch nur diese Spiele.
  const matches =
    (user.scope ?? "group_e") === "group_e"
      ? allMatches.filter((m) => m.stage === GROUP_E_STAGE)
      : allMatches;

  // Spiele nach Tag gruppieren.
  const groups = new Map<string, MatchDoc[]>();
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spiele & Tipps</h1>
        <span className="text-sm text-gray-500">
          Umfang:{" "}
          {(user.scope ?? "group_e") === "group_e" ? "nur Gruppe E" : "alle Spiele"}{" "}
          ·{" "}
          <a href="/settings" className="text-pitch hover:underline">
            ändern
          </a>
        </span>
      </div>
      {matches.length === 0 && (
        <p className="text-gray-500">
          Noch keine Spiele angelegt. Ein Admin kann Spiele anlegen oder den
          Sync starten.
        </p>
      )}
      {[...groups.entries()].map(([key, dayMatches]) => (
        <section key={key} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {formatDay(dayMatches[0].kickoff)}
          </h2>
          <div className="space-y-3">
            {dayMatches.map((m) => (
              <MatchRow key={m.id} match={m} bet={bets.get(m.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchRow({ match, bet }: { match: MatchDoc; bet?: BetDoc }) {
  const open = isBettable(match);
  const finished = match.status === "FINISHED";

  return (
    <div className="card flex flex-col gap-3 transition hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs text-gray-400">
          <span className="chip">{match.stage}</span>
          <span className="ml-2">{formatKickoff(match.kickoff)}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 font-medium">
          <Flag team={match.homeTeam} /> {match.homeTeam}
          <span className="text-gray-400">–</span>
          {match.awayTeam} <Flag team={match.awayTeam} />
        </div>
        {finished && (
          <div className="text-sm font-semibold text-pitch">
            Endstand: {match.homeScore} : {match.awayScore}
          </div>
        )}
      </div>

      <div className="shrink-0">
        {open ? (
          <MatchBetForm
            matchId={match.id}
            defaultHome={bet?.homeScore}
            defaultAway={bet?.awayScore}
            hasBet={bet !== undefined}
          />
        ) : (
          <div className="text-right text-sm">
            <div>
              Dein Tipp:{" "}
              {bet ? (
                <span className="font-medium">
                  {bet.homeScore} : {bet.awayScore}
                </span>
              ) : (
                <span className="text-gray-400">– kein Tipp –</span>
              )}
            </div>
            {finished && bet && (
              <div className="text-xs text-gray-500">
                {bet.points ?? 0} Punkte
              </div>
            )}
            {!finished && (
              <div className="text-xs text-gray-400">Tippabgabe beendet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
