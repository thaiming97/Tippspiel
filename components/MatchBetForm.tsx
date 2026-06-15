"use client";

import { useFormState, useFormStatus } from "react-dom";
import { placeBetAction } from "@/app/actions/bets";

function SaveButton({ hasBet }: { hasBet: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn px-3 py-1.5" disabled={pending}>
      {pending ? "…" : hasBet ? "Ändern" : "Tipp speichern"}
    </button>
  );
}

export function MatchBetForm({
  matchId,
  defaultHome,
  defaultAway,
  hasBet = false,
}: {
  matchId: string;
  defaultHome?: number;
  defaultAway?: number;
  /** true, wenn für dieses Spiel bereits ein Tipp gespeichert ist. */
  hasBet?: boolean;
}) {
  const [state, formAction] = useFormState(placeBetAction, undefined);

  // Nach erfolgreichem Speichern, oder wenn beim Laden schon ein Tipp da war,
  // klar kennzeichnen, dass der Tipp gespeichert ist.
  const saved = state?.ok ? true : hasBet;

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
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
      <SaveButton hasBet={hasBet} />
      {state?.error ? (
        <span className="w-full text-right text-xs text-red-600 sm:w-auto">
          {state.error}
        </span>
      ) : saved ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
          ✓ gespeichert
        </span>
      ) : null}
    </form>
  );
}
