import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/tiles/[id] — Update a tile (e.g. onGrid for "Add to grid", or position).
 * User must own the grid the tile belongs to.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tileId } = await params;
  const body = await request.json();

  const tile = await prisma.tile.findUnique({
    where: { id: tileId },
    include: { grid: { select: { ownerId: true } } },
  });
  if (!tile || tile.grid.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: { onGrid?: boolean; x?: number; y?: number; w?: number; h?: number } = {};
  if (typeof body.onGrid === "boolean") data.onGrid = body.onGrid;
  if (typeof body.x === "number") data.x = body.x;
  if (typeof body.y === "number") data.y = body.y;
  if (typeof body.w === "number") data.w = body.w;
  if (typeof body.h === "number") data.h = body.h;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: true, tile });
  }

  const updated = await prisma.tile.update({
    where: { id: tileId },
    data,
  });

  return NextResponse.json({ success: true, tile: updated });
}
