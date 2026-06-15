"use client";

import { useEffect, useState } from "react";

// 5 Spalten × 5 Reihen füllen die Karte.
const COLS = 5;
const ROWS = 5;
const BALLS = Array.from({ length: COLS * ROWS });
const DURATION_MS = 2900;

/**
 * Feiert den Spitzenreiter in der „Aktuell führt"-Karte: viele Fußbälle fluten
 * von oben hinein, füllen die Karte und laufen wieder ab. Das 🥇-Symbol ist
 * zugleich der Auslöser.
 *
 * Gespielt wird:
 *  - automatisch, wenn ein NEUER Führender auftaucht (pro Browser via
 *    localStorage gemerkt; beim allerersten Besuch ohne gespeicherten Stand
 *    nicht), und
 *  - jederzeit auf Klick aufs 🥇-Symbol.
 */
export function LeaderCelebration({ leaderName }: { leaderName: string }) {
  const [active, setActive] = useState(false);

  // Bei Führungswechsel automatisch feiern.
  useEffect(() => {
    if (!leaderName) return;
    const key = "wm_last_leader";
    const prev = localStorage.getItem(key);
    if (prev !== null && prev !== leaderName) setActive(true);
    localStorage.setItem(key, leaderName);
  }, [leaderName]);

  // Animation nach Ablauf selbst wieder beenden – egal, wodurch sie startete.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label="Spitzenreiter feiern"
        className="cursor-pointer text-3xl leading-none transition-transform hover:scale-110 active:scale-95"
      >
        🥇
      </button>

      {active && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl">
          {BALLS.map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            // Reihenweise von oben nach unten reinfluten und ablaufen.
            const delay = row * 90 + (col % 2) * 45;
            return (
              <span
                key={i}
                className="animate-ball-flood absolute text-2xl drop-shadow"
                style={{
                  left: `${6 + col * 19}%`,
                  top: `${8 + row * 19}%`,
                  animationDelay: `${delay}ms`,
                }}
              >
                ⚽
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
