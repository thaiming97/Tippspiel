"use client";

import { useEffect, useState } from "react";

// 5 Spalten × 5 Reihen füllen die Karte.
const COLS = 5;
const ROWS = 5;
const BALLS = Array.from({ length: COLS * ROWS });

/**
 * Feiert einen NEUEN Spitzenreiter direkt in der „Aktuell führt"-Karte:
 * viele Fußbälle fluten von oben hinein, füllen die Karte, laufen dann nach
 * unten ab – darunter erscheint der Name. Merkt sich den zuletzt gesehenen
 * Führenden pro Browser (localStorage); beim ersten Besuch keine Animation.
 */
export function LeaderBallFlood({ leaderName }: { leaderName: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!leaderName) return;
    const key = "wm_last_leader";
    const prev = localStorage.getItem(key);
    localStorage.setItem(key, leaderName);
    if (prev !== null && prev !== leaderName) {
      setActive(true);
      const t = setTimeout(() => setActive(false), 2900);
      return () => clearTimeout(t);
    }
  }, [leaderName]);

  if (!active) return null;

  return (
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
  );
}
