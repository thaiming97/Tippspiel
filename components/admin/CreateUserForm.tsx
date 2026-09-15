"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUserAction } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Anlegen…" : "Konto anlegen"}
    </button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, undefined);

  return (
    <form action={formAction} className="card space-y-3">
      <h3 className="font-display font-extrabold text-ff-navy">
        Konto anlegen
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" className="input" required />
        </div>
        <div>
          <label className="label">
            E-Mail <span className="text-ink/40">(optional)</span>
          </label>
          <input name="email" type="email" className="input" />
        </div>
        <div>
          <label className="label">
            Startpasswort <span className="text-ink/40">(leer = start123)</span>
          </label>
          <input name="startPassword" className="input" placeholder="start123" />
        </div>
        <div>
          <label className="label">Rolle</label>
          <select name="role" className="input" defaultValue="user">
            <option value="user">Teilnehmer (abstimmen)</option>
            <option value="admin">Organisator (verwalten)</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-ink-soft">
        Das Startpasswort muss bei der ersten Anmeldung geändert werden.
        Kollegen können sich auch selbst ein Konto anlegen.
      </p>
      <Btn />
      {state?.ok && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {state.ok}
          {state.password && (
            <div className="mt-1">
              Startpasswort:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono">
                {state.password}
              </code>{" "}
              – jetzt notieren und weitergeben (muss beim ersten Login geändert
              werden).
            </div>
          )}
        </div>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
