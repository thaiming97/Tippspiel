"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { registerAction } from "../actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn w-full" disabled={pending}>
      {pending ? "Anlegen…" : "Konto anlegen"}
    </button>
  );
}

export default function RegistrierenPage() {
  const [state, formAction] = useFormState(registerAction, undefined);
  const weiter = useSearchParams().get("weiter") ?? "/";

  return (
    <div className="mx-auto mt-6 max-w-sm animate-rise sm:mt-12">
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-ff-navy-gradient p-8 text-center text-white shadow-card-hover">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-ff-orange/40 blur-3xl" />
        <h1 className="text-3xl font-extrabold tracking-tight">Mitmachen</h1>
        <p className="mt-2 text-sm text-white/80">
          Konto anlegen, abstimmen – und die eigene Antwort später jederzeit
          ändern.
        </p>
      </div>

      <form action={formAction} className="card space-y-4">
        <input type="hidden" name="weiter" value={weiter} />
        <div>
          <label className="label" htmlFor="name">
            Dein Name
          </label>
          <input
            id="name"
            name="name"
            className="input"
            placeholder="z.B. Felix M."
            maxLength={40}
            autoComplete="name"
            required
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            So erscheinst du in der Übersicht. Mit diesem Namen meldest du dich
            künftig an.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="password">
            Passwort (mind. 8 Zeichen)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Passwort bestätigen
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            className="input"
            autoComplete="new-password"
            required
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton />
      </form>

      <p className="mt-4 text-center text-sm text-ink-soft">
        Schon ein Konto?{" "}
        <Link
          href={`/login?weiter=${encodeURIComponent(weiter)}`}
          className="font-semibold text-ff-navy hover:text-ff-orange"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
