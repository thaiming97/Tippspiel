import type { Metadata } from "next";
import { Snowflakes } from "@/components/dinner/Snowflakes";
import { DinnerForm, type DinnerDraft } from "@/components/dinner/DinnerForm";
import { DinnerResults } from "@/components/dinner/DinnerResults";
import {
  DINNER_DATES,
  RESTAURANTS,
  formatDinnerDateLong,
  restaurantLabel,
} from "@/lib/dinner";
import { getDinnerResponses, getDinnerSettings } from "@/lib/dinnerStore";

export const metadata: Metadata = {
  title: "Weihnachtsessen · FF Entertainment",
  description:
    "Termin und Restaurant für das Weihnachtsessen der Abteilung abstimmen – ohne Anmeldung.",
  openGraph: {
    title: "Weihnachtsessen der Abteilung",
    description: "Wann kannst du? Termin und Restaurant abstimmen – ohne Anmeldung.",
    images: ["/ff-entertainment.jpg"],
  },
};

export const dynamic = "force-dynamic";

/** Kleine Girlande als handgemachter Trenner. */
function Garland() {
  const dots = [
    "bg-ff-orange",
    "bg-xmas-pine",
    "bg-ff-yellow",
    "bg-ff-navy",
    "bg-xmas-gold",
  ];
  return (
    <div aria-hidden className="flex items-center justify-center gap-1.5">
      {dots.map((tone, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${tone}`}
          style={{ opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

export default async function WeihnachtsessenPage() {
  const [settings, responses] = await Promise.all([
    getDinnerSettings(),
    getDinnerResponses(),
  ]);

  // Vorbelegung des Formulars: nur, wenn die Antworten ohnehin sichtbar sind.
  const existing: Record<string, DinnerDraft> = {};
  if (settings.showResults) {
    for (const r of responses) {
      existing[r.id] = {
        name: r.name,
        dates: r.dates,
        restaurants: r.restaurants,
        comment: r.comment,
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* --- Kopf: Logo als Briefkopf auf dem Papier --- */}
      <header className="relative animate-rise overflow-hidden pt-1 text-center">
        <Snowflakes />
        {/* Das Logo bringt seinen eigenen cremefarbenen Rahmen mit und sitzt
            deshalb direkt auf dem Papier – wie aufgemalt. */}
        <img
          src="/ff-entertainment.jpg"
          alt="FF Entertainment – Feli & Felix · Essen & Ausflüge"
          width={1174}
          height={602}
          className="mx-auto h-auto w-full max-w-[400px]"
        />
        <div className="mt-6">
          <Garland />
        </div>
        <h1 className="mt-4 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight text-ff-navy sm:text-4xl">
          Weihnachtsessen{" "}
          <span className="block text-ff-orange sm:inline">der Abteilung</span>
          <span className="ml-2 inline-block align-middle text-2xl sm:text-3xl" aria-hidden>
            🎄
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
          Wir suchen Termin und Restaurant. Trag einfach ein, wann du kannst –
          Mehrfachauswahl ausdrücklich erwünscht.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-ff-navy">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-card ring-1 ring-ff-navy/10">
            🗓️ {DINNER_DATES.length} Termine · Do &amp; Fr
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-card ring-1 ring-ff-navy/10">
            🍽️ {RESTAURANTS.length} Restaurants
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-card ring-1 ring-ff-navy/10">
            🔓 Ohne Anmeldung
          </span>
          {responses.length > 0 && (
            <span className="rounded-full bg-ff-navy px-3 py-1.5 text-white shadow-card">
              👥 {responses.length}{" "}
              {responses.length === 1 ? "Antwort" : "Antworten"}
            </span>
          )}
        </div>
      </header>

      {/* --- Ergebnis steht fest --- */}
      {settings.finalDate && (
        <section className="animate-rise overflow-hidden rounded-[2rem] bg-ff-navy-gradient p-6 text-white shadow-card-hover sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-white/25">
            🔔 Es ist entschieden
          </span>
          <p className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            {formatDinnerDateLong(settings.finalDate)}
          </p>
          {settings.finalRestaurant && (
            <p className="mt-1.5 text-lg font-semibold text-ff-yellow">
              🍽️ {restaurantLabel(settings.finalRestaurant)}
            </p>
          )}
          {settings.note && (
            <p className="mt-3 text-sm text-white/85">{settings.note}</p>
          )}
        </section>
      )}

      {/* --- Abstimmung --- */}
      {settings.open ? (
        <DinnerForm existing={existing} />
      ) : (
        <section className="card border-xmas-gold/50 bg-xmas-gold/[0.10]">
          <h2 className="font-display text-lg font-extrabold text-ff-navy">
            🔒 Die Abstimmung ist geschlossen
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {settings.note ||
              "Danke an alle, die abgestimmt haben. Bei Fragen melde dich beim Organisator."}
          </p>
        </section>
      )}

      {/* --- Auswertung --- */}
      {settings.showResults && (
        <section className="space-y-4">
          <h2 className="eyebrow before:bg-ff-orange">Aktueller Stand</h2>
          <DinnerResults responses={responses} finalDate={settings.finalDate} />
        </section>
      )}

      <footer className="space-y-2 pb-4 pt-2 text-center text-xs text-ink-soft">
        <Garland />
        <p>FF Entertainment · Essen &amp; Ausflüge · ohne Doodle-Abo 🎅</p>
      </footer>

      {/* Schaltet den Papier-Hintergrund dieser Seite frei (globals.css). */}
      <span aria-hidden className="xmas-paper hidden" />
    </div>
  );
}
