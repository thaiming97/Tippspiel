"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateDinnerSettingsAction } from "@/app/actions/dinner";
import { DINNER_DATES, RESTAURANTS, formatDinnerDateLong } from "@/lib/dinner";
import type { DinnerSettingsDoc } from "@/lib/types";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button
      className="inline-flex items-center justify-center rounded-full bg-ff-navy px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:bg-ff-navy-dark hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Speichern…" : "Einstellungen speichern"}
    </button>
  );
}

/** Umschalter im Stil einer Schiebe-Taste (reines CSS über peer-checked). */
function Toggle({
  name,
  defaultChecked,
  title,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/[0.08] bg-white px-3.5 py-3 transition hover:border-ink/20">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="relative mt-0.5 h-5 w-9 flex-none rounded-full bg-ink/20 transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:bg-xmas-pine peer-checked:after:translate-x-4" />
      <span>
        <span className="block font-semibold leading-tight">{title}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

/** Einstellungen der Umfrage – nur im Admin-Bereich erreichbar. */
export function DinnerSettingsForm({ settings }: { settings: DinnerSettingsDoc }) {
  const [state, formAction] = useFormState(updateDinnerSettingsAction, undefined);

  return (
    <form action={formAction} className="card space-y-4 border-ink/[0.06]">
      <div className="eyebrow before:bg-ff-orange">Umfrage steuern</div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Toggle
          name="open"
          defaultChecked={settings.open}
          title="Abstimmung offen"
          hint="Aus: niemand kann mehr abstimmen."
        />
        <Toggle
          name="showResults"
          defaultChecked={settings.showResults}
          title="Stand öffentlich sichtbar"
          hint="Aus: nur du siehst die Antworten."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="finalDate">
            Festgelegter Termin
          </label>
          <select
            id="finalDate"
            name="finalDate"
            className="input"
            defaultValue={settings.finalDate ?? ""}
          >
            <option value="">— noch offen —</option>
            {DINNER_DATES.map((d) => (
              <option key={d} value={d}>
                {formatDinnerDateLong(d)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="finalRestaurant">
            Festgelegtes Restaurant
          </label>
          <select
            id="finalRestaurant"
            name="finalRestaurant"
            className="input"
            defaultValue={settings.finalRestaurant ?? ""}
          >
            <option value="">— noch offen —</option>
            {RESTAURANTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.town}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Hinweis für alle <span className="font-normal text-ink/40">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          className="input"
          maxLength={300}
          placeholder="z.B. Treffpunkt 19:00 Uhr am Eingang"
          defaultValue={settings.note}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Steht unter dem festgelegten Termin – und als Text, wenn die
          Abstimmung geschlossen ist.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn />
        {state?.ok && (
          <span className="text-sm font-medium text-xmas-pine">{state.ok}</span>
        )}
        {state?.error && (
          <span className="text-sm font-medium text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
