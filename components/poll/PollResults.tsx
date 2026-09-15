import {
  choiceShorts,
  dayMonth,
  formatDateLong,
  rankDates,
  tallyChoices,
  tallyDates,
  weekdayShort,
} from "@/lib/polls";
import type { PollDoc, ResponseDoc, Vote } from "@/lib/types";
import { DeleteResponseForm } from "./DeleteResponseForm";

/** Darstellung einer einzelnen Zelle der Übersicht. */
const CELL: Record<Vote, { className: string; icon: string; title: string }> = {
  yes: {
    className: "bg-xmas-pine/12 text-xmas-pine font-bold",
    icon: "✓",
    title: "passt",
  },
  maybe: {
    className: "bg-xmas-gold/20 text-xmas-pine-dark font-bold",
    icon: "~",
    title: "geht, wenn nötig",
  },
  no: { className: "text-ink/25", icon: "–", title: "passt nicht" },
};

function Bar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.07]">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }}
      />
    </div>
  );
}

/**
 * Auswertung einer Umfrage: beste Termine, Auswahl-Wahl und die vollständige
 * Übersicht aller Antworten (Doodle-Stil).
 *
 * Reine Server-Komponente. Mit `admin` erscheint je Zeile ein Löschen-Knopf.
 */
export function PollResults({
  poll,
  responses,
  admin = false,
}: {
  poll: PollDoc;
  responses: ResponseDoc[];
  admin?: boolean;
}) {
  const finalDate = poll.finalDate;
  const dates = poll.dates;
  const tallies = tallyDates(dates, responses);
  const byDate = new Map(tallies.map((t) => [t.date, t]));
  const ranked = rankDates(tallies);
  const best = ranked[0];
  const choices = tallyChoices(poll.choices, responses);
  const shorts = choiceShorts(poll.choices);
  const comments = responses.filter((r) => r.comment);
  // Wer komplett abgesagt hat, kann keine Option wählen – sonst wäre der
  // Nenner der Auswahl-Balken zu groß.
  const attending = responses.filter((r) => !r.declined).length;

  if (responses.length === 0) {
    return (
      <div className="card border-dashed border-ink/15 bg-white/70 text-center">
        <div className="mb-2 text-3xl" aria-hidden>
          🕯️
        </div>
        <p className="font-semibold">Noch keine Antworten.</p>
        <p className="text-sm text-ink-soft">
          Sei der Erste – oder teile den Link mit der Runde.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* --- Bester Termin + Restaurant-Favorit --- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card border-ink/[0.06]">
          <div className="eyebrow mb-3">Beste Termine</div>
          <ul className="space-y-3">
            {ranked.slice(0, 3).map((t, i) => (
              <li key={t.date}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    {i === 0 && <span aria-hidden>🏆</span>}
                    {formatDateLong(t.date)}
                    {finalDate === t.date && (
                      <span className="chip bg-ff-orange/10 text-ff-orange">
                        gesetzt
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap text-sm font-bold text-xmas-pine">
                    {t.yes}
                    {t.maybe > 0 && (
                      <span className="font-medium text-ink-soft">
                        {" "}
                        +{t.maybe} wenn nötig
                      </span>
                    )}
                  </span>
                </div>
                <Bar
                  value={t.score}
                  max={responses.length * 2}
                  tone={i === 0 ? "bg-xmas-pine" : "bg-xmas-pine/45"}
                />
              </li>
            ))}
          </ul>
          {best && best.yes === 0 && (
            <p className="mt-3 text-xs text-ink-soft">
              Bisher nur „wenn nötig"-Stimmen – am besten nochmal nachfragen.
            </p>
          )}
        </div>

        {poll.choices.length > 0 && (
        <div className="card border-ink/[0.06]">
          <div className="eyebrow mb-3">{poll.choicesTitle}</div>
          <ul className="space-y-3">
            {choices.map((r, i) => {
              const info = r.choice;
              return (
                <li key={info.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {i === 0 && r.votes > 0 && <span aria-hidden>🏅</span>}
                      {info.name}{" "}
                      <span className="text-sm font-normal text-ink-soft">
                        {info.hint}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-sm font-bold text-ff-orange">
                      {r.votes}
                      <span className="font-medium text-ink-soft">
                        {" "}
                        / {attending}
                      </span>
                    </span>
                  </div>
                  <Bar
                    value={r.votes}
                    max={attending}
                    tone={i === 0 && r.votes > 0 ? "bg-ff-orange" : "bg-ff-orange/45"}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        )}
      </div>

      {/* --- Vollständige Übersicht --- */}
      <div className="card overflow-hidden border-ink/[0.06] p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/[0.06] px-5 py-4">
          <div className="eyebrow">
            Alle Antworten ({responses.length})
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
            <span>
              <span className="font-bold text-xmas-pine">✓</span> passt
            </span>
            <span>
              <span className="font-bold text-xmas-gold">~</span> wenn nötig
            </span>
            <span>
              <span className="font-bold text-ink/30">–</span> passt nicht
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink/[0.03]">
                <th className="sticky left-0 z-10 bg-ff-cream px-4 py-2.5 text-left font-semibold">
                  Name
                </th>
                {dates.map((date) => (
                  <th
                    key={date}
                    className={`whitespace-nowrap px-1.5 py-2.5 text-center text-xs font-semibold ${
                      finalDate === date ? "bg-ff-orange/10 text-ff-orange" : ""
                    }`}
                  >
                    <span className="block text-ink-soft">
                      {weekdayShort(date)}
                    </span>
                    <span className="block">{dayMonth(date)}</span>
                  </th>
                ))}
                {poll.choices.length > 0 && (
                  <th className="whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold">
                    Auswahl
                  </th>
                )}

              </tr>
              <tr className="border-b border-ink/[0.08] bg-ink/[0.03] text-xs">
                <td className="sticky left-0 z-10 bg-ff-cream px-4 pb-2 text-ink-soft">
                  Summe
                </td>
                {dates.map((date) => {
                  const t = byDate.get(date)!;
                  return (
                    <td
                      key={date}
                      className={`px-1.5 pb-2 text-center ${
                        finalDate === date ? "bg-ff-orange/10" : ""
                      }`}
                    >
                      <span className="font-bold text-xmas-pine">{t.yes}</span>
                      {t.maybe > 0 && (
                        <span className="text-ink-soft"> +{t.maybe}</span>
                      )}
                    </td>
                  );
                })}
                <td />
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink/[0.05] last:border-0 hover:bg-ink/[0.02]"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[170px] bg-white px-3.5 py-2.5 text-left font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{r.name}</span>
                      {r.declined && (
                        <span className="chip flex-none bg-ff-orange/10 text-ff-orange">
                          Absage
                        </span>
                      )}
                      {admin && (
                        <DeleteResponseForm
                          slug={poll.id}
                          id={r.id}
                          name={r.name}
                        />
                      )}
                    </span>
                    {r.comment && (
                      <span
                        title={r.comment}
                        className="block truncate text-xs font-normal text-ink-soft"
                      >
                        💬 {r.comment}
                      </span>
                    )}
                  </th>
                  {dates.map((date) => {
                    const cell = CELL[r.dates[date] ?? "no"];
                    return (
                      <td
                        key={date}
                        title={cell.title}
                        className={`px-1.5 py-2.5 text-center ${cell.className} ${
                          finalDate === date ? "ring-1 ring-inset ring-ff-orange/25" : ""
                        }`}
                      >
                        {cell.icon}
                      </td>
                    );
                  })}
                  {poll.choices.length > 0 && (
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1">
                        {poll.choices.map((option) => {
                          const on = r.choices.includes(option.id);
                          return (
                            <span
                              key={option.id}
                              title={`${option.name} ${option.hint}${on ? "" : " – nicht gewählt"}`}
                              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                                on
                                  ? "bg-ff-orange/15 text-ff-orange"
                                  : "bg-ink/[0.05] text-ink/25"
                              }`}
                            >
                              {shorts[option.id]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {poll.choices.length > 0 && (
          <div className="border-t border-ink/[0.06] px-5 py-3 text-xs text-ink-soft">
            Kürzel:{" "}
            {poll.choices
              .map((c) => `${shorts[c.id]} = ${c.name}${c.hint ? ` ${c.hint}` : ""}`)
              .join(" · ")}
          </div>
        )}
      </div>

      {/* --- Anmerkungen --- */}
      {comments.length > 0 && (
        <div className="card border-ink/[0.06]">
          <div className="eyebrow mb-3">Anmerkungen</div>
          <ul className="space-y-2 text-sm">
            {comments.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="font-semibold">{r.name}:</span>
                <span className="text-ink-soft">{r.comment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
