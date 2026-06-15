"use client";

import { useEffect, useState } from "react";
import type { Scope, StandingRow } from "@/lib/types";

const POLL_MS = 60000;

type Both = { group_e: StandingRow[]; all: StandingRow[] };

/**
 * Live-Rangliste. Die Startdaten kommen bereits vom Server (kein Lade-Flackern),
 * danach wird im Hintergrund aktualisiert. Beim Öffnen und beim Wechsel der
 * Wertung kippen die Zeilen gestaffelt von oben herein.
 */
export function Leaderboard({ initial }: { initial: Both }) {
  const [scope, setScope] = useState<Scope>("group_e");
  const [data, setData] = useState<Both>(initial);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard?scope=${scope}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        setData((d) => ({ ...d, [scope]: json.standings }));
        setUpdatedAt(json.updatedAt);
      } catch {
        /* still im Hintergrund */
      }
    }
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [scope]);

  const rows = data[scope];

  // Platz nach Punkten – gleiche Punkte = gleicher Platz, Nummern aber
  // lückenlos (1, 2, 2, 3, 3 …): der Platz steigt nur bei neuer Punktzahl.
  const ranks: number[] = [];
  let place = 0;
  rows.forEach((r, i) => {
    if (i === 0 || r.points !== rows[i - 1].points) place += 1;
    ranks.push(place);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Live-Tabelle</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Rangliste</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-pitch/8 px-3 py-1 text-xs font-semibold text-pitch">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-pitch" />
          live · {new Date(updatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Wertungs-Umschalter */}
      <div className="inline-flex rounded-full border border-ink/[0.06] bg-white p-1 text-sm font-semibold shadow-card">
        {(["group_e", "all"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`relative rounded-full px-4 py-1.5 transition-colors ${
              scope === s ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {scope === s && (
              <span className="absolute inset-0 -z-10 rounded-full bg-lime-gradient shadow-glow" />
            )}
            {s === "group_e" ? "Nur Gruppe E" : "Alle Spiele"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-soft">
          {scope === "all"
            ? "Noch keine Teilnehmer im Modus Alle Spiele."
            : "Noch keine Teilnehmer."}
        </p>
      ) : (
        // key={scope} -> beim Wechsel neu mounten, damit die Animation spielt.
        // perspective -> 3D-Flip beim Hereinkippen.
        <ol key={scope} className="space-y-2.5" style={{ perspective: "1100px" }}>
          {rows.map((r, i) => {
            const rank = ranks[i];
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            const rowCls =
              rank === 1
                ? "animate-ring-glow border-gold/40 bg-gradient-to-r from-gold/[0.18] via-gold/[0.06] to-transparent"
                : rank === 2
                  ? "border-slate-300/60 bg-gradient-to-r from-slate-200/70 to-transparent"
                  : rank === 3
                    ? "border-amber-300/50 bg-gradient-to-r from-amber-100/80 to-transparent"
                    : "border-ink/[0.06] bg-white shadow-card";
            const badgeCls =
              rank === 1
                ? "bg-gold-gradient text-ink shadow-glow-gold"
                : rank === 2
                  ? "bg-gradient-to-br from-slate-200 to-slate-400 text-white shadow-card"
                  : rank === 3
                    ? "bg-gradient-to-br from-amber-300 to-amber-600 text-white shadow-card"
                    : "bg-ink/[0.04] text-ink-soft";
            return (
              <li
                key={r.userId}
                className={`animate-row-in flex items-center gap-3 rounded-2xl border p-3.5 pr-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover sm:gap-4 ${rowCls}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold tabular-nums ${badgeCls}`}
                >
                  {medal ?? rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{r.name}</div>
                  <div className="text-xs text-ink-soft">
                    {r.played} Spiele · {r.exact}× exakt
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-extrabold leading-none tabular-nums text-ink">
                    {r.points}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                    Punkte
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-center text-xs text-ink-soft">
        Wie kommen die Punkte zustande?{" "}
        <a href="/help" className="font-semibold text-pitch hover:underline">
          Punktevergabe erklärt →
        </a>
      </p>
    </div>
  );
}
