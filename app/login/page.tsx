"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "../actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn w-full" disabled={pending}>
      {pending ? "Anmelden…" : "Anmelden"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, undefined);

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 text-center text-2xl font-bold">⚽ WM-Tippspiel</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Bitte mit deinen Zugangsdaten anmelden.
      </p>
      <form action={formAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">
            E-Mail
          </label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}
