"use client";

import { useEffect, useState } from "react";
import type { StandingRow } from "@/lib/types";

const POLL_MS = 15000;

export default function LeaderboardPage() {
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
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
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rangliste</h1>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          live
          {updatedAt && (
            <span className="ml-1">
              · {new Date(updatedAt).toLocaleTimeString("de-DE")}
            </span>
          )}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Lädt…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">Noch keine Teilnehmer.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 w-12">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 text-right">Spiele</th>
                <th className="px-4 py-2 text-right">Exakt</th>
                <th className="px-4 py-2 text-right">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId}
                  className={i === 0 ? "bg-yellow-50 font-semibold" : ""}
                >
                  <td className="px-4 py-2">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right">{r.played}</td>
                  <td className="px-4 py-2 text-right">{r.exact}</td>
                  <td className="px-4 py-2 text-right">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
