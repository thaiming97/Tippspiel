"use client";

import Link from "next/link";
import { useState } from "react";
import type { GroupDoc, PollAudience } from "@/lib/types";

/**
 * „Wer sieht diese Umfrage?" – alle Angemeldeten oder nur bestimmte Gruppen.
 * Steht im Anlege-Formular und in den Einstellungen einer Umfrage.
 */
export function AudienceFields({
  groups,
  audience = "all",
  groupIds = [],
}: {
  groups: GroupDoc[];
  audience?: PollAudience;
  groupIds?: string[];
}) {
  const [mode, setMode] = useState<PollAudience>(audience);
  const known = new Set(groups.map((g) => g.id));
  // Verweise auf gelöschte Gruppen: Die Umfrage sieht dann ggf. niemand mehr.
  const orphaned = groupIds.filter((id) => !known.has(id)).length;

  return (
    <fieldset className="space-y-2.5">
      <legend className="label">Wer sieht diese Umfrage?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["all", "Alle", "Jeder mit einem Konto."],
            ["groups", "Nur bestimmte Gruppen", "Nur die Mitglieder der gewählten Gruppen."],
          ] as const
        ).map(([value, title, hint]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition ${
              mode === value
                ? "border-ff-navy/40 bg-ff-navy/[0.04]"
                : "border-ink/[0.08] bg-white hover:border-ink/20"
            }`}
          >
            <input
              type="radio"
              name="audience"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="mt-1 accent-ff-navy"
            />
            <span>
              <span className="block font-semibold leading-tight">{title}</span>
              <span className="block text-sm text-ink-soft">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      {mode === "groups" &&
        (groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-3 text-sm text-ink-soft">
            Noch keine Gruppen angelegt –{" "}
            <Link href="/admin/gruppen" className="font-semibold text-ff-navy hover:text-ff-orange">
              Gruppen verwalten
            </Link>
            . Ohne Gruppe sehen die Umfrage nur die Organisatoren.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold ring-1 ring-ink/10 transition has-[:checked]:bg-ff-navy has-[:checked]:text-white has-[:checked]:ring-ff-navy"
                >
                  <input
                    type="checkbox"
                    name="groupId"
                    value={g.id}
                    defaultChecked={groupIds.includes(g.id)}
                    className="sr-only"
                  />
                  {g.name}
                  <span className="text-xs font-medium opacity-60">
                    {g.memberIds.length}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-soft">
              Ohne gewählte Gruppe sehen die Umfrage nur die Organisatoren.{" "}
              {orphaned > 0 &&
                `${orphaned} früher gewählte Gruppe${orphaned === 1 ? " wurde" : "n wurden"} inzwischen gelöscht. `}
              <Link href="/admin/gruppen" className="font-semibold text-ff-navy hover:text-ff-orange">
                Gruppen verwalten
              </Link>
            </p>
          </div>
        ))}
    </fieldset>
  );
}
