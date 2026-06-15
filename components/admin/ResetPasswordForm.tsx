"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction } from "@/app/actions/admin";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction] = useFormState(resetPasswordAction, undefined);
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <button className="btn-ghost py-1 text-xs">Passwort zurücksetzen</button>
      {state?.password && (
        <span className="ml-2 text-xs text-green-700">
          neu:{" "}
          <code className="rounded bg-gray-100 px-1 font-mono">
            {state.password}
          </code>
        </span>
      )}
    </form>
  );
}
