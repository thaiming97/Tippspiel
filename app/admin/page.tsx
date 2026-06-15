import Link from "next/link";
import { listUsers } from "@/lib/admin";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [users, matches] = await Promise.all([listUsers(), getMatches()]);
  const finished = matches.filter((m) => m.status === "FINISHED").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin-Bereich</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-sm text-gray-500">Teilnehmer</div>
          <div className="text-2xl font-semibold">{users.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Spiele</div>
          <div className="text-2xl font-semibold">{matches.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Davon beendet</div>
          <div className="text-2xl font-semibold">{finished}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users" className="card hover:bg-gray-50">
          <div className="font-semibold">👥 Benutzerverwaltung</div>
          <p className="text-sm text-gray-500">
            Benutzer mit Startpasswort anlegen, zurücksetzen, löschen.
          </p>
        </Link>
        <Link href="/admin/matches" className="card hover:bg-gray-50">
          <div className="font-semibold">⚽ Spiele & Ergebnisse</div>
          <p className="text-sm text-gray-500">
            Spiele anlegen, Ergebnisse pflegen, Sync aus dem Internet starten.
          </p>
        </Link>
      </div>
    </div>
  );
}
