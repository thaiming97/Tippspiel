"use client";

import { useEffect, useState } from "react";
import type { Scope, StandingRow } from "@/lib/types";

const POLL_MS = 60000;

export default function LeaderboardPage() {
  const [scope, setScope] = useState<Scope>("group_e");
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard?scope=${scope}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setRows(data.standings);
        setUpdatedAt(data.updatedAt);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [scope]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏆 Rangliste</h1>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-green-500" />
          live
          {updatedAt && (
            <span className="ml-1">
              · {new Date(updatedAt).toLocaleTimeString("de-DE")}
            </span>
          )}
        </span>
      </div>

      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm">
        <button
          onClick={() => setScope("group_e")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            scope === "group_e" ? "bg-pitch text-white shadow-sm" : "text-gray-600"
          }`}
        >
          Nur Gruppe E
        </button>
        <button
          onClick={() => setScope("all")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            scope === "all" ? "bg-pitch text-white shadow-sm" : "text-gray-600"
          }`}
        >
          Alle Spiele
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Lädt…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">
          {scope === "all"
            ? "Noch keine Teilnehmer im Modus Alle Spiele."
            : "Noch keine Teilnehmer."}
        </p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-pitch-gradient text-left text-white">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-right">Spiele</th>
                <th className="px-4 py-3 text-right">Exakt</th>
                <th className="px-4 py-3 text-right">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const medal =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <tr
                    key={r.userId}
                    className={`border-t border-gray-100 ${
                      i === 0
                        ? "bg-gold/10 font-semibold"
                        : i < 3
                          ? "bg-gray-50"
                          : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-lg">{medal ?? i + 1}</td>
                    <td className="px-4 py-2.5">{r.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.played}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.exact}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {r.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Wie kommen die Punkte zustande?{" "}
        <a href="/help" className="font-medium text-pitch hover:underline">
          Punktevergabe erklärt →
        </a>
      </p>
    </div>
  );
}
