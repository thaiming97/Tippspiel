import Link from "next/link";
import { CopyLinkButton } from "@/components/dinner/CopyLinkButton";
import { DinnerResults } from "@/components/dinner/DinnerResults";
import { DinnerSettingsForm } from "@/components/dinner/DinnerSettingsForm";
import {
  formatDinnerDateLong,
  rankDates,
  restaurantById,
  tallyDates,
  tallyRestaurants,
} from "@/lib/dinner";
import { getDinnerResponses, getDinnerSettings } from "@/lib/dinnerStore";

export const dynamic = "force-dynamic";

/** Kennzahl-Karte des Admin-Bereichs. */
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
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

export default async function AdminDinnerPage() {
  const [settings, responses] = await Promise.all([
    getDinnerSettings(),
    getDinnerResponses(),
  ]);

  const best = rankDates(tallyDates(responses))[0];
  const topRestaurant = tallyRestaurants(responses)[0];
  const topInfo = topRestaurant ? restaurantById(topRestaurant.id) : undefined;

  return (
    <div className="space-y-6">
      {/* --- Kopf --- */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/ff-entertainment.jpg"
            alt="FF Entertainment"
            width={1174}
            height={602}
            className="h-14 w-auto"
          />
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ff-navy">
              Weihnachtsessen
            </h1>
            <p className="text-sm text-ink-soft">
              Organisation &amp; Auswertung der Umfrage
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyLinkButton path="/weihnachtsessen" />
          <Link href="/weihnachtsessen" className="btn-ghost" target="_blank">
            Seite ansehen ↗
          </Link>
        </div>
      </header>

      {/* --- Kennzahlen --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Antworten"
          value={String(responses.length)}
          hint={responses.length === 0 ? "Link noch teilen" : "Kolleginnen & Kollegen"}
        />
        <Stat
          label="Bester Termin"
          value={best && best.score > 0 ? formatDinnerDateLong(best.date) : "—"}
          hint={
            best && best.score > 0
              ? `${best.yes}× ja${best.maybe > 0 ? `, ${best.maybe}× wenn nötig` : ""}`
              : "noch keine Stimmen"
          }
        />
        <Stat
          label="Restaurant vorn"
          value={topRestaurant && topRestaurant.votes > 0 ? topInfo!.name : "—"}
          hint={
            topRestaurant && topRestaurant.votes > 0
              ? `${topInfo!.town} · ${topRestaurant.votes} von ${responses.length}`
              : "noch keine Stimmen"
          }
        />
        <Stat
          label="Status"
          value={settings.open ? "Offen" : "Geschlossen"}
          hint={
            settings.showResults
              ? "Stand ist öffentlich sichtbar"
              : "Stand nur für Admins sichtbar"
          }
        />
      </div>

      {/* --- Steuerung --- */}
      <DinnerSettingsForm settings={settings} />

      {/* --- Auswertung mit Löschen-Möglichkeit --- */}
      <section className="space-y-4">
        <h2 className="eyebrow before:bg-ff-orange">Auswertung</h2>
        <DinnerResults
          responses={responses}
          admin
          finalDate={settings.finalDate}
        />
      </section>

      <p className="pb-2 text-center text-xs text-ink-soft">
        Die Umfrage-Seite ist ohne Anmeldung erreichbar – dieser Bereich hier
        nur für Admins.
      </p>
    </div>
  );
}
