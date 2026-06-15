"use client";

import { useFormState, useFormStatus } from "react-dom";
import { syncAction } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Synchronisiere…" : "Ergebnisse jetzt aus dem Internet holen"}
    </button>
  );
}

export function SyncButton() {
  const [state, formAction] = useFormState(syncAction, undefined);
  return (
    <form action={formAction} className="space-y-2">
      <Btn />
      {state?.ok && <p className="text-sm text-green-600">{state.ok}</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
