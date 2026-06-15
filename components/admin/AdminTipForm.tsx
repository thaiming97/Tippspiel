"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminSetTipAction } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn px-3 py-1.5" disabled={pending}>
      {pending ? "…" : "Speichern"}
    </button>
  );
}

export function AdminTipForm({
  userId,
  matchId,
  defaultHome,
  defaultAway,
}: {
  userId: string;
  matchId: string;
  defaultHome?: number | null;
  defaultAway?: number | null;
}) {
  const [state, formAction] = useFormState(adminSetTipAction, undefined);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="matchId" value={matchId} />
      <input
        name="homeScore"
        type="number"
        min={0}
        max={99}
        defaultValue={defaultHome ?? undefined}
        className="input w-14 text-center"
        required
      />
      <span className="text-gray-400">:</span>
      <input
        name="awayScore"
        type="number"
        min={0}
        max={99}
        defaultValue={defaultAway ?? undefined}
        className="input w-14 text-center"
        required
      />
      <Btn />
      {state?.ok && <span className="text-xs text-green-600">✓</span>}
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
