import { getStandingsBoth } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Beide Wertungen serverseitig vorladen -> Rangliste ist beim Öffnen sofort
  // da (kein „Lädt…"), danach aktualisiert die Client-Komponente live.
  const initial = await getStandingsBoth();
  return <Leaderboard initial={initial} />;
}
