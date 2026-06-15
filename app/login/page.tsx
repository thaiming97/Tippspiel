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
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 rounded-2xl bg-pitch-gradient p-6 text-center text-white shadow-md">
        <div className="text-4xl">⚽</div>
        <h1 className="mt-1 text-2xl font-bold">
          WM-Tippspiel <span className="text-gold">2026</span>
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Bitte mit deinen Zugangsdaten anmelden.
        </p>
      </div>
      <form action={formAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoCapitalize="none"
            autoComplete="username"
            className="input"
            required
          />
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
