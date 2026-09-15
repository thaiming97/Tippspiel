import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PollForm, type ResponseDraft } from "@/components/poll/PollForm";
import { PollResults } from "@/components/poll/PollResults";
import { Snowflakes } from "@/components/poll/Snowflakes";
import { choiceById, choiceLabel, formatDateLong } from "@/lib/polls";
import { getPoll, getResponses } from "@/lib/pollStore";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const poll = await getPoll(params.slug);
  if (!poll) return { title: "Umfrage nicht gefunden · FF Entertainment" };
  return {
    title: `${poll.title} · FF Entertainment`,
    description:
      poll.description || "Termin abstimmen – ohne Anmeldung, ohne Konto.",
    openGraph: {
      title: poll.title,
      description: poll.description || "Wann kannst du? Jetzt abstimmen.",
      images: ["/ff-entertainment.jpg"],
    },
  };
}

export default async function PollPage({ params }: { params: { slug: string } }) {
  const poll = await getPoll(params.slug);
  if (!poll) notFound();

  const responses = await getResponses(poll.id);
  const festive = poll.theme === "weihnachten";
  const finalChoice = choiceById(poll, poll.finalChoice);

  // Vorbelegung des Formulars: nur, wenn die Antworten ohnehin sichtbar sind.
  const existing: Record<string, ResponseDraft> = {};
  if (poll.showResults) {
    for (const r of responses) {
      existing[r.id] = {
        name: r.name,
        dates: r.dates,
        choices: r.choices,
        comment: r.comment,
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* --- Kopf --- */}
      <header className="relative animate-rise overflow-hidden rounded-[2rem] border border-ff-navy/10 bg-white p-6 shadow-card sm:p-8">
        {festive && <Snowflakes />}
        <div className="eyebrow">Umfrage</div>
        <h1 className="mt-2.5 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-ff-navy sm:text-4xl">
          {poll.title}
          {festive && (
            <span className="ml-2 inline-block align-middle text-2xl" aria-hidden>
              🎄
            </span>
          )}
        </h1>
        {poll.description && (
          <p className="mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
            {poll.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-ff-navy">
          <span className="rounded-full bg-ff-cream px-3 py-1.5 ring-1 ring-ff-navy/10">
            🗓️ {poll.dates.length} {poll.dates.length === 1 ? "Termin" : "Termine"}
          </span>
          {poll.choices.length > 0 && (
            <span className="rounded-full bg-ff-cream px-3 py-1.5 ring-1 ring-ff-navy/10">
              📍 {poll.choices.length} zur Auswahl
            </span>
          )}
          <span className="rounded-full bg-ff-cream px-3 py-1.5 ring-1 ring-ff-navy/10">
            🔓 Ohne Anmeldung
          </span>
          {responses.length > 0 && (
            <span className="rounded-full bg-ff-navy px-3 py-1.5 text-white">
              👥 {responses.length}{" "}
              {responses.length === 1 ? "Antwort" : "Antworten"}
            </span>
          )}
        </div>
      </header>

      {/* --- Ergebnis steht fest --- */}
      {poll.finalDate && (
        <section className="animate-rise overflow-hidden rounded-[2rem] bg-ff-navy-gradient p-6 text-white shadow-card-hover sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-white/25">
            🔔 Es ist entschieden
          </span>
          <p className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            {formatDateLong(poll.finalDate)}
          </p>
          {finalChoice && (
            <p className="mt-1.5 text-lg font-semibold text-ff-yellow">
              📍 {choiceLabel(finalChoice)}
            </p>
          )}
          {poll.note && <p className="mt-3 text-sm text-white/85">{poll.note}</p>}
        </section>
      )}

      {/* --- Abstimmung --- */}
      {poll.open ? (
        <PollForm poll={poll} existing={existing} />
      ) : (
        <section className="card border-xmas-gold/50 bg-xmas-gold/[0.10]">
          <h2 className="font-display text-lg font-extrabold text-ff-navy">
            🔒 Diese Umfrage ist geschlossen
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {poll.note ||
              "Danke an alle, die abgestimmt haben. Bei Fragen melde dich beim Organisator."}
          </p>
        </section>
      )}

      {/* --- Auswertung --- */}
      {poll.showResults && (
        <section className="space-y-4">
          <h2 className="eyebrow">Aktueller Stand</h2>
          <PollResults poll={poll} responses={responses} />
        </section>
      )}
    </div>
  );
}
