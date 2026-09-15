import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions/auth";

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
  title: "FF Entertainment",
  description:
    "Feli & Felix · Essen & Ausflüge – Termine abstimmen ohne Anmeldung.",
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
        <header className="sticky top-0 z-30 border-b border-ff-navy/[0.08] bg-ff-cream/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            {/* Das gezeichnete Logo ist bei Kopfzeilen-Größe nicht mehr
                lesbar – hier steht deshalb das „FF" als Wortmarke, das
                Original hängt groß auf der Startseite. */}
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="relative grid h-9 w-11 flex-none place-items-center">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[45%] bg-ff-yellow transition-transform duration-300 group-hover:scale-105"
                />
                <span className="relative font-display text-lg font-extrabold italic text-ff-navy">
                  FF
                </span>
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-ff-navy">
                FF <span className="text-ff-orange">Entertainment</span>
              </span>
            </Link>

            {loggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-ff-navy transition hover:bg-ff-navy/[0.06]"
                >
                  Umfragen
                </Link>
                <form action={logoutAction}>
                  <button className="rounded-full border border-ff-navy/15 bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-ff-navy/30">
                    Abmelden
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                Organisator
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-7">{children}</main>

        <footer className="mx-auto max-w-4xl px-4 pb-8 text-center text-xs text-ink-soft">
          FF Entertainment · Feli &amp; Felix · Essen &amp; Ausflüge
        </footer>
      </body>
    </html>
  );
}
