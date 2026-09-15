"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPollAction, updatePollAction } from "@/app/actions/polls";
import {
  MAX_CHOICES,
  MAX_DATES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  WEEKDAYS,
  buildDates,
  cleanDates,
  formatDate,
} from "@/lib/polls";
import type { PollDoc } from "@/lib/types";

interface ChoiceRow {
  name: string;
  hint: string;
}

/** Beispiele in den Platzhaltern der Auswahl-Zeilen. */
const EXAMPLES = [
  { name: "Krone", hint: "Unsleben" },
  { name: "Braunsmühle", hint: "Bischofsheim" },
  { name: "Brückenschenke", hint: "Wülfershausen" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="inline-flex items-center justify-center rounded-full bg-ff-orange-gradient px-6 py-3 text-base font-bold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Speichern…" : label}
    </button>
  );
}

/**
 * Anlegen und Bearbeiten einer Umfrage – hier stellt der Organisator
 * Termine und Auswahl-Optionen selbst zusammen.
 *
 * Die Termine werden im Browser gesammelt und als eine Liste abgeschickt
 * (verstecktes Feld `dates`). Die Felder des Termin-Generators tragen
 * bewusst kein `name`: Sonst würden entfernte Termine beim Speichern wieder
 * auftauchen.
 */
export function PollEditor({ poll }: { poll?: PollDoc }) {
  const editing = Boolean(poll);
  const [state, formAction] = useFormState(
    editing ? updatePollAction : createPollAction,
    undefined,
  );

  const [dates, setDates] = useState<string[]>(poll?.dates ?? []);
  const [choices, setChoices] = useState<ChoiceRow[]>(
    poll?.choices.map((c) => ({ name: c.name, hint: c.hint })) ?? [
      { name: "", hint: "" },
      { name: "", hint: "" },
      { name: "", hint: "" },
    ],
  );

  // Termin-Generator
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([4, 5]);
  const [single, setSingle] = useState("");

  const preview = buildDates(from, to, weekdays);

  function toggleWeekday(value: number) {
    setWeekdays((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function addGenerated() {
    setDates((prev) => cleanDates([...prev, ...preview]));
  }

  function addSingle() {
    if (!single) return;
    setDates((prev) => cleanDates([...prev, single]));
    setSingle("");
  }

  function removeDate(date: string) {
    setDates((prev) => prev.filter((d) => d !== date));
  }

  return (
    <form action={formAction} className="space-y-5">
      {poll && <input type="hidden" name="slug" value={poll.id} />}

      {/* --- Grunddaten --- */}
      <div className="card space-y-3 border-ink/[0.06]">
        <div className="eyebrow">Worum geht es?</div>
        <div>
          <label className="label" htmlFor="title">
            Titel
          </label>
          <input
            id="title"
            name="title"
            className="input"
            maxLength={MAX_TITLE_LENGTH}
            placeholder="z.B. Weihnachtsessen der Abteilung"
            defaultValue={poll?.title ?? ""}
            required
          />
          {editing && (
            <p className="mt-1.5 text-xs text-ink-soft">
              Der Link bleibt <code className="font-mono">/umfrage/{poll!.id}</code>{" "}
              – auch wenn du den Titel änderst.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="description">
            Einleitung <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[70px] resize-y"
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="z.B. Wir suchen Termin und Restaurant. Trag einfach ein, wann du kannst."
            defaultValue={poll?.description ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="theme">
            Optik
          </label>
          <select
            id="theme"
            name="theme"
            className="input"
            defaultValue={poll?.theme ?? "neutral"}
          >
            <option value="neutral">Normal</option>
            <option value="weihnachten">Weihnachtlich (Schnee &amp; Tanne)</option>
          </select>
        </div>
      </div>

      {/* --- Termine --- */}
      <div className="card space-y-4 border-ink/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="eyebrow">Termine zur Wahl</div>
          <span className="chip bg-ff-orange/10 text-ff-orange">
            {dates.length} von max. {MAX_DATES}
          </span>
        </div>

        {/* Generator: Zeitraum + Wochentage */}
        <div className="rounded-2xl bg-ink/[0.03] p-3.5">
          <p className="mb-2.5 text-sm font-semibold">
            Serie erzeugen – z.B. „jeden Do und Fr vom 12.11. bis 18.12."
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="from">
                von
              </label>
              <input
                id="from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="to">
                bis
              </label>
              <input
                id="to"
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <span className="label">an diesen Wochentagen</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => {
                const active = weekdays.includes(w.value);
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => toggleWeekday(w.value)}
                    aria-pressed={active}
                    title={w.long}
                    className={`h-9 w-11 rounded-xl text-sm font-bold transition ${
                      active
                        ? "bg-ff-navy text-white shadow-card"
                        : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                    }`}
                  >
                    {w.short}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addGenerated}
              disabled={preview.length === 0}
              className="btn-ghost"
            >
              + {preview.length > 0 ? `${preview.length} Termine` : "Termine"} übernehmen
            </button>
            {from && to && preview.length === 0 && (
              <span className="text-xs text-ink-soft">
                In diesem Zeitraum liegt keiner der gewählten Wochentage.
              </span>
            )}
          </div>
        </div>

        {/* Einzelnen Termin ergänzen */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="label" htmlFor="single">
              Einzelnen Termin ergänzen
            </label>
            <input
              id="single"
              type="date"
              className="input"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
            />
          </div>
          <button type="button" onClick={addSingle} className="btn-ghost">
            + Hinzufügen
          </button>
        </div>

        {/* Gewählte Termine */}
        {dates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1.5 rounded-full bg-xmas-pine/[0.08] px-3 py-1.5 text-sm font-semibold text-xmas-pine"
              >
                {formatDate(d)}
                <button
                  type="button"
                  onClick={() => removeDate(d)}
                  className="grid h-5 w-5 place-items-center rounded-full text-xmas-pine/70 transition hover:bg-xmas-pine/15 hover:text-xmas-pine"
                  title={`${formatDate(d)} entfernen`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-3 text-sm text-ink-soft">
            Noch keine Termine – erzeuge eine Serie oder ergänze einzelne Tage.
          </p>
        )}
        {/* Das ist, was gespeichert wird. */}
        <input type="hidden" name="dates" value={dates.join(" ")} />
      </div>

      {/* --- Auswahl --- */}
      <div className="card space-y-3 border-ink/[0.06]">
        <div className="eyebrow">Auswahl (optional)</div>
        <div>
          <label className="label" htmlFor="choicesTitle">
            Überschrift der Auswahl
          </label>
          <input
            id="choicesTitle"
            name="choicesTitle"
            className="input"
            maxLength={MAX_TITLE_LENGTH}
            placeholder="z.B. Wo soll's hingehen?"
            defaultValue={poll?.choicesTitle ?? ""}
          />
        </div>
        <div className="space-y-2">
          <span className="label">Optionen zum Ankreuzen</span>
          {choices.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                name="choiceName"
                className="input min-w-[140px] flex-1"
                placeholder={`Name, z.B. ${
                  EXAMPLES[i % EXAMPLES.length].name
                }`}
                value={row.name}
                maxLength={60}
                onChange={(e) =>
                  setChoices((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <input
                name="choiceHint"
                className="input min-w-[120px] flex-1"
                placeholder={`Zusatz, z.B. ${
                  EXAMPLES[i % EXAMPLES.length].hint
                }`}
                value={row.hint}
                maxLength={60}
                onChange={(e) =>
                  setChoices((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, hint: e.target.value } : r)),
                  )
                }
              />
              <button
                type="button"
                onClick={() => setChoices((prev) => prev.filter((_, j) => j !== i))}
                className="grid h-9 w-9 flex-none place-items-center rounded-xl text-ink-soft ring-1 ring-ink/10 transition hover:bg-red-50 hover:text-red-700"
                title="Option entfernen"
              >
                ×
              </button>
            </div>
          ))}
          {choices.length < MAX_CHOICES && (
            <button
              type="button"
              onClick={() => setChoices((prev) => [...prev, { name: "", hint: "" }])}
              className="btn-ghost"
            >
              + Option
            </button>
          )}
          <p className="text-xs text-ink-soft">
            Leere Zeilen werden ignoriert. Ohne Optionen wird nur der Termin
            abgefragt.
          </p>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={editing ? "Änderungen speichern" : "Umfrage anlegen"} />
        {state?.ok && (
          <span className="text-sm font-medium text-xmas-pine">{state.ok}</span>
        )}
      </div>
    </form>
  );
}
