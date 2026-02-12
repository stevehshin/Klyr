import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GridWorkspace } from "./GridWorkspace";

export default async function GridPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  // Check authentication
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user and all grids they can access (owned + shared with them)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      grids: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          icon: true,
          createdAt: true,
        },
      },
      sharedGrids: {
        select: {
          grid: {
            select: {
              id: true,
              name: true,
              icon: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Build combined grid list: owned first (with isOwner true), then shared (with isOwner false)
  const ownedGrids = user.grids.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    createdAt: g.createdAt.toISOString(),
    isOwner: true as boolean,
  }));
  const sharedGridIds = new Set(ownedGrids.map((g) => g.id));
  const sharedGrids = (user.sharedGrids ?? [])
    .map((s) => s.grid)
    .filter((g) => g && !sharedGridIds.has(g.id))
    .map((g) => ({
      id: g!.id,
      name: g!.name,
      icon: g!.icon,
      createdAt: g!.createdAt.toISOString(),
      isOwner: false as boolean,
    }));
  const allGrids = [...ownedGrids, ...sharedGrids];
  const firstGridId = allGrids[0]?.id;

  // Await searchParams before accessing properties (Next.js 15 requirement)
  const params = await searchParams;
  
  // Get the requested grid ID or the first grid the user can access
  const gridId = params.id || firstGridId;

  let currentGrid = null;
  if (gridId) {
    // Load grid if user owns it OR has a share (view/edit)
    const gridData = await prisma.grid.findFirst({
      where: {
        id: gridId,
        OR: [
          { ownerId: user.id },
          { sharedWith: { some: { userId: user.id } } },
        ],
      },
      include: {
        tiles: {
          orderBy: { createdAt: "asc" },
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                emoji: true,
              },
            },
          },
        },
      },
    });

    if (gridData) {
      // Only show tiles that are on the grid (exclude panel-only DMs)
      const onGridTiles = gridData.tiles.filter((t) => t.onGrid !== false);
      const tilesWithMetadata = onGridTiles.map((tile) => {
        const channelName = tile.channel?.name;
        const channelEmoji = tile.channel?.emoji;
        const conversationName = tile.conversationId ? `Conversation ${tile.conversationId.split('-')[0]}` : undefined;
        const roomId = tile.channelId ?? tile.conversationId ?? gridData.id;
        const roomLabel = tile.callRoomLabel ?? (tile.channelId ? `${channelEmoji || "📢"} #${channelName}` : tile.conversationId ? `Call with ${conversationName}` : tile.type === "loop_room" ? (tile.callRoomLabel ?? "Loop room") : "Grid call");
        return {
          id: tile.id,
          type: tile.type,
          x: tile.x,
          y: tile.y,
          w: tile.w,
          h: tile.h,
          hidden: tile.hidden,
          channelId: tile.channelId ?? undefined,
          channelName,
          channelEmoji,
          conversationId: tile.conversationId ?? undefined,
          conversationName,
          roomId,
          roomLabel,
        };
      });

      // Grid members (owner + shared users) for Tasks swim lanes and assignee picker
      const ownerUser = await prisma.user.findUnique({
        where: { id: gridData.ownerId },
        select: { id: true, email: true },
      });
      const shares = await prisma.gridShare.findMany({
        where: { gridId: gridData.id },
        include: { user: { select: { id: true, email: true } } },
      });
      const memberIds = new Set<string>();
      const gridMembers: { id: string; email: string; displayName: string }[] = [];
      if (ownerUser) {
        memberIds.add(ownerUser.id);
        gridMembers.push({
          id: ownerUser.id,
          email: ownerUser.email,
          displayName: ownerUser.email.split("@")[0] ?? ownerUser.email,
        });
      }
      for (const s of shares) {
        if (!memberIds.has(s.user.id)) {
          memberIds.add(s.user.id);
          gridMembers.push({
            id: s.user.id,
            email: s.user.email,
            displayName: s.user.email.split("@")[0] ?? s.user.email,
          });
        }
      }

      currentGrid = {
        id: gridData.id,
        name: gridData.name,
        tiles: tilesWithMetadata,
        gridMembers,
      };
    }
  }

  // Serialize grids for client (owned + shared; isOwner so sidebar can hide Share/Rename for shared)
  const initialGrids = allGrids;

  const gridMembers = currentGrid && "gridMembers" in currentGrid ? (currentGrid as { gridMembers?: { id: string; email: string; displayName: string }[] }).gridMembers ?? [] : [];

  return (
    <GridWorkspace
      initialGrids={initialGrids}
      currentGrid={currentGrid ? { id: currentGrid.id, name: currentGrid.name, tiles: currentGrid.tiles } : null}
      userId={user.id}
      userEmail={user.email}
      userIsAdmin={user.isAdmin}
      gridMembers={gridMembers}
    />
  );
}
