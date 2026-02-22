import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

async function getTileGridId(tileId: string): Promise<string | null> {
  const tile = await prisma.tile.findUnique({
    where: { id: tileId },
    select: { gridId: true },
  });
  return tile?.gridId ?? null;
}

/** GET /api/tiles/[tileId]/notes - Get shared notes for tile (anyone with grid view) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(_req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const gridId = await getTileGridId(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canViewGrid(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const note = await prisma.tileNote.findUnique({
      where: { tileId },
      select: { content: true },
    });
    return NextResponse.json({ content: note?.content ?? "" });
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
    const gridId = await getTileGridId(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canEditGrid(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const content = typeof body.content === "string" ? body.content : "";

    await prisma.tileNote.upsert({
      where: { tileId },
      create: { tileId, content },
      update: { content },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Tile notes PUT:", e);
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}
