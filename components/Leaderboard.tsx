"use client";

import { useEffect, useState } from "react";
import { Flag } from "@/components/Flag";
import { formatKickoff } from "@/lib/format";
import type { Scope, StandingRow } from "@/lib/types";

const POLL_MS = 60000;

type Both = { group_e: StandingRow[]; all: StandingRow[] };

interface TipRow {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  kickoff: string;
  resultHome: number;
  resultAway: number;
  betHome: number | null;
  betAway: number | null;
  points: number | null;
}

type View = { mode: "list" } | { mode: "detail"; row: StandingRow };

const SLIDE_MS = 480;

function pointsBadge(points: number): string {
  if (points === 4) return "bg-gold-gradient text-ink shadow-glow-gold";
  if (points === 3) return "bg-pitch text-white";
  if (points === 2) return "bg-pitch/15 text-pitch";
  return "bg-ink/[0.05] text-ink-soft";
}

/**
 * Live-Rangliste mit antippbaren Namen. Ein Tipp auf einen Namen lässt die
 * Rangliste nach links herausgleiten und die abgegebenen Tipps der Person (mit
 * Punkten je Spiel) von rechts hereingleiten; zurück geht es umgekehrt.
 */
export function Leaderboard({ initial }: { initial: Both }) {
  const [scope, setScope] = useState<Scope>("group_e");
  const [data, setData] = useState<Both>(initial);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  // Panel-Wechsel Rangliste <-> Detail.
  const [view, setView] = useState<View>({ mode: "list" });
  const [leaving, setLeaving] = useState<View | null>(null);
  const [started, setStarted] = useState(false);

  const selectedId = view.mode === "detail" ? view.row.userId : null;

  // Tipps der ausgewählten Person.
  const [tips, setTips] = useState<TipRow[] | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState(false);

  function go(next: View) {
    setStarted(true);
    setLeaving(view);
    setView(next);
    window.setTimeout(() => setLeaving(null), SLIDE_MS);
  }

  // Hintergrund-Aktualisierung der Rangliste.
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

  // Tipps laden, sobald eine Person ausgewählt ist (oder die Wertung wechselt).
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setTips(null);
    setTipsError(false);
    setTipsLoading(true);
    fetch(`/api/tips?userId=${encodeURIComponent(selectedId)}&scope=${scope}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad"))))
      .then((j) => {
        if (!active) return;
        setTips(j.tips as TipRow[]);
        setTipsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTipsError(true);
        setTipsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, scope]);

  const rows = data[scope];

  // Platz nach Punkten – gleiche Punkte = gleicher Platz, Nummern lückenlos.
  const ranks: number[] = [];
  let place = 0;
  rows.forEach((r, i) => {
    if (i === 0 || r.points !== rows[i - 1].points) place += 1;
    ranks.push(place);
  });

  function renderList() {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow">Live-Tabelle</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Rangliste</h1>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-pitch/8 px-3 py-1 text-xs font-semibold text-pitch">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-pitch" />
            live ·{" "}
            {new Date(updatedAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
                <li key={r.userId} className="animate-row-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <button
                    onClick={() => go({ mode: "detail", row: r })}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 pr-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover sm:gap-4 ${rowCls}`}
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold tabular-nums ${badgeCls}`}>
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
                    <span className="ml-1 shrink-0 text-xl text-ink-soft/40 transition-all group-hover:translate-x-0.5 group-hover:text-pitch">
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <p className="text-center text-xs text-ink-soft">
          Tipp auf einen Namen zeigt die abgegebenen Tipps.{" "}
          <a href="/help" className="font-semibold text-pitch hover:underline">
            Punktevergabe erklärt →
          </a>
        </p>
      </div>
    );
  }

  function renderDetail(row: StandingRow) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => go({ mode: "list" })}
            className="btn-ghost shrink-0 !px-3 !py-1.5"
            aria-label="Zurück zur Rangliste"
          >
            ← Rangliste
          </button>
          <div className="min-w-0">
            <div className="eyebrow !text-ink-soft">
              Tipps · {scope === "group_e" ? "Gruppe E" : "Alle Spiele"}
            </div>
            <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight">
              {row.name}
            </h1>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <div className="font-display text-2xl font-extrabold leading-none tabular-nums text-ink">
              {row.points}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Punkte
            </div>
          </div>
        </div>

        {tipsLoading && <p className="text-ink-soft">Lädt Tipps…</p>}
        {tipsError && (
          <p className="text-red-600">Tipps konnten nicht geladen werden.</p>
        )}
        {tips && tips.length === 0 && (
          <p className="text-ink-soft">Noch keine ausgewerteten Spiele.</p>
        )}

        {tips && tips.length > 0 && (
          <ol className="space-y-2.5">
            {tips.map((t, i) => {
              const points = t.points ?? 0;
              const hasBet = t.betHome !== null && t.betAway !== null;
              return (
                <li
                  key={t.matchId}
                  className="animate-row-in flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-white p-3.5 shadow-card"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                      <span className="chip">{t.stage}</span>
                      <span className="truncate">{formatKickoff(t.kickoff)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[15px] font-semibold">
                      <Flag team={t.homeTeam} />
                      <span className="truncate">{t.homeTeam}</span>
                      <span className="mx-0.5 rounded-md bg-ink/[0.05] px-1.5 py-0.5 tabular-nums">
                        {t.resultHome}:{t.resultAway}
                      </span>
                      <span className="truncate">{t.awayTeam}</span>
                      <Flag team={t.awayTeam} />
                    </div>
                    <div className="mt-1 text-xs text-ink-soft">
                      Tipp:{" "}
                      <span className="font-semibold tabular-nums text-ink">
                        {hasBet ? `${t.betHome}:${t.betAway}` : "—"}
                      </span>
                      {!hasBet && " (kein Tipp)"}
                    </div>
                  </div>
                  <div
                    className={`grid h-10 min-w-10 shrink-0 place-items-center rounded-xl px-2 text-base font-extrabold tabular-nums ${pointsBadge(points)}`}
                    title="Punkte für diesen Tipp"
                  >
                    {points}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  const currentAnim =
    view.mode === "detail" ? "animate-slide-in-right" : "animate-slide-in-left";
  const leavingAnim =
    leaving?.mode === "list" ? "animate-slide-out-left" : "animate-slide-out-right";

  return (
    <div className="relative overflow-hidden">
      {leaving && (
        <div
          key={leaving.mode === "detail" ? `lv-d-${leaving.row.userId}` : "lv-list"}
          className={`pointer-events-none absolute inset-x-0 top-0 ${leavingAnim}`}
          aria-hidden
        >
          {leaving.mode === "list" ? renderList() : renderDetail(leaving.row)}
        </div>
      )}
      <div
        key={view.mode === "detail" ? `d-${view.row.userId}` : "list"}
        className={started ? currentAnim : undefined}
      >
        {view.mode === "list" ? renderList() : renderDetail(view.row)}
      </div>
    </div>
  );
}
