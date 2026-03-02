import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canEditGridNeon, getTileGridIdNeon } from "@/lib/neonDb";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tiles } = body;

    if (!Array.isArray(tiles)) {
      return NextResponse.json(
        { error: "Invalid tiles data" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    for (const tile of tiles as { id: string; x: number; y: number; w: number; h: number }[]) {
      const gridId = await getTileGridIdNeon(tile.id);
      if (!gridId || !(await canEditGridNeon(session.userId, gridId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await sql`
        UPDATE "Tile"
        SET x = ${tile.x}, y = ${tile.y}, w = ${tile.w}, h = ${tile.h}
        WHERE id = ${tile.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    );
  }
}
