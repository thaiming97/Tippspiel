import { getCurrentUser } from "@/lib/auth";
import { getMatches, getStandingsBoth, getUserBets, isBettable } from "@/lib/data";
import { HomeView } from "@/components/HomeView";
import { GROUP_E_STAGE } from "@/lib/types";
import type { StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Platz eines Nutzers nach Punkten – gleiche Punkte = gleicher Platz, Nummern
 * lückenlos (1, 2, 2, 3 …). Gezählt werden die unterschiedlichen Punktzahlen,
 * die höher sind. null, wenn nicht gewertet.
 */
function rankOf(rows: StandingRow[], userId: string): number | null {
  const me = rows.find((r) => r.userId === userId);
  if (!me) return null;
  const higher = new Set(
    rows.filter((r) => r.points > me.points).map((r) => r.points),
  );
  return higher.size + 1;
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
  const allRow = standings.all.find((s) => s.userId === user.id);

  const betRecord: Record<string, { homeScore: number; awayScore: number }> = {};
  bets.forEach((b, matchId) => {
    betRecord[matchId] = { homeScore: b.homeScore, awayScore: b.awayScore };
  });

  return (
    <HomeView
      userName={user.name}
      scope={scope}
      leaderName={leader?.name ?? null}
      leaderPoints={leader?.points ?? null}
      group={{
        points: groupRow?.points ?? 0,
        rank: rankOf(standings.group_e, user.id),
        total: standings.group_e.length,
      }}
      all={
        scope === "all"
          ? {
              points: allRow?.points ?? 0,
              rank: rankOf(standings.all, user.id),
              total: standings.all.length,
            }
          : null
      }
      upcoming={upcoming}
      bets={betRecord}
    />
  );
}
