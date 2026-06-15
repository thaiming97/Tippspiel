import { teamFlagCode } from "@/lib/flags";

/**
 * Zeigt die Landesflagge eines Teams als SVG-Bild (von flagcdn.com).
 * Bewusst als <img>, weil Flaggen-Emojis auf Windows nicht dargestellt werden.
 */
export function Flag({ team, className }: { team: string; className?: string }) {
  const code = teamFlagCode(team);
  if (!code) return <span aria-hidden>⚽</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      className={
        className ??
        "inline-block h-3.5 w-5 rounded-[2px] object-cover align-[-1px] shadow-sm ring-1 ring-black/5"
      }
    />
  );
}
