import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import {
  getTileGridIdNeon,
  canViewGridNeon,
  canEditGridNeon,
} from "@/lib/neonDb";

/** GET /api/tiles/[tileId]/notes - Get shared notes for tile (anyone with grid view) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(_req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canViewGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = neon(process.env.DATABASE_URL!);
    const [note] = await sql`SELECT content FROM "TileNote" WHERE "tileId" = ${tileId} LIMIT 1`;
    return NextResponse.json({ content: (note as { content: string } | undefined)?.content ?? "" });
  } catch (e) {
    console.error("Tile notes GET:", e);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

/** PUT /api/tiles/[tileId]/notes - Update shared notes (requires grid edit) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const gridId = await getTileGridIdNeon(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canEditGridNeon(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const content = typeof body.content === "string" ? body.content : "";

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO "TileNote" (id, "tileId", content, "updatedAt")
      VALUES (gen_random_uuid()::text, ${tileId}, ${content}, NOW())
      ON CONFLICT ("tileId") DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Tile notes PUT:", e);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}
