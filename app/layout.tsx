import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions/auth";

export const metadata: Metadata = {
  title: "WM-Tippspiel",
  description: "Tippspiel zur Fußball-WM 2026",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const loggedIn = session && !session.mustChangePassword;

  return (
    <html lang="de">
      <body>
        {loggedIn && (
          <header className="bg-pitch-gradient text-white shadow-md">
            <div className="mx-auto max-w-4xl px-4">
              <div className="flex items-center justify-between py-3">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <span className="text-2xl">⚽</span>
                  <span>WM-Tippspiel <span className="text-gold">2026</span></span>
                </Link>
                <form action={logoutAction} className="flex items-center gap-2">
                  <span className="hidden text-sm opacity-90 sm:inline">
                    {session!.name}
                  </span>
                  <button className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25">
                    Abmelden
                  </button>
                </form>
              </div>
              <nav className="-mb-px flex items-center gap-1 overflow-x-auto text-sm font-medium">
                <NavLink href="/">Start</NavLink>
                <NavLink href="/matches">Spiele & Tipps</NavLink>
                <NavLink href="/leaderboard">Rangliste</NavLink>
                <NavLink href="/help">Hilfe</NavLink>
                <NavLink href="/settings">Einstellungen</NavLink>
                {session!.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
              </nav>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-t-lg border-b-2 border-transparent px-3 py-2 text-white/85 transition hover:border-gold hover:text-white"
    >
      {children}
    </Link>
  );
}
