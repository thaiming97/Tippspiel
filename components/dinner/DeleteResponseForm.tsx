"use client";

import { deleteDinnerResponseAction } from "@/app/actions/dinner";

/**
 * Löscht eine Antwort im Admin-Bereich – mit Rückfrage, damit nicht versehent-
 * lich die Antwort eines Kollegen verschwindet.
 */
export function DeleteResponseForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteDinnerResponseAction}
      onSubmit={(e) => {
        if (!confirm(`Antwort von "${name}" wirklich löschen?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="rounded-full px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-red-50 hover:text-red-700"
        title={`Antwort von ${name} löschen`}
      >
        Löschen
      </button>
    </form>
  );
}
