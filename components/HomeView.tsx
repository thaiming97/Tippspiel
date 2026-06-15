import Link from "next/link";
import { Flag } from "@/components/Flag";
import { LeaderCelebration } from "@/components/LeaderCelebration";
import { formatKickoff } from "@/lib/format";
import type { MatchDoc, Scope } from "@/lib/types";

type BetLike = { homeScore: number; awayScore: number };

interface HomeViewProps {
  userName: string;
  scope: Scope;
  leaderName: string | null;
  leaderPoints: number | null;
  group: { points: number; rank: number | null; total: number };
  all?: { points: number; rank: number | null; total: number } | null;
  upcoming: MatchDoc[];
  bets: Record<string, BetLike>;
  matchesHref?: string;
  leaderboardHref?: string;
}

/** Geteilte Hauptseiten-Ansicht (echte Startseite + Design-Demo). */
export function HomeView({
  userName,
  scope,
  leaderName,
  leaderPoints,
  group,
  all,
  upcoming,
  bets,
  matchesHref = "/matches",
  leaderboardHref = "/leaderboard",
}: HomeViewProps) {
  return (
    <div className="space-y-7">
      <div className="animate-rise">
        <div className="eyebrow">WM-Tippspiel 2026</div>
        <h1 className="mt-1.5 text-4xl font-extrabold tracking-tight">
          Hallo {userName} <span className="inline-block">👋</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Spitzenreiter */}
        <div className="card relative overflow-hidden border-gold/30 bg-gradient-to-br from-gold/[0.12] via-white to-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />
          <div className="eyebrow !text-gold-dark">Aktuell führt · Gruppe E</div>
          <div className="mt-2 flex items-center gap-2.5">
            <LeaderCelebration leaderName={leaderName ?? ""} />
            <span className="font-display text-2xl font-extrabold tracking-tight">
              {leaderName ?? "– noch niemand –"}
            </span>
          </div>
          {leaderPoints !== null && (
            <div className="mt-0.5 text-sm font-medium text-ink-soft">
              {leaderPoints} Punkte
            </div>
          )}
          <Link
            href={leaderboardHref}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pitch hover:gap-2 hover:underline"
          >
            Zur Live-Rangliste →
          </Link>
        </div>

        {/* Dein Stand */}
        <div className="card">
          <div className="eyebrow">Dein Stand</div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Gruppe E
              </div>
              <div className="font-display text-3xl font-extrabold leading-none tabular-nums">
                {group.points}
                <span className="ml-1 text-base font-bold text-ink-soft">Pkt</span>
              </div>
            </div>
            <div className="rounded-full bg-pitch/8 px-3 py-1 text-sm font-semibold text-pitch">
              {group.rank ? `Platz ${group.rank} / ${group.total}` : "ungewertet"}
            </div>
          </div>

          {scope === "all" && all && (
            <div className="mt-3 flex items-end justify-between border-t border-ink/[0.06] pt-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Gesamt · alle Spiele
                </div>
                <div className="font-display text-3xl font-extrabold leading-none tabular-nums">
                  {all.points}
                  <span className="ml-1 text-base font-bold text-ink-soft">Pkt</span>
                </div>
              </div>
              <div className="rounded-full bg-pitch/8 px-3 py-1 text-sm font-semibold text-pitch">
                {all.rank ? `Platz ${all.rank} / ${all.total}` : "ungewertet"}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Nächste Spiele</div>
          <Link
            href={matchesHref}
            className="text-sm font-semibold text-pitch hover:underline"
          >
            Alle Spiele & Tipps →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-ink-soft">Aktuell keine offenen Spiele zum Tippen.</p>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((m) => {
              const bet = bets[m.id];
              return (
                <li
                  key={m.id}
                  className="card flex items-center justify-between p-4 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <span className="chip">{m.stage}</span>
                      <span>{formatKickoff(m.kickoff)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold">
                      <Flag team={m.homeTeam} /> {m.homeTeam}
                      <span className="text-ink-soft/50">vs</span>
                      {m.awayTeam} <Flag team={m.awayTeam} />
                    </div>
                  </div>
                  <div className="shrink-0 text-sm">
                    {bet ? (
                      <span className="inline-flex items-center rounded-full bg-pitch/10 px-3 py-1 font-bold tabular-nums text-pitch">
                        {bet.homeScore}:{bet.awayScore}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-dark">
                        offen
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
