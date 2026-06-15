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

  return (
    <html lang="de">
      <body>
        {session && !session.mustChangePassword && (
          <header className="border-b border-gray-200 bg-pitch text-white">
            <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
              <Link href="/" className="font-semibold">
                ⚽ WM-Tippspiel
              </Link>
              <Link href="/matches" className="hover:underline">
                Spiele & Tipps
              </Link>
              <Link href="/leaderboard" className="hover:underline">
                Rangliste
              </Link>
              <Link href="/settings" className="hover:underline">
                Einstellungen
              </Link>
              {session.role === "admin" && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <form action={logoutAction} className="ml-auto">
                <span className="mr-3 opacity-90">{session.name}</span>
                <button className="rounded bg-white/20 px-2 py-1 hover:bg-white/30">
                  Abmelden
                </button>
              </form>
            </nav>
          </header>
        )}
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
