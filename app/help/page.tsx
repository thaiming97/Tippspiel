import { POINTS } from "@/lib/points";

export const metadata = { title: "Hilfe – WM-Tippspiel" };

/** Ein Beispiel-Tipp für die Erklärungstabelle. */
function Example({
  tip,
  result,
  points,
  why,
}: {
  tip: string;
  result: string;
  points: number;
  why: string;
}) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 font-mono">{tip}</td>
      <td className="px-3 py-2 font-mono">{result}</td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums">
        {points}
      </td>
      <td className="px-3 py-2 text-gray-600">{why}</td>
    </tr>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hilfe & Punktevergabe</h1>
        <p className="text-gray-500">
          So funktioniert das Tippen und wie die Punkte berechnet werden.
        </p>
      </div>

      {/* Punkteregeln */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Wie viele Punkte gibt es?</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between rounded-lg bg-gold/10 px-3 py-2">
            <span>🎯 Exaktes Ergebnis getippt</span>
            <span className="font-bold">{POINTS.exact} Punkte</span>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span>📐 Richtige Tordifferenz (bei Sieg/Niederlage)</span>
            <span className="font-bold">{POINTS.goalDiff} Punkte</span>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span>↗️ Richtige Tendenz (Sieg / Remis / Niederlage)</span>
            <span className="font-bold">{POINTS.tendency} Punkte</span>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span>❌ Tendenz falsch</span>
            <span className="font-bold">0 Punkte</span>
          </li>
        </ul>
        <p className="text-xs text-gray-500">
          Es zählt immer nur die höchste zutreffende Stufe. Die exakte
          Tordifferenz bringt nur bei Sieg/Niederlage Extrapunkte – bei einem
          Remis gibt es ohne exakten Treffer die Tendenz-Punkte.
        </p>
      </section>

      {/* Beispiele */}
      <section className="card space-y-3 p-0">
        <h2 className="px-4 pt-4 text-lg font-semibold">Beispiele</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">Dein Tipp</th>
                <th className="px-3 py-2">Endstand</th>
                <th className="px-3 py-2 text-right">Punkte</th>
                <th className="px-3 py-2">Warum</th>
              </tr>
            </thead>
            <tbody>
              <Example tip="2:1" result="2:1" points={4} why="exakt richtig" />
              <Example
                tip="3:2"
                result="2:1"
                points={3}
                why="Heimsieg + gleiche Tordifferenz (+1)"
              />
              <Example
                tip="3:0"
                result="2:1"
                points={2}
                why="Heimsieg richtig, aber andere Differenz"
              />
              <Example
                tip="0:1"
                result="2:1"
                points={0}
                why="falsche Tendenz (Auswärtssieg getippt)"
              />
              <Example tip="1:1" result="1:1" points={4} why="exakt richtig" />
              <Example
                tip="2:2"
                result="1:1"
                points={2}
                why="Remis richtig (bei Remis keine Differenz-Bonuspunkte)"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Wertungen */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Gruppe E & Gesamtwertung</h2>
        <p className="text-sm text-gray-600">
          Es gibt zwei Ranglisten:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>
            <strong>Nur Gruppe E:</strong> Punkte aus den Gruppe-E-Spielen –
            hier sind <em>alle</em> Teilnehmer dabei.
          </li>
          <li>
            <strong>Alle Spiele:</strong> Punkte aus dem gesamten Turnier – hier
            erscheinst du nur, wenn du in den Einstellungen den Umfang
            „alle Spiele" gewählt hast.
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          Auf der Startseite siehst du deinen Platz in der Gruppe – und, falls du
          alle Spiele tippst, zusätzlich deinen Platz in der Gesamtwertung.
        </p>
      </section>

      {/* Tippen */}
      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Tippen</h2>
        <p className="text-sm text-gray-600">
          Tipps können bis zum Anstoß abgegeben oder geändert werden. Ein
          gespeicherter Tipp wird mit einem grünen{" "}
          <span className="font-medium text-green-700">✓ gespeichert</span>{" "}
          gekennzeichnet – auch nach dem Neuladen der Seite. Nach dem Anstoß ist
          keine Änderung mehr möglich.
        </p>
      </section>
    </div>
  );
}
