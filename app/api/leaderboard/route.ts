import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const standings = await getStandings();
  return NextResponse.json({ standings, updatedAt: Date.now() });
}
