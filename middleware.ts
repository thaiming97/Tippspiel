import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wm_session";
/** Ohne Anmeldung erreichbar: anmelden und selbst registrieren. */
const PUBLIC_PATHS = ["/login", "/registrieren"];

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

  const session = await readSession(req);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!session) {
    if (isPublic) return NextResponse.next();
    // Ziel mitnehmen, damit ein geteilter Umfrage-Link nach dem Anmelden
    // direkt aufgeht.
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("weiter", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Angemeldet, aber Startpasswort noch nicht geändert.
  if (session.mustChangePassword && pathname !== "/change-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/change-password";
    url.search = "";
    url.searchParams.set("weiter", pathname);
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
