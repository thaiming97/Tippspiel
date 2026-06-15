"use client";

import { useFormState, useFormStatus } from "react-dom";
import { placeBetAction } from "@/app/actions/bets";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn px-3 py-1.5" disabled={pending}>
      {pending ? "…" : "Tipp speichern"}
    </button>
  );
}

export function MatchBetForm({
  matchId,
  defaultHome,
  defaultAway,
}: {
  matchId: string;
  defaultHome?: number;
  defaultAway?: number;
}) {
  const [state, formAction] = useFormState(placeBetAction, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <input
        name="homeScore"
        type="number"
        min={0}
        max={99}
        defaultValue={defaultHome}
        className="input w-14 text-center"
        aria-label="Tore Heim"
        required
      />
      <span className="text-gray-400">:</span>
      <input
        name="awayScore"
        type="number"
        min={0}
        max={99}
        defaultValue={defaultAway}
        className="input w-14 text-center"
        aria-label="Tore Gast"
        required
      />
      <SaveButton />
      {state?.ok && <span className="text-xs text-green-600">{state.ok} ✓</span>}
      {state?.error && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}
