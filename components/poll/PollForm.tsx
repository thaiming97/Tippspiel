"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  MAX_COMMENT_LENGTH,
  formatDate,
  groupByMonth,
} from "@/lib/polls";
import { submitResponseAction } from "@/app/actions/polls";
import type { PollDoc, Vote } from "@/lib/types";

/** Was das Formular zum Vorbelegen braucht (Antwort ohne Zeitstempel). */
export interface ResponseDraft {
  dates: Record<string, Vote>;
  choices: string[];
  declined: boolean;
  comment: string;
}

const OPTIONS: { value: Vote; label: string; icon: string }[] = [
  { value: "yes", label: "Ja", icon: "✓" },
  { value: "maybe", label: "Wenn nötig", icon: "~" },
  { value: "no", label: "Nein", icon: "–" },
];

/** Farbgebung der Termin-Karte je nach Auswahl. */
const CARD_STYLE: Record<Vote, string> = {
  yes: "border-xmas-pine/30 bg-xmas-pine/[0.06]",
  maybe: "border-xmas-gold/50 bg-xmas-gold/[0.10]",
  no: "border-ink/[0.08] bg-white",
};

/** Farbgebung des aktiven Segments. */
const SEGMENT_ACTIVE: Record<Vote, string> = {
  yes: "bg-xmas-pine text-white shadow-card",
  maybe: "bg-xmas-gold text-xmas-pine-dark shadow-card",
  no: "bg-ink/[0.12] text-ink",
};

function SubmitButton({ update, declined }: { update: boolean; declined: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ff-orange-gradient px-6 py-3 text-base font-bold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] disabled:opacity-60 sm:w-auto"
      disabled={pending}
    >
      {pending
        ? "Speichern…"
        : declined
          ? update
            ? "Absage aktualisieren"
            : "Absage abschicken"
          : update
            ? "Antwort aktualisieren"
            : "Antwort abschicken"}
    </button>
  );
}

/**
 * Das Abstimmungs-Formular. Die Antwort hängt am angemeldeten Konto: sie ist
 * beim Öffnen vorbelegt (`mine`) und lässt sich jederzeit ändern – fremde
 * Antworten sind nicht erreichbar.
 */
export function PollForm({
  poll,
  userName,
  mine,
  disabled,
}: {
  poll: PollDoc;
  userName: string;
  mine?: ResponseDraft;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(submitResponseAction, undefined);
  /** Nicht beantwortete Termine bleiben leer – „Nein" ist keine Vorauswahl. */
  const [votes, setVotes] = useState<Record<string, Vote>>(mine?.dates ?? {});
  const [picked, setPicked] = useState<string[]>(mine?.choices ?? []);
  const [comment, setComment] = useState(mine?.comment ?? "");
  /** „bin komplett raus" – kann an keinem Termin. */
  const [declined, setDeclined] = useState(mine?.declined ?? false);
  const editing = Boolean(mine);

  const months = groupByMonth(poll.dates);
  const chosen = poll.dates.filter((d) => votes[d] === "yes" || votes[d] === "maybe");

  function setVote(date: string, vote: Vote) {
    setDeclined(false);
    setVotes((prev) => ({ ...prev, [date]: vote }));
  }

  /** „Kann immer": alle Termine auf Ja. */
  function acceptAll() {
    setDeclined(false);
    setVotes(Object.fromEntries(poll.dates.map((d) => [d, "yes" as Vote])));
  }

  /** „Bin komplett raus": keine Termine, keine Auswahl. */
  function declineAll() {
    setDeclined(true);
    setVotes({});
    setPicked([]);
  }

  function toggleChoice(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (state?.ok) {
    return (
      <div className="card animate-rise border-xmas-pine/20 bg-white text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-xmas-pine/10 text-3xl">
          🎁
        </div>
        <h2 className="text-xl font-extrabold text-xmas-pine">{state.ok}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {state.savedName && (
            <>
              Gespeichert als <strong>{state.savedName}</strong>.{" "}
            </>
          )}
          Du kannst deine Antwort jederzeit ändern – einfach diese Seite
          nochmal öffnen.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-ghost mt-4"
        >
          Antwort ändern
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={poll.id} />

      {/* --- Wer stimmt ab --- */}
      <div className="card flex flex-wrap items-center justify-between gap-2 border-ink/[0.06] py-4">
        <p className="text-sm text-ink-soft">
          Du stimmst ab als{" "}
          <strong className="font-semibold text-ff-navy">{userName}</strong>.
        </p>
        {editing && (
          <span className="chip bg-xmas-pine/10 text-xmas-pine">
            ✏️ Antwort wird bearbeitet
          </span>
        )}
      </div>

      {/* --- Termine --- */}
      <div className="card border-ink/[0.06]">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold text-ff-navy">
            Wann kannst du?
          </h2>
          <span className="chip bg-ff-orange/10 text-ff-orange">
            {declined ? "abgemeldet" : `${chosen.length} von ${poll.dates.length} gewählt`}
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Mehrfachauswahl erwünscht – je mehr Termine, desto leichter finden wir
          einen. <strong>Wenn nötig</strong> heißt: passt nicht super, geht aber,
          wenn es sonst nicht klappt.
        </p>

        {/* Schnellwahl für die beiden häufigsten Fälle. */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptAll}
            disabled={disabled}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              chosen.length === poll.dates.length && !declined
                ? "bg-xmas-pine text-white shadow-card"
                : "bg-white text-xmas-pine ring-1 ring-xmas-pine/25 hover:bg-xmas-pine/[0.06]"
            }`}
          >
            ✓ Kann immer
          </button>
          <button
            type="button"
            onClick={declined ? () => setDeclined(false) : declineAll}
            disabled={disabled}
            aria-pressed={declined}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              declined
                ? "bg-ff-orange text-white shadow-card"
                : "bg-white text-ink-soft ring-1 ring-ink/15 hover:text-ink"
            }`}
          >
            ✗ Bin komplett raus
          </button>
        </div>

        {/* Das Feld sagt dem Server, dass es eine Absage ist. */}
        {declined && <input type="hidden" name="declined" value="on" />}

        {declined ? (
          <div className="rounded-2xl border border-ff-orange/30 bg-ff-orange/[0.06] px-4 py-4">
            <p className="font-semibold text-ff-navy">
              Du bist für alle Termine abgemeldet.
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">
              Dann wissen wir, dass wir nicht auf dich warten müssen. Schick die
              Absage unten ab.
            </p>
          </div>
        ) : (
          months.map((month) => (
          <div key={month.label} className="mb-5 last:mb-0">
            <div className="eyebrow mb-2.5">{month.label}</div>
            <div className="grid gap-2 md:grid-cols-2">
              {month.dates.map((date) => {
                const vote = votes[date];
                return (
                  <div
                    key={date}
                    className={`flex flex-col gap-2.5 rounded-2xl border px-3.5 py-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between ${CARD_STYLE[vote ?? "no"]}`}
                  >
                    <div className="font-semibold">
                      {formatDate(date)}
                      {vote === "yes" && (
                        <span className="ml-1.5 text-xmas-pine" aria-hidden>
                          ✓
                        </span>
                      )}
                    </div>
                    <div
                      role="group"
                      aria-label={`Termin ${formatDate(date)}`}
                      className="grid grid-cols-3 gap-1 rounded-full bg-ink/[0.05] p-1 sm:flex"
                    >
                      {OPTIONS.map((opt) => {
                        const active = vote === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`cursor-pointer select-none whitespace-nowrap rounded-full px-2.5 py-1.5 text-center text-xs font-bold transition-all duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ff-navy/45 ${
                              active
                                ? SEGMENT_ACTIVE[opt.value]
                                : "text-ink-soft hover:bg-white/70 hover:text-ink"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`date_${date}`}
                              value={opt.value}
                              checked={active}
                              onChange={() => setVote(date, opt.value)}
                              disabled={disabled}
                              className="sr-only"
                            />
                            <span aria-hidden className="mr-1">
                              {opt.icon}
                            </span>
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          ))
        )}
      </div>

      {/* --- Auswahl (Restaurants, Ziele, …) --- */}
      {poll.choices.length > 0 && !declined && (
      <div className="card border-ink/[0.06]">
        <h2 className="font-display text-lg font-extrabold text-ff-navy">
          {poll.choicesTitle}
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Kreuze alles an, womit du einverstanden bist – auch mehrere.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {poll.choices.map((r) => {
            const active = picked.includes(r.id);
            return (
              <label
                key={r.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-200 ${
                  active
                    ? "border-ff-orange/45 bg-ff-orange/[0.07] shadow-card"
                    : "border-ink/[0.08] bg-white hover:border-ink/20"
                }`}
              >
                <input
                  type="checkbox"
                  name="choice"
                  value={r.id}
                  checked={active}
                  onChange={() => toggleChoice(r.id)}
                  disabled={disabled}
                  className="mt-0.5 h-5 w-5 flex-none cursor-pointer accent-ff-orange"
                />
                <span>
                  <span className="block font-bold leading-tight">{r.name}</span>
                  {r.hint && (
                    <span className="block text-sm text-ink-soft">{r.hint}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      )}

      {/* --- Anmerkung --- */}
      <div className="card border-ink/[0.06]">
        <label className="label" htmlFor="poll-comment">
          Anmerkung <span className="font-normal text-ink/40">(optional)</span>
        </label>
        <textarea
          id="poll-comment"
          name="comment"
          className="input min-h-[80px] resize-y"
          placeholder="z.B. erst ab 19 Uhr, brauche vegetarisch, komme mit Partner…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          disabled={disabled}
        />
        <div className="mt-1 text-right text-xs text-ink/40">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <SubmitButton update={editing} declined={declined} />
        <p className="text-center text-xs text-ink-soft">
          Nur du kannst deine Antwort ändern.
        </p>
      </div>
    </form>
  );
}
