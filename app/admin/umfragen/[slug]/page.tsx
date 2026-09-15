import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { notFound } from "next/navigation";
import { CopyLinkButton } from "@/components/poll/CopyLinkButton";
import { DeletePollForm } from "@/components/poll/DeletePollForm";
import { PollEditor } from "@/components/poll/PollEditor";
import { PollResults } from "@/components/poll/PollResults";
import { PollSettingsForm } from "@/components/poll/PollSettingsForm";
import {
  choiceById,
  choiceLabel,
  formatDateLong,
  rankDates,
  tallyChoices,
  tallyDates,
} from "@/lib/polls";
import { getPoll, getResponses } from "@/lib/pollStore";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card border-ink/[0.06]">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-0.5 font-display text-xl font-extrabold leading-tight text-ff-navy">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-ink-soft">{hint}</div>}
    </div>
  );
}

export default async function AdminPollPage({
  params,
}: {
  params: { slug: string };
}) {
  // Nicht nur auf die Middleware verlassen (siehe requireAdminPage).
  await requireAdminPage();

  const poll = await getPoll(params.slug);
  if (!poll) notFound();

  const responses = await getResponses(poll.id);
  const declined = responses.filter((r) => r.declined).length;
  const best = rankDates(tallyDates(poll.dates, responses))[0];
  const topChoice = tallyChoices(poll.choices, responses)[0];
  const finalChoice = choiceById(poll, poll.finalChoice);

  return (
    <div className="space-y-6">
      {/* --- Kopf --- */}
      <header className="space-y-3">
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
          ← Übersicht
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ff-navy">
              {poll.theme === "weihnachten" && <span aria-hidden>🎄 </span>}
              {poll.title}
            </h1>
            <p className="font-mono text-xs text-ink/40">/umfrage/{poll.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton path={`/umfrage/${poll.id}`} />
            <Link
              href={`/umfrage/${poll.id}`}
              className="btn-ghost"
              target="_blank"
            >
              Seite ansehen ↗
            </Link>
          </div>
        </div>
      </header>

      {/* --- Kennzahlen --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Antworten"
          value={String(responses.length)}
          hint={
            responses.length === 0
              ? "Link noch teilen"
              : declined > 0
                ? `davon ${declined} ${declined === 1 ? "Absage" : "Absagen"}`
                : "Teilnehmer"
          }
        />
        <Stat
          label="Bester Termin"
          value={best && best.score > 0 ? formatDateLong(best.date) : "—"}
          hint={
            best && best.score > 0
              ? `${best.yes}× ja${best.maybe > 0 ? `, ${best.maybe}× wenn nötig` : ""}`
              : "noch keine Stimmen"
          }
        />
        <Stat
          label="Auswahl vorn"
          value={topChoice && topChoice.votes > 0 ? topChoice.choice.name : "—"}
          hint={
            topChoice && topChoice.votes > 0
              ? `${topChoice.choice.hint} · ${topChoice.votes} von ${responses.length}`
              : poll.choices.length === 0
                ? "keine Auswahl in dieser Umfrage"
                : "noch keine Stimmen"
          }
        />
        <Stat
          label="Status"
          value={poll.open ? "Offen" : "Geschlossen"}
          hint={
            poll.finalDate
              ? `Termin: ${formatDateLong(poll.finalDate)}${
                  finalChoice ? ` · ${choiceLabel(finalChoice)}` : ""
                }`
              : poll.showResults
                ? "Stand ist öffentlich sichtbar"
                : "Stand nur für Organisatoren"
          }
        />
      </div>

      {/* --- Steuerung --- */}
      <PollSettingsForm poll={poll} />

      {/* --- Auswertung --- */}
      <section className="space-y-4">
        <h2 className="eyebrow">Auswertung</h2>
        <PollResults poll={poll} responses={responses} admin />
      </section>

      {/* --- Bearbeiten --- */}
      <details className="card border-ink/[0.06]">
        <summary className="cursor-pointer font-display text-lg font-extrabold text-ff-navy">
          Termine &amp; Auswahl bearbeiten
        </summary>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Entfernst du einen Termin, verschwindet er auch aus den Antworten der
          Übersicht. Bereits abgegebene Stimmen zu anderen Terminen bleiben.
        </p>
        <PollEditor poll={poll} />
      </details>

      {/* --- Löschen --- */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-red-100 bg-red-50/40 px-5 py-4">
        <div>
          <p className="font-semibold text-red-800">Umfrage löschen</p>
          <p className="text-sm text-red-700/80">
            Entfernt die Umfrage samt allen {responses.length} Antworten
            endgültig.
          </p>
        </div>
        <DeletePollForm slug={poll.id} title={poll.title} />
      </section>
    </div>
  );
}
