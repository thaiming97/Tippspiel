"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "../actions/auth";
import { ScopePicker } from "@/components/ScopePicker";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn w-full" disabled={pending}>
      {pending ? "Speichern…" : "Passwort ändern"}
    </button>
  );
}

export default function ChangePasswordPage() {
  const [state, formAction] = useFormState(changePasswordAction, undefined);

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 text-center text-2xl font-bold">Passwort festlegen</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Bei der ersten Anmeldung musst du dein Startpasswort ändern.
      </p>
      <form action={formAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="current">
            Aktuelles (Start-)Passwort
          </label>
          <input id="current" name="current" type="password" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="next">
            Neues Passwort (min. 8 Zeichen)
          </label>
          <input id="next" name="next" type="password" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Neues Passwort bestätigen
          </label>
          <input id="confirm" name="confirm" type="password" className="input" required />
        </div>
        <div className="border-t border-gray-100 pt-4">
          <ScopePicker />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
