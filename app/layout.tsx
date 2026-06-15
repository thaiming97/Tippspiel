import type { Metadata } from "next";
import { Anton, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions/auth";
import { NavLink } from "@/components/NavLink";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WM-Tippspiel 2026",
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
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body>
        {loggedIn && (
          <header className="sticky top-0 z-30 border-b border-white/10 bg-night/70 backdrop-blur-xl">
            {/* Gold-Glühlinie unter dem Header. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            <div className="mx-auto max-w-4xl px-4">
              <div className="flex items-center justify-between py-3">
                <Link
                  href="/"
                  className="group flex items-center gap-2.5 text-lg font-bold tracking-tight"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-pitch-gradient text-xl shadow-glow-turf ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6">
                    ⚽
                  </span>
                  <span className="font-display text-xl tracking-wider">
                    WM-TIPPSPIEL <span className="wordmark-gold">2026</span>
                  </span>
                </Link>
                <form action={logoutAction} className="flex items-center gap-2.5">
                  <span className="hidden text-sm text-white/70 sm:inline">
                    {session!.name}
                  </span>
                  <button className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10">
                    Abmelden
                  </button>
                </form>
              </div>
              <nav className="flex items-center gap-1 overflow-x-auto pb-2.5 text-sm font-semibold">
                <NavLink href="/">Start</NavLink>
                <NavLink href="/matches">Spiele &amp; Tipps</NavLink>
                <NavLink href="/leaderboard">Rangliste</NavLink>
                <NavLink href="/help">Hilfe</NavLink>
                <NavLink href="/settings">Einstellungen</NavLink>
                {session!.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
              </nav>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-4xl px-4 py-7">{children}</main>
      </body>
    </html>
  );
}
