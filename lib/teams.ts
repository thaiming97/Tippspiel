/**
 * Übersetzung der Team-Namen von football-data.org (englisch) auf die
 * deutschen Namen, die im Tippspiel verwendet werden. So docken automatisch
 * gezogene Ergebnisse an die bereits angelegten Spiele an.
 */

/** Normalisiert einen Team-Namen zu einem Vergleichsschlüssel. */
export function teamKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Akzente entfernen
    .replace(/[^a-z0-9]/g, ""); // alles außer Buchstaben/Ziffern raus
}

// Schlüssel = normalisierter englischer Name (mehrere Varianten erlaubt).
const ALIASES: Record<string, string> = {
  // --- Gruppe E ---
  germany: "Deutschland",
  curacao: "Curaçao",
  ivorycoast: "Elfenbeinküste",
  cotedivoire: "Elfenbeinküste",
  ecuador: "Ecuador",

  // --- weitere geseedete Spiele ---
  sweden: "Schweden",
  tunisia: "Tunesien",
  spain: "Spanien",
  capeverde: "Kap Verde",
  belgium: "Belgien",
  egypt: "Ägypten",
  iran: "Iran",
  iriran: "Iran",
  newzealand: "Neuseeland",
  france: "Frankreich",
  senegal: "Senegal",
  iraq: "Irak",
  norway: "Norwegen",
  argentina: "Argentinien",
  algeria: "Algerien",
  austria: "Österreich",
  jordan: "Jordanien",
  portugal: "Portugal",
  drcongo: "DR Kongo",
  congodr: "DR Kongo",
  democraticrepublicofthecongo: "DR Kongo",
  england: "England",
  croatia: "Kroatien",
  ghana: "Ghana",
  panama: "Panama",
  uzbekistan: "Usbekistan",
  colombia: "Kolumbien",

  // --- breitere Abdeckung für den Modus „alle Spiele" ---
  brazil: "Brasilien",
  netherlands: "Niederlande",
  unitedstates: "USA",
  usa: "USA",
  mexico: "Mexiko",
  canada: "Kanada",
  japan: "Japan",
  southkorea: "Südkorea",
  korearepublic: "Südkorea",
  australia: "Australien",
  morocco: "Marokko",
  switzerland: "Schweiz",
  denmark: "Dänemark",
  italy: "Italien",
  poland: "Polen",
  scotland: "Schottland",
  wales: "Wales",
  saudiarabia: "Saudi-Arabien",
  uruguay: "Uruguay",
  qatar: "Katar",
  southafrica: "Südafrika",
  nigeria: "Nigeria",
  cameroon: "Kamerun",
  paraguay: "Paraguay",
  peru: "Peru",
  chile: "Chile",
  turkey: "Türkei",
  turkiye: "Türkei",
  greece: "Griechenland",
  serbia: "Serbien",
  ukraine: "Ukraine",
  czechrepublic: "Tschechien",
  czechia: "Tschechien",
  hungary: "Ungarn",
  romania: "Rumänien",
  portugalrepublic: "Portugal",
  haiti: "Haiti",
  jamaica: "Jamaika",
  newcaledonia: "Neukaledonien",
  capeverdeislands: "Kap Verde",
};

/** Übersetzt einen englischen Team-Namen ins Deutsche (Fallback: Original). */
export function translateTeam(name: string): string {
  return ALIASES[teamKey(name)] ?? name;
}

/** Reihenfolge-unabhängiger Schlüssel für eine Paarung. */
export function pairKey(a: string, b: string): string {
  return [teamKey(a), teamKey(b)].sort().join("|");
}
