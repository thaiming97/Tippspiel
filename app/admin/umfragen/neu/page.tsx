import Link from "next/link";
import { PollEditor } from "@/components/poll/PollEditor";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NeueUmfragePage() {
  // Nicht nur auf die Middleware verlassen (siehe requireAdminPage).
  await requireAdminPage();

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
          ← Übersicht
        </Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ff-navy">
          Neue Umfrage
        </h1>
        <p className="text-sm text-ink-soft">
          Titel, Termine und Auswahl bestimmst du selbst – abstimmen kann
          danach jeder mit einem Konto.
        </p>
      </header>
      <PollEditor />
    </div>
  );
}
