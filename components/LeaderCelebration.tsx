"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// Vor dem Paint laufen (verhindert ein kurzes Aufblitzen des Namens, bevor die
// Bälle kommen). Auf dem Server gibt es kein Layout -> dort useEffect.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Dichtes Raster aus überlappenden Bällen -> die Karte wird komplett gefüllt,
// kein Hintergrund mehr sichtbar.
const COLS = 16;
const ROWS = 14;
const N = COLS * ROWS; // 224 Bälle

// Timing (ms).
const FILL_ROW = 26; // Verzögerung je Reihe beim Einlaufen (unten zuerst)
const FILL_TRANS = 430; // Dauer der Einlauf-Bewegung je Ball
const HOLD = 460; // „Kiste voll" – kurz halten, Name blendet dahinter ein
const DRAIN_ROW = 24; // Verzögerung je Reihe beim Auslaufen (unten zuerst)
const DRAIN_TRANS = 480; // Dauer der Auslauf-Bewegung je Ball

type Phase = "idle" | "enter" | "fill" | "full" | "drain";

// Deterministische „Zufalls"-Streuung pro Ball – kein Hydration-Problem, da die
// Bälle nur clientseitig während der Animation gerendert werden.
function rand(i: number, salt: number): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

interface Ball {
  left: number; // %
  restTop: number; // % (Ruheposition in der gefüllten Kiste)
  rot: number; // deg
  size: number; // rem
  fillDelay: number;
  drainDelay: number;
}

const BALLS: Ball[] = Array.from({ length: N }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    left: 2 + col * (96 / (COLS - 1)) + (rand(i, 1) - 0.5) * 5,
    restTop: 3 + row * (94 / (ROWS - 1)) + (rand(i, 2) - 0.5) * 5,
    rot: Math.round((rand(i, 3) - 0.5) * 140),
    size: 1.7 + rand(i, 6) * 0.8,
    // Unten zuerst -> die Kiste füllt sich von unten nach oben.
    fillDelay: (ROWS - 1 - row) * FILL_ROW + Math.round(rand(i, 4) * 90),
    // Unten zuerst -> „Klappe unten auf", Inhalt purzelt nach unten raus.
    drainDelay: (ROWS - 1 - row) * DRAIN_ROW + Math.round(rand(i, 5) * 80),
  };
});

const FILL_DONE = Math.max(...BALLS.map((b) => b.fillDelay)) + FILL_TRANS;
const DRAIN_START = FILL_DONE + HOLD;
const DRAIN_DONE = DRAIN_START + Math.max(...BALLS.map((b) => b.drainDelay)) + DRAIN_TRANS;

/**
 * Sieger-Feier in der „Aktuell führt"-Karte. Ablauf:
 *  1. Hunderte Fußbälle laufen von oben in die Karte und füllen sie komplett –
 *     kein Hintergrund mehr sichtbar.
 *  2. Der Name des Spitzenreiters blendet HINTER den Bällen ein.
 *  3. Unten öffnet sich die „Klappe", die Bälle purzeln nach unten heraus
 *     (Reihen von unten zuerst) und geben den Namen frei.
 *
 * Gespielt wird automatisch bei einem Führungswechsel (pro Browser gemerkt; der
 * erste Besuch zählt als Wechsel, daher auch beim Einloggen) sowie jederzeit auf
 * Klick aufs 🥇-Symbol.
 */
export function LeaderCelebration({ leaderName }: { leaderName: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef(0);

  const stop = useMemo(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  function play() {
    stop();
    setPhase("enter"); // Bälle oberhalb der Karte platzieren (ohne Transition)
    // Zwei Frames warten, damit „enter" gemalt ist, dann einlaufen lassen.
    raf.current = requestAnimationFrame(() => {
      raf.current = requestAnimationFrame(() => setPhase("fill"));
    });
    timers.current.push(setTimeout(() => setPhase("full"), FILL_DONE));
    timers.current.push(setTimeout(() => setPhase("drain"), DRAIN_START));
    timers.current.push(setTimeout(() => setPhase("idle"), DRAIN_DONE));
  }

  // Auto-Trigger bei Führungswechsel (inkl. erstem Besuch in diesem Browser).
  // Als Layout-Effect, damit der Name gar nicht erst sichtbar wird, bevor die
  // Bälle einlaufen.
  useIsomorphicLayoutEffect(() => {
    if (!leaderName) return;
    const key = "wm_last_leader";
    const prev = localStorage.getItem(key);
    if (prev !== leaderName) play();
    localStorage.setItem(key, leaderName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderName]);

  useEffect(() => stop, [stop]);

  const showBalls = phase !== "idle";
  // Name ist während Einlaufen/Füllen verborgen; ab „voll" blendet er (hinter
  // den Bällen) ein und ist nach dem Auslaufen frei sichtbar.
  const nameHidden = phase === "enter" || phase === "fill";

  return (
    <div className="leader-celebration flex items-center gap-2.5">
      <button
        type="button"
        onClick={play}
        aria-label="Spitzenreiter feiern"
        className="z-10 cursor-pointer text-3xl leading-none transition-transform hover:scale-110 active:scale-95"
      >
        🥇
      </button>

      {/* Name: liegt im Karten-Hintergrund (unter der Ball-Schicht). */}
      <span
        className={`celebration-name font-display text-2xl font-extrabold tracking-tight transition-all duration-500 ${
          nameHidden ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {leaderName || "– noch niemand –"}
      </span>

      {showBalls && (
        <div
          className="celebration-fill pointer-events-none absolute inset-0 z-20 overflow-hidden"
          style={{
            // Füll-Schicht hinter den Bällen: schließt die Lücken zwischen den
            // runden Bällen, damit kein Karten-Hintergrund durchscheint. Läuft
            // mit den Bällen ein und beim Auslaufen wieder weg.
            backgroundColor:
              phase === "fill" || phase === "full"
                ? "rgba(7, 60, 38, 0.94)"
                : "transparent",
            transition: `background-color ${
              phase === "drain" ? DRAIN_TRANS : FILL_TRANS
            }ms ease`,
          }}
        >
          {BALLS.map((b, i) => {
            const top =
              phase === "enter" ? -15 : phase === "drain" ? 135 : b.restTop;
            const delay =
              phase === "fill" ? b.fillDelay : phase === "drain" ? b.drainDelay : 0;
            const dur = phase === "drain" ? DRAIN_TRANS : FILL_TRANS;
            return (
              <span
                key={i}
                className="celebration-ball absolute drop-shadow-[0_3px_4px_rgba(0,0,0,0.18)]"
                style={{
                  left: `${b.left}%`,
                  top: `${top}%`,
                  fontSize: `${b.size}rem`,
                  transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
                  transition:
                    phase === "enter"
                      ? "none"
                      : `top ${dur}ms cubic-bezier(0.4, 0.02, 0.35, 1)`,
                  transitionDelay: `${delay}ms`,
                  willChange: "top",
                }}
              >
                ⚽
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
