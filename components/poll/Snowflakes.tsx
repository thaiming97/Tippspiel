/**
 * Dekorative Schneeflocken – rein visuell, deshalb `aria-hidden`. Sie füllen
 * das nächste positionierte Elternelement (der Kopfbereich der Seite). Die
 * Werte sind fest verdrahtet (kein Zufall), damit Server- und Client-Markup
 * identisch sind. Bei „Animationen reduzieren" stehen die Flocken still
 * (siehe globals.css).
 */
const FLAKES = [
  { left: "4%", delay: "0s", duration: "16s", size: "14px", char: "❅" },
  { left: "13%", delay: "5s", duration: "21s", size: "10px", char: "❈" },
  { left: "22%", delay: "9s", duration: "14s", size: "16px", char: "❆" },
  { left: "31%", delay: "2s", duration: "19s", size: "11px", char: "❅" },
  { left: "44%", delay: "12s", duration: "17s", size: "13px", char: "❈" },
  { left: "53%", delay: "7s", duration: "23s", size: "9px", char: "❆" },
  { left: "62%", delay: "1s", duration: "15s", size: "15px", char: "❅" },
  { left: "71%", delay: "10s", duration: "20s", size: "11px", char: "❈" },
  { left: "83%", delay: "4s", duration: "18s", size: "13px", char: "❆" },
  { left: "93%", delay: "14s", duration: "22s", size: "10px", char: "❅" },
];

export function Snowflakes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="absolute top-0 animate-snow-fall text-ff-navy/20"
          style={{
            left: f.left,
            fontSize: f.size,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}
