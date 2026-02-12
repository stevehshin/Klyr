import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tiles/dms — List all DM tiles for the current user (across all their grids).
 * Used by the sidebar DMs tab.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Grids the user can see: owned + shared with them
  const [ownedGrids, sharedGrids] = await Promise.all([
    prisma.grid.findMany({
      where: { ownerId: session.userId },
      select: { id: true, name: true },
    }),
    prisma.gridShare.findMany({
      where: { userId: session.userId },
      select: { gridId: true, grid: { select: { id: true, name: true } } },
    }),
  ]);
  const gridById = new Map(ownedGrids.map((g) => [g.id, g]));
  sharedGrids.forEach((s) => {
    if (s.grid && !gridById.has(s.grid.id)) gridById.set(s.grid.id, s.grid);
  });
  const gridIds = Array.from(gridById.keys());
  const grids = Array.from(gridById.values());

  const tiles = await prisma.tile.findMany({
    where: {
      gridId: { in: gridIds },
      type: "dm",
      hidden: false,
      conversationId: { not: null },
    },
    select: {
      id: true,
      conversationId: true,
      onGrid: true,
      gridId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const gridByName = new Map(grids.map((g) => [g.id, g.name]));
  const list = tiles.map((t) => ({
    id: t.id,
    conversationId: t.conversationId,
    conversationName: null as string | null,
    onGrid: t.onGrid ?? true,
    gridId: t.gridId,
    gridName: gridByName.get(t.gridId) ?? "",
  }));

  // Resolve conversation names: conversationId can be user id or "email-xxx"
  const userIds = list
    .map((l) => l.conversationId)
    .filter((id): id is string => id !== null && !id.startsWith("email-"));
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
  const userEmailById = new Map(users.map((u) => [u.id, u.email]));

  const withNames = list.map((item) => ({
    ...item,
    conversationName:
      item.conversationId?.startsWith("email-")
        ? item.conversationId.replace(/^email-/, "")
        : (item.conversationId && userEmailById.get(item.conversationId)) ?? "DM",
  }));

  return NextResponse.json({ dms: withNames });
}
