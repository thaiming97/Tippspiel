import { getCurrentUser } from "@/lib/auth";
import { ScopeSettingsForm } from "@/components/ScopeSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Einstellungen</h1>
      <div className="card space-y-4">
        <h2 className="font-semibold">Tipp-Umfang</h2>
        <ScopeSettingsForm currentScope={user.scope ?? "group_e"} />
      </div>
    </div>
  );
}
