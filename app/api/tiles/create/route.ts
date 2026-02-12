import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gridId, type, channelId, channelName, channelEmoji, conversationId, conversationName, roomId, roomLabel } = body;

    if (!gridId || !type) {
      return NextResponse.json(
        { error: "Grid ID and type are required" },
        { status: 400 }
      );
    }

    // Get existing tiles to find next available position
    const existingTiles = await prisma.tile.findMany({
      where: { gridId, hidden: false },
      orderBy: { y: "desc" },
    });

    // Calculate position for new tile (below all existing tiles)
    let newY = 0;
    if (existingTiles.length > 0) {
      const bottomTile = existingTiles[0];
      newY = bottomTile.y + bottomTile.h;
    }

    // Create new tile with optional metadata
    const tileData: any = {
      gridId,
      type,
      x: 0,
      y: newY,
      w: 4,
      h: 3,
      hidden: false,
    };

    // Add channel ID if it's a channel tile
    if (type === "channel" && channelId) {
      tileData.channelId = channelId;
    }

    // Add conversation ID if it's a DM tile
    if (type === "dm" && conversationId) {
      tileData.conversationId = conversationId;
    }

    // Call tiles: store callRoomLabel for display; roomId derived from channelId/conversationId/gridId
    if (type === "call" && roomLabel) {
      tileData.callRoomLabel = roomLabel;
    }
    if (type === "call" && channelId) tileData.channelId = channelId;
    if (type === "call" && conversationId) tileData.conversationId = conversationId;

    const tile = await prisma.tile.create({
      data: tileData,
    });

    // Return tile with metadata for frontend
    const effectiveRoomId = channelId ?? conversationId ?? gridId;
    const effectiveRoomLabel = roomLabel ?? tile.callRoomLabel ?? (channelId ? `${channelEmoji || "📢"} #${channelName}` : conversationId ? `Call with ${conversationName}` : "Grid call");
    const tileWithMetadata = {
      ...tile,
      channelName,
      channelEmoji,
      conversationId,
      conversationName,
      roomId: effectiveRoomId,
      roomLabel: effectiveRoomLabel,
    };

    return NextResponse.json({ success: true, tile: tileWithMetadata });
  } catch (error) {
    console.error("Failed to create tile:", error);
    return NextResponse.json(
      { error: "Failed to create tile" },
      { status: 500 }
    );
  }
}
