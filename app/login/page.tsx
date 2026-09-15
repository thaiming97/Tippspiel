"use client";

import Link from "next/link";
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
    <div className="mx-auto mt-6 max-w-sm animate-rise sm:mt-12">
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-ff-navy-gradient p-8 text-center text-white shadow-card-hover">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-ff-orange/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-ff-yellow/80 to-transparent" />
        <h1 className="text-3xl font-extrabold tracking-tight">
          FF <span className="text-ff-yellow">Entertainment</span>
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Anmeldung für Organisatoren. Zum Abstimmen brauchst du kein Konto.
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
      <p className="mt-4 text-center text-sm text-ink-soft">
        <Link href="/" className="hover:text-ink">
          ← Zu den Umfragen
        </Link>
      </p>
    </div>
  );
}
