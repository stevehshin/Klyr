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

  // Fetch user and all their grids
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      grids: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          icon: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Await searchParams before accessing properties (Next.js 15 requirement)
  const params = await searchParams;
  
  // Get the requested grid ID or the first grid
  const gridId = params.id || user.grids[0]?.id;

  let currentGrid = null;
  if (gridId) {
    const gridData = await prisma.grid.findFirst({
      where: {
        id: gridId,
        ownerId: user.id,
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
      // Map tiles with channel metadata and call tile metadata (use undefined instead of null for TileData)
      const tilesWithMetadata = gridData.tiles.map((tile) => {
        const channelName = tile.channel?.name;
        const channelEmoji = tile.channel?.emoji;
        const conversationName = tile.conversationId ? `Conversation ${tile.conversationId.split('-')[0]}` : undefined;
        const roomId = tile.channelId ?? tile.conversationId ?? gridData.id;
        const roomLabel = tile.callRoomLabel ?? (tile.channelId ? `${channelEmoji || "📢"} #${channelName}` : tile.conversationId ? `Call with ${conversationName}` : "Grid call");
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

      currentGrid = {
        id: gridData.id,
        name: gridData.name,
        tiles: tilesWithMetadata,
      };
    }
  }

  // Serialize grids for client (GridInfo expects createdAt as string)
  const initialGrids = user.grids.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <GridWorkspace
      initialGrids={initialGrids}
      currentGrid={currentGrid}
      userId={user.id}
      userEmail={user.email}
    />
  );
}
