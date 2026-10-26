"use client";

import { deleteGroupAction } from "@/app/actions/admin";

/** Löscht eine Gruppe – mit Rückfrage, weil Umfragen daran hängen können. */
export function DeleteGroupForm({
  groupId,
  name,
  pollCount,
}: {
  groupId: string;
  name: string;
  pollCount: number;
}) {
  return (
    <form
      action={deleteGroupAction}
      onSubmit={(e) => {
        const hint =
          pollCount > 0
            ? `\n\n${pollCount} Umfrage${pollCount === 1 ? " ist" : "n sind"} für diese Gruppe freigegeben. Hängt eine nur an dieser Gruppe, sehen sie danach nur noch die Organisatoren.`
            : "";
        if (!confirm(`Gruppe "${name}" löschen?${hint}`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <button className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        Gruppe löschen
      </button>
    </form>
  );
}
