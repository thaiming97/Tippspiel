import Link from "next/link";
import { CopyLinkButton } from "@/components/poll/CopyLinkButton";
import { seedWeihnachtsessenAction } from "@/app/actions/polls";
import { WEIHNACHTSESSEN, dateRangeLabel, dayMonth } from "@/lib/polls";
import { listPolls } from "@/lib/pollStore";

export const dynamic = "force-dynamic";

/** Übersicht aller Umfragen für die Organisatoren. */
export default async function AdminHome() {
  const polls = await listPolls();
  // Vorlage nur anbieten, solange es die Umfrage noch nicht gibt.
  const showTemplate = !polls.some(({ poll }) => poll.id === WEIHNACHTSESSEN.slug);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ff-navy">
            Umfragen
          </h1>
          <p className="text-sm text-ink-soft">
            Anlegen, auswerten, Termin festlegen, Link teilen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className="btn-ghost">
            Organisatoren
          </Link>
          <Link
            href="/admin/umfragen/neu"
            className="inline-flex items-center justify-center rounded-full bg-ff-orange-gradient px-5 py-2.5 text-sm font-bold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            + Neue Umfrage
          </Link>
        </div>
      </header>

      {showTemplate && (
        <form
          action={seedWeihnachtsessenAction}
          className="rounded-[2rem] border border-ff-orange/25 bg-ff-orange/[0.05] p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-extrabold text-ff-navy">
                🎄 {WEIHNACHTSESSEN.title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Fertige Vorlage: {WEIHNACHTSESSEN.dates.length} Termine (jeden
                Do und Fr von {dayMonth(WEIHNACHTSESSEN.dates[0])} bis{" "}
                {dayMonth(
                  WEIHNACHTSESSEN.dates[WEIHNACHTSESSEN.dates.length - 1],
                )}
                ),{" "}
                {WEIHNACHTSESSEN.choices.map((c) => c.name).join(", ")} –
                weihnachtliche Optik. Frühere Antworten werden übernommen.
              </p>
            </div>
            <button className="inline-flex flex-none items-center justify-center rounded-full bg-ff-orange-gradient px-5 py-2.5 text-sm font-bold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
              Jetzt anlegen
            </button>
          </div>
        </form>
      )}

      {polls.length === 0 ? (
        <div className="card border-dashed border-ink/15 bg-white/70 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            📝
          </div>
          <p className="font-semibold">Noch keine Umfrage angelegt.</p>
          <p className="mb-4 text-sm text-ink-soft">
            Lege die erste an – Termine und Auswahl bestimmst du selbst.
          </p>
          <Link href="/admin/umfragen/neu" className="btn-ghost">
            + Neue Umfrage
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map(({ poll, count }) => (
              <div key={poll.id} className="card border-ink/[0.06]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/umfragen/${poll.id}`}
                        className="font-display text-lg font-extrabold text-ff-navy hover:text-ff-orange"
                      >
                        {poll.theme === "weihnachten" && (
                          <span className="mr-1" aria-hidden>
                            🎄
                          </span>
                        )}
                        {poll.title}
                      </Link>
                      {poll.open ? (
                        <span className="chip bg-xmas-pine/10 text-xmas-pine">
                          offen
                        </span>
                      ) : (
                        <span className="chip bg-ink/[0.06] text-ink-soft">
                          geschlossen
                        </span>
                      )}
                      {poll.finalDate && (
                        <span className="chip bg-ff-orange/10 text-ff-orange">
                          Termin steht
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {dateRangeLabel(poll.dates)} · {poll.dates.length}{" "}
                      {poll.dates.length === 1 ? "Termin" : "Termine"} ·{" "}
                      {count} {count === 1 ? "Antwort" : "Antworten"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink/40">
                      /umfrage/{poll.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyLinkButton path={`/umfrage/${poll.id}`} />
                    <Link
                      href={`/admin/umfragen/${poll.id}`}
                      className="btn-ghost whitespace-nowrap"
                    >
                      Verwalten
                    </Link>
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
