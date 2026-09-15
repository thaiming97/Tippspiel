import Link from "next/link";
import { dateRangeLabel, formatDateLong } from "@/lib/polls";
import { listPolls } from "@/lib/pollStore";

export const dynamic = "force-dynamic";

/** Öffentliche Startseite: was läuft gerade an Umfragen. */
export default async function StartPage() {
  const all = await listPolls();
  const open = all.filter((p) => p.poll.open);
  const done = all.filter((p) => !p.poll.open);

  return (
    <div className="space-y-7">
      <header className="animate-rise text-center">
        {/* Das Logo bringt seinen eigenen cremefarbenen Rahmen mit und sitzt
            deshalb direkt auf dem Papier – wie aufgemalt. */}
        <img
          src="/ff-entertainment.jpg"
          alt="FF Entertainment – Feli &amp; Felix · Essen &amp; Ausflüge"
          width={1174}
          height={602}
          className="mx-auto mb-6 h-auto w-full max-w-[360px]"
        />
        <div className="eyebrow justify-center">Feli &amp; Felix</div>
        <h1 className="mt-2.5 font-display text-3xl font-extrabold leading-tight tracking-tight text-ff-navy sm:text-4xl">
          Essen &amp; Ausflüge{" "}
          <span className="block text-ff-orange sm:inline">gemeinsam planen</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
          Termin aussuchen, Ziel ankreuzen, fertig. Ohne Konto, ohne E-Mail,
          ohne Abo.
        </p>
      </header>

      {open.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Läuft gerade</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {open.map(({ poll, count }) => (
              <Link
                key={poll.id}
                href={`/umfrage/${poll.id}`}
                className="card group border-ink/[0.06] hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-extrabold leading-tight text-ff-navy">
                    {poll.theme === "weihnachten" && (
                      <span className="mr-1" aria-hidden>
                        🎄
                      </span>
                    )}
                    {poll.title}
                  </h3>
                  <span className="mt-0.5 flex-none text-ff-orange transition group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {dateRangeLabel(poll.dates)} · {poll.dates.length}{" "}
                  {poll.dates.length === 1 ? "Termin" : "Termine"}
                  {poll.choices.length > 0 && ` · ${poll.choices.length} zur Auswahl`}
                </p>
                {/* Zahlen nur, wenn der Stand öffentlich sichtbar ist –
                    sonst verrät die Startseite, was die Umfrage verbirgt. */}
                <p className="mt-3 text-xs font-semibold text-ff-navy">
                  {!poll.showResults
                    ? "Jetzt abstimmen"
                    : count === 0
                      ? "Noch keine Antwort – sei der Erste"
                      : `${count} ${count === 1 ? "Antwort" : "Antworten"}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {open.length === 0 && (
        <section className="card border-dashed border-ink/15 bg-white/70 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            🗓️
          </div>
          <p className="font-semibold">Gerade läuft keine Umfrage.</p>
          <p className="text-sm text-ink-soft">
            Sobald etwas geplant wird, steht es hier.
          </p>
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Abgeschlossen</h2>
          <ul className="card divide-y divide-ink/[0.06] border-ink/[0.06] p-0">
            {done.map(({ poll, count }) => (
              <li key={poll.id}>
                <Link
                  href={`/umfrage/${poll.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5 transition hover:bg-ink/[0.02]"
                >
                  <span className="font-semibold text-ff-navy">{poll.title}</span>
                  <span className="text-sm text-ink-soft">
                    {poll.finalDate
                      ? formatDateLong(poll.finalDate)
                      : poll.showResults
                        ? `${count} ${count === 1 ? "Antwort" : "Antworten"}`
                        : "abgeschlossen"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
