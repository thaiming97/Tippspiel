/**
 * Normalisiert den Anzeigenamen zu einem Login-Namen:
 * klein, getrimmt, Mehrfach-Leerzeichen reduziert, Punkt am Ende entfernt.
 * Beispiele: "Jürgen B." -> "jürgen b",  "Felix" -> "felix".
 */
export function normalizeUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "");
}
