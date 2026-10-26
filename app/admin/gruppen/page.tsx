import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { listUsers } from "@/lib/admin";
import { listGroups } from "@/lib/groupStore";
import { listPolls } from "@/lib/pollStore";
import { DeleteGroupForm } from "@/components/admin/DeleteGroupForm";
import { GroupForm } from "@/components/admin/GroupForm";

export const dynamic = "force-dynamic";

/**
 * Gruppen verwalten: Wer in welcher Gruppe ist, bestimmt, wer welche
 * Umfrage sieht. Welche Gruppen eine Umfrage sehen, steht in ihren
 * Einstellungen.
 */
export default async function AdminGroupsPage() {
  // Nicht nur auf die Middleware verlassen (siehe requireAdminPage).
  await requireAdminPage();
  const [groups, users, polls] = await Promise.all([
    listGroups(),
    listUsers(),
    listPolls(),
  ]);
  // Nur Name und ID an den Browser – kein Passwort-Hash im Client-Bundle.
  const members = users.map((u) => ({ id: u.id, name: u.name }));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
          ← Übersicht
        </Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ff-navy">
          Gruppen
        </h1>
        <p className="text-sm text-ink-soft">
          Lege Gruppen an und gib Umfragen in deren Einstellungen gezielt für
          sie frei. So laufen mehrere Runden unabhängig voneinander –
          Organisatoren sehen immer alles.
        </p>
      </header>

      <section className="card border-ink/[0.06]">
        <div className="eyebrow mb-3">Neue Gruppe</div>
        <GroupForm users={members} />
      </section>

      {groups.length === 0 ? (
        <div className="card border-dashed border-ink/15 bg-white/70 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            👥
          </div>
          <p className="font-semibold">Noch keine Gruppe angelegt.</p>
          <p className="text-sm text-ink-soft">
            Ohne Gruppen sieht jeder mit einem Konto alle Umfragen.
          </p>
        </div>
      ) : (
        groups.map((g) => {
          const shared = polls.filter(
            ({ poll }) => poll.audience === "groups" && poll.groupIds.includes(g.id),
          );
          return (
            <section key={g.id} className="card space-y-4 border-ink/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-ff-navy">
                    {g.name}
                  </h2>
                  <p className="text-sm text-ink-soft">
                    {g.memberIds.length}{" "}
                    {g.memberIds.length === 1 ? "Mitglied" : "Mitglieder"}
                    {g.memberIds.length > 0 &&
                      `: ${g.memberIds
                        .map((id) => userName.get(id))
                        .filter(Boolean)
                        .join(", ")}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {shared.length === 0
                      ? "Noch keine Umfrage freigegeben."
                      : "Sieht: "}
                    {shared.map(({ poll }, i) => (
                      <span key={poll.id}>
                        {i > 0 && ", "}
                        <Link
                          href={`/admin/umfragen/${poll.id}`}
                          className="font-semibold text-ff-navy hover:text-ff-orange"
                        >
                          {poll.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
                <DeleteGroupForm groupId={g.id} name={g.name} pollCount={shared.length} />
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-ff-navy">
                  Name &amp; Mitglieder bearbeiten
                </summary>
                <div className="mt-3">
                  <GroupForm group={g} users={members} />
                </div>
              </details>
            </section>
          );
        })
      )}
    </div>
  );
}
