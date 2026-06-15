/**
 * Wird vom App Router bei JEDEM Navigationswechsel neu gemountet – dadurch
 * spielt die Einblend-Animation (sanftes Aufsteigen + Entschärfen) bei jedem
 * Seitenwechsel ab. Reiner CSS-Übergang, kein Client-JS nötig.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
