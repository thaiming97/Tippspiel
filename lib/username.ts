/**
 * Vorgabe-Startpasswort für angelegte oder zurückgesetzte Konten. Muss beim
 * ersten Login geändert werden; steht auch im Einladungstext beim Teilen.
 */
export const START_PASSWORD = "start123";

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
