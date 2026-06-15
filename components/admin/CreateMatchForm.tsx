"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createMatchAction } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Anlegen…" : "Spiel anlegen"}
    </button>
  );
}

export function CreateMatchForm() {
  const [state, formAction] = useFormState(createMatchAction, undefined);
  return (
    <form action={formAction} className="card space-y-3">
      <h3 className="font-semibold">Spiel manuell anlegen</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Heim-Team</label>
          <input name="homeTeam" className="input" required />
        </div>
        <div>
          <label className="label">Gast-Team</label>
          <input name="awayTeam" className="input" required />
        </div>
        <div>
          <label className="label">Phase / Gruppe</label>
          <input name="stage" className="input" defaultValue="Gruppenphase" />
        </div>
        <div>
          <label className="label">Anstoß</label>
          <input name="kickoff" type="datetime-local" className="input" required />
        </div>
      </div>
      <Btn />
      {state?.ok && <p className="text-sm text-green-600">{state.ok}</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
