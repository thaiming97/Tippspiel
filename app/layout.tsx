import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions/auth";
import { NavLink } from "@/components/NavLink";

const display = Bricolage_Grotesque({
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
          <header className="sticky top-0 z-30 border-b border-ink/[0.07] bg-paper/80 backdrop-blur-xl">
            <div className="mx-auto max-w-4xl px-4">
              <div className="flex items-center justify-between py-3.5">
                <Link
                  href="/"
                  className="group flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-ink"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-pitch-gradient text-lg shadow-card ring-1 ring-pitch/20 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105">
                    ⚽
                  </span>
                  <span>
                    WM-Tippspiel <span className="text-pitch">2026</span>
                  </span>
                </Link>
                <form action={logoutAction} className="flex items-center gap-2.5">
                  <span className="hidden text-sm font-medium text-ink-soft sm:inline">
                    {session!.name}
                  </span>
                  <button className="rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-ink/25 hover:bg-ink/[0.03]">
                    Abmelden
                  </button>
                </form>
              </div>
              {/* Segment-Navigation – die „Reiter". */}
              <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-ink/[0.06] bg-white/70 p-1 text-sm font-semibold shadow-card">
                <NavLink href="/">Start</NavLink>
                <NavLink href="/matches">Spiele &amp; Tipps</NavLink>
                <NavLink href="/leaderboard">Rangliste</NavLink>
                <NavLink href="/community">Community</NavLink>
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
