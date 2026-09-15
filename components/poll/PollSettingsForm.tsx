"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateSettingsAction } from "@/app/actions/polls";
import { choiceLabel, formatDateLong } from "@/lib/polls";
import type { PollDoc } from "@/lib/types";

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

/** Zustand und Festlegungen einer Umfrage – nur im Admin-Bereich. */
export function PollSettingsForm({ poll }: { poll: PollDoc }) {
  const [state, formAction] = useFormState(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="card space-y-4 border-ink/[0.06]">
      <input type="hidden" name="slug" value={poll.id} />
      <div className="eyebrow">Umfrage steuern</div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Toggle
          name="open"
          defaultChecked={poll.open}
          title="Abstimmung offen"
          hint="Aus: niemand kann mehr abstimmen."
        />
        <Toggle
          name="showResults"
          defaultChecked={poll.showResults}
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
            defaultValue={poll.finalDate ?? ""}
          >
            <option value="">— noch offen —</option>
            {poll.dates.map((d) => (
              <option key={d} value={d}>
                {formatDateLong(d)}
              </option>
            ))}
          </select>
        </div>
        {poll.choices.length > 0 && (
          <div>
            <label className="label" htmlFor="finalChoice">
              Festgelegte Auswahl
            </label>
            <select
              id="finalChoice"
              name="finalChoice"
              className="input"
              defaultValue={poll.finalChoice ?? ""}
            >
              <option value="">— noch offen —</option>
              {poll.choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {choiceLabel(c)}
                </option>
              ))}
            </select>
          </div>
        )}
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
          defaultValue={poll.note}
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
