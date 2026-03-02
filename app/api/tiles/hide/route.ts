import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canEditGridNeon, getTileGridIdNeon } from "@/lib/neonDb";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tileId } = body;

    if (!tileId) {
      return NextResponse.json(
        { error: "Tile ID is required" },
        { status: 400 }
      );
    }

    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId || !(await canEditGridNeon(session.userId, gridId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL not set");
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    await sql`
      UPDATE "Tile" SET hidden = true WHERE id = ${tileId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to hide tile:", error);
    return NextResponse.json(
      { error: "Failed to hide tile" },
      { status: 500 }
    );
  }
}
