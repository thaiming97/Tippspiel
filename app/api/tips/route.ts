import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatches, getUserBets } from "@/lib/data";
import { GROUP_E_STAGE } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Tipps eines Nutzers für bereits AUSGEWERTETE (beendete) Spiele – inkl.
 * erreichter Punkte. Bewusst nur beendete Spiele, damit niemand die noch
 * offenen Tipps anderer für kommende Spiele sehen kann.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
  }
  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "group_e";

  const [matches, bets] = await Promise.all([getMatches(), getUserBets(userId)]);

  const tips = matches
    .filter(
      (m) =>
        m.status === "FINISHED" && m.homeScore !== null && m.awayScore !== null,
    )
    .filter((m) => (scope === "group_e" ? m.stage === GROUP_E_STAGE : true))
    // Neueste zuerst.
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .map((m) => {
      const bet = bets.get(m.id);
      return {
        matchId: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        stage: m.stage,
        kickoff: m.kickoff,
        resultHome: m.homeScore,
        resultAway: m.awayScore,
        betHome: bet ? bet.homeScore : null,
        betAway: bet ? bet.awayScore : null,
        points: bet ? bet.points : null,
      };
    });

  return NextResponse.json({ userId, scope, tips });
}
