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
    <div className="mx-auto mt-8 max-w-sm animate-rise sm:mt-16">
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-pitch-gradient p-8 text-center text-white shadow-card-hover">
        {/* Lime-Glow + Lichtkante */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-lime/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-lime/80 to-transparent" />
        <div className="mb-3 inline-grid h-16 w-16 place-items-center rounded-2xl bg-white/12 text-4xl ring-1 ring-white/25 backdrop-blur">
          ⚽
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          WM-Tippspiel <span className="text-lime">2026</span>
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Tippe die Ergebnisse. Sammle Punkte. Führe die Tabelle an.
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
