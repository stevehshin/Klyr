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

/** GET /api/tiles/[tileId]/links - List shared links (anyone with grid view) */
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

    const links = await prisma.tileLink.findMany({
      where: { tileId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, url: true },
    });
    return NextResponse.json({ links });
  } catch (e) {
    console.error("Tile links GET:", e);
    return NextResponse.json({ error: "Failed to load links" }, { status: 500 });
  }
}

/** POST /api/tiles/[tileId]/links - Add link (requires grid edit) */
export async function POST(
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    let url = typeof body.url === "string" ? body.url.trim() : "";
    if (url && !url.startsWith("http")) url = "https://" + url;
    if (!title || !url) return NextResponse.json({ error: "title and url required" }, { status: 400 });

    const maxOrder = await prisma.tileLink.aggregate({
      where: { tileId },
      _max: { sortOrder: true },
    });
    const link = await prisma.tileLink.create({
      data: { tileId, title: title.slice(0, 500), url: url.slice(0, 2000), sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
      select: { id: true, title: true, url: true },
    });
    return NextResponse.json({ link });
  } catch (e) {
    console.error("Tile links POST:", e);
    return NextResponse.json({ error: "Failed to add link" }, { status: 500 });
  }
}

/** DELETE /api/tiles/[tileId]/links?id=xxx - Delete link */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tileId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { tileId } = await params;
    const linkId = req.nextUrl.searchParams.get("id");
    if (!linkId) return NextResponse.json({ error: "id required" }, { status: 400 });
    const gridId = await getTileGridId(tileId);
    if (!gridId) return NextResponse.json({ error: "Tile not found" }, { status: 404 });
    if (!(await canEditGrid(session.userId, gridId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.tileLink.deleteMany({ where: { id: linkId, tileId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Tile links DELETE:", e);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
