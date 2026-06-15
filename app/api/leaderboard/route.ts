import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "group_e";
  const standings = await getStandings(scope);
  return NextResponse.json({ standings, scope, updatedAt: Date.now() });
}
