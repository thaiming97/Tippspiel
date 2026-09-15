import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wm_session";
const PUBLIC_PATHS = ["/login"];
/**
 * Offene Bereiche: ohne Anmeldung erreichbar UND ohne Umleitung für
 * Angemeldete. Umfragen soll jeder per Link öffnen können – ein Konto
 * braucht nur, wer Umfragen anlegt und auswertet.
 */
const OPEN_PATHS = ["/", "/umfrage", "/weihnachtsessen"];

async function readSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      sub: string;
      role: string;
      mustChangePassword: boolean;
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cron-Endpunkt schützt sich selbst per Secret.
  if (pathname.startsWith("/api/cron")) return NextResponse.next();

  // Offene Bereiche komplett an der Anmelde-Logik vorbeileiten. Die Wurzel
  // wird ausdrücklich nur exakt verglichen – mit `startsWith("//")` hinge das
  // Verhalten sonst daran, wie der Server doppelte Schrägstriche normalisiert.
  const isOpen = OPEN_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isOpen) return NextResponse.next();

  const session = await readSession(req);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!session) {
    if (isPublic) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Angemeldet, aber Startpasswort noch nicht geändert.
  if (session.mustChangePassword && pathname !== "/change-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/change-password";
    return NextResponse.redirect(url);
  }

  // Bereits angemeldet -> Login-Seite überspringen.
  if (isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Admin-Bereich nur für Admins.
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Alle Routen außer Next-Internals und statischen Assets. Dateien aus
  // `public/` (Logo, Icons, Bilder) sind bewusst für jeden erreichbar – ohne
  // die Endungs-Ausnahme würden sie für Nicht-Angemeldete auf /login
  // umgeleitet und damit nicht laden.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|txt|xml|webmanifest|woff|woff2)$).*)",
  ],
};
