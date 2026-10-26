"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createGroupAction, updateGroupAction } from "@/app/actions/admin";
import type { GroupDoc } from "@/lib/types";

/** Ein Konto zur Auswahl als Gruppenmitglied. */
export interface MemberOption {
  id: string;
  name: string;
}

function Btn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? "Speichern…" : label}
    </button>
  );
}

/**
 * Name und Mitglieder einer Gruppe – ohne `group` legt das Formular eine
 * neue an.
 */
export function GroupForm({
  group,
  users,
}: {
  group?: GroupDoc;
  users: MemberOption[];
}) {
  const [state, formAction] = useFormState(
    group ? updateGroupAction : createGroupAction,
    undefined,
  );

  return (
    // Neue Gruppe: Formular nach dem Anlegen leeren (key wechselt mit „ok").
    <form key={group ? group.id : state?.ok} action={formAction} className="space-y-3">
      {group && <input type="hidden" name="groupId" value={group.id} />}
      <div>
        <label className="label" htmlFor={`name-${group?.id ?? "neu"}`}>
          Name der Gruppe
        </label>
        <input
          id={`name-${group?.id ?? "neu"}`}
          name="name"
          className="input"
          maxLength={40}
          placeholder="z.B. Abteilung, Familie, Laufgruppe"
          defaultValue={group?.name ?? ""}
          required
        />
      </div>
      <div>
        <span className="label">Mitglieder</span>
        {users.length === 0 ? (
          <p className="text-sm text-ink-soft">Noch keine Konten.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <label
                key={u.id}
                className="inline-flex cursor-pointer items-center rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold ring-1 ring-ink/10 transition hover:ring-ink/25 has-[:checked]:bg-ff-navy has-[:checked]:text-white has-[:checked]:ring-ff-navy"
              >
                <input
                  type="checkbox"
                  name="memberId"
                  value={u.id}
                  defaultChecked={group?.memberIds.includes(u.id)}
                  className="sr-only"
                />
                {u.name}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Btn label={group ? "Gruppe speichern" : "Gruppe anlegen"} />
        {state?.ok && (
          <span className="text-sm font-medium text-xmas-pine">{state.ok}</span>
        )}
        {state?.error && (
          <span className="text-sm font-medium text-red-700">{state.error}</span>
        )}
      </div>
    </form>
  );
}
