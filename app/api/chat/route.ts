import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getMessages, postMessage, MAX_MESSAGE_LENGTH } from "@/lib/chat";

export const dynamic = "force-dynamic";

/** Aktuelle Chat-Nachrichten (für initialen Abruf und Polling). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const messages = await getMessages();
  return NextResponse.json({ messages });
}

/** Neue Nachricht senden. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Nachricht ist leer" }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Nachricht ist zu lang" },
      { status: 400 },
    );
  }

  const message = await postMessage(session.sub, session.name, text);
  return NextResponse.json({ message });
}
