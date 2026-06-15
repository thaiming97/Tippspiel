import type { Scope } from "@/lib/types";

/** Auswahlkasten „Tipp-Umfang": nur Gruppe E oder alle Spiele. */
export function ScopePicker({ defaultValue = "group_e" }: { defaultValue?: Scope }) {
  return (
    <fieldset className="space-y-2">
      <legend className="label">Wofür möchtest du tippen?</legend>
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-300 p-3 hover:bg-gray-50">
        <input
          type="radio"
          name="scope"
          value="group_e"
          defaultChecked={defaultValue === "group_e"}
          className="mt-1"
        />
        <span>
          <span className="block font-medium">Nur Gruppe E (1€)</span>
          <span className="block text-xs text-gray-500">
            Tippe die 6 Spiele der Gruppe E – Wertung im Gruppe-E-Pool.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-300 p-3 hover:bg-gray-50">
        <input
          type="radio"
          name="scope"
          value="all"
          defaultChecked={defaultValue === "all"}
          className="mt-1"
        />
        <span>
          <span className="block font-medium">Alle Spiele</span>
          <span className="block text-xs text-gray-500">
            Tippe das ganze Turnier – zusätzliche Gesamtwertung über alle Spiele.
          </span>
        </span>
      </label>
    </fieldset>
  );
}
