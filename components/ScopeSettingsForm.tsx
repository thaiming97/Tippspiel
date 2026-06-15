"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateScopeAction } from "@/app/actions/settings";
import { ScopePicker } from "./ScopePicker";
import type { Scope } from "@/lib/types";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Speichern…" : "Speichern"}
    </button>
  );
}

export function ScopeSettingsForm({ currentScope }: { currentScope: Scope }) {
  const [state, formAction] = useFormState(updateScopeAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <ScopePicker defaultValue={currentScope} />
      <div className="flex items-center gap-3">
        <Btn />
        {state?.ok && <span className="text-sm text-green-600">{state.ok}</span>}
        {state?.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}
