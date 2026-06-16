import { getCurrentUser } from "@/lib/auth";
import { getMatches, getUserBets } from "@/lib/data";
import { MatchesList } from "@/components/MatchesList";
import { GROUP_E_STAGE } from "@/lib/types";

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
      {matches.length === 0 ? (
        <p className="text-gray-500">
          Noch keine Spiele angelegt. Ein Admin kann Spiele anlegen oder den
          Sync starten.
        </p>
      ) : (
        <MatchesList
          matches={matches}
          bets={Object.fromEntries(bets)}
          now={Date.now()}
        />
      )}
    </div>
  );
}
