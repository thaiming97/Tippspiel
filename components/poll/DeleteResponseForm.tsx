"use client";

import { deleteResponseAction } from "@/app/actions/polls";

/**
 * Löscht eine Antwort im Admin-Bereich – mit Rückfrage, damit nicht
 * versehentlich die Antwort eines Kollegen verschwindet.
 */
export function DeleteResponseForm({
  slug,
  id,
  name,
}: {
  slug: string;
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteResponseAction}
      onSubmit={(e) => {
        if (!confirm(`Antwort von "${name}" wirklich löschen?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={id} />
      <button
        className="grid h-5 w-5 place-items-center rounded-full text-xs font-bold text-ink/30 transition hover:bg-red-50 hover:text-red-700"
        title={`Antwort von ${name} löschen`}
        aria-label={`Antwort von ${name} löschen`}
      >
        ×
      </button>
    </form>
  );
}
