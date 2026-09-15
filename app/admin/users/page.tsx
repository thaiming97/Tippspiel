import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/admin";
import { deleteUserAction } from "@/app/actions/admin";
import { formatDateTime, formatRelative } from "@/lib/format";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-ff-navy">
        Organisatoren
      </h1>

      <CreateUserForm />

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-left text-ink-soft">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Login</th>
              <th className="px-4 py-2">Zuletzt online</th>
              <th className="px-4 py-2">Rolle</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ink/[0.06]">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {u.lastSeenAt ?? u.lastLoginAt ? (
                    <span title={formatDateTime((u.lastSeenAt ?? u.lastLoginAt)!)}>
                      {formatRelative((u.lastSeenAt ?? u.lastLoginAt)!)}
                    </span>
                  ) : (
                    <span className="text-ink/40">noch nie</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {u.role === "admin" ? "Organisator" : "Kein Zugriff"}
                </td>
                <td className="px-4 py-2">
                  {u.mustChangePassword ? (
                    <span className="text-amber-600">Startpasswort aktiv</span>
                  ) : (
                    <span className="text-green-600">aktiv</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <ResetPasswordForm userId={u.id} />
                  {u.id !== me?.id && (
                    <form action={deleteUserAction} className="ml-2 inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="btn-ghost py-1 text-xs text-red-600">
                        Löschen
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
