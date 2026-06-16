"use client";

import { useMemo, useState } from "react";
import { dayKey, formatDay, formatKickoff } from "@/lib/format";
import { Flag } from "@/components/Flag";
import { MatchBetForm } from "@/components/MatchBetForm";
import type { BetDoc, MatchDoc } from "@/lib/types";

/**
 * Rendert den Spielplan und blendet vergangene Spiele standardmäßig aus, damit
 * man nicht ständig an den schon gespielten Partien vorbeiscrollen muss. Über
 * die Checkbox oben lassen sie sich bei Bedarf wieder einblenden.
 *
 * Die Einteilung „vergangen" richtet sich nach dem Anstoßzeitpunkt; `now` kommt
 * vom Server, damit Server- und Client-Render identisch sind (keine Hydration-
 * Sprünge nahe am Anstoß).
 */
export function MatchesList({
  matches,
  bets,
  now,
}: {
  matches: MatchDoc[];
  bets: Record<string, BetDoc>;
  now: number;
}) {
  const [showPast, setShowPast] = useState(false);

  // Spiele nach Tag gruppieren und je Tag in vergangen/kommend trennen.
  const groups = useMemo(() => {
    const byDay = new Map<string, MatchDoc[]>();
    for (const m of matches) {
      const key = dayKey(m.kickoff);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(m);
    }
    return [...byDay.entries()].map(([key, dayMatches]) => {
      const past = dayMatches.filter(
        (m) => new Date(m.kickoff).getTime() <= now,
      );
      const upcoming = dayMatches.filter(
        (m) => new Date(m.kickoff).getTime() > now,
      );
      return { key, dayMatches, past, upcoming };
    });
  }, [matches, now]);

  const pastCount = groups.reduce((sum, g) => sum + g.past.length, 0);

  return (
    <div className="space-y-6">
      {pastCount > 0 && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-pitch focus:ring-pitch"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
          />
          Vergangene Spiele anzeigen ({pastCount})
        </label>
      )}

      {groups.map(({ key, dayMatches, past, upcoming }) => {
        const visible = showPast ? dayMatches : upcoming;
        if (visible.length === 0) return null;
        return (
          <section key={key} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {formatDay(dayMatches[0].kickoff)}
            </h2>
            <div className="space-y-3">
              {visible.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  bet={bets[m.id]}
                  now={now}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MatchRow({
  match,
  bet,
  now,
}: {
  match: MatchDoc;
  bet?: BetDoc;
  now: number;
}) {
  const open = new Date(match.kickoff).getTime() > now;
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
