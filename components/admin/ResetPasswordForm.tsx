"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction } from "@/app/actions/admin";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction] = useFormState(resetPasswordAction, undefined);
  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="startPassword"
        className="w-28 rounded-lg border border-ink/[0.12] bg-white px-2 py-1 text-xs"
        placeholder="start123"
        aria-label="Neues Startpasswort (leer = start123)"
      />
      <button className="btn-ghost py-1 text-xs">Passwort zurücksetzen</button>
      {state?.password && (
        <span className="ml-2 text-xs text-green-700">
          neu:{" "}
          <code className="rounded bg-ink/[0.06] px-1 font-mono">
            {state.password}
          </code>
        </span>
      )}
    </form>
  );
}
