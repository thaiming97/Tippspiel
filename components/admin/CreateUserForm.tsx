"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUserAction } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Anlegen…" : "Benutzer anlegen"}
    </button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, undefined);

  return (
    <form action={formAction} className="card space-y-3">
      <h3 className="font-semibold">Neuen Benutzer anlegen</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" className="input" required />
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label">
            Startpasswort <span className="text-gray-400">(leer = automatisch)</span>
          </label>
          <input name="startPassword" className="input" placeholder="automatisch generieren" />
        </div>
        <div>
          <label className="label">Rolle</label>
          <select name="role" className="input">
            <option value="user">Teilnehmer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="label">Tipp-Umfang</label>
          <select name="scope" className="input">
            <option value="group_e">Nur Gruppe E (1€)</option>
            <option value="all">Alle Spiele</option>
          </select>
        </div>
      </div>
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
