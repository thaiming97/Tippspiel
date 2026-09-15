"use client";

import { deletePollAction } from "@/app/actions/polls";

/** Löscht eine Umfrage samt Antworten – mit deutlicher Rückfrage. */
export function DeletePollForm({ slug, title }: { slug: string; title: string }) {
  return (
    <form
      action={deletePollAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Umfrage "${title}" samt allen Antworten endgültig löschen?\n\nDas kann nicht rückgängig gemacht werden.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <button className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        Umfrage löschen
      </button>
    </form>
  );
}
