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
    const { gridId, type, channelId, channelName, channelEmoji, conversationId, conversationName, roomId, roomLabel, onGrid } = body;

    if (!gridId || !type) {
      return NextResponse.json(
        { error: "Grid ID and type are required" },
        { status: 400 }
      );
    }

    // Get existing on-grid tiles to find next available position
    const existingTiles = await prisma.tile.findMany({
      where: { gridId, hidden: false, onGrid: true },
      orderBy: { y: "desc" },
    });

    // Calculate position for new tile (below all existing tiles)
    let newY = 0;
    if (existingTiles.length > 0) {
      const bottomTile = existingTiles[0];
      newY = bottomTile.y + bottomTile.h;
    }

    // When onGrid is false (e.g. DM in panel first), don't use grid position yet
    const placeOnGrid = onGrid !== false;
    const tileData: any = {
      gridId,
      type,
      x: 0,
      y: placeOnGrid ? newY : 0,
      w: 4,
      h: 3,
      hidden: false,
      onGrid: placeOnGrid,
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

    // Loop room tiles: opt-in join room (title in callRoomLabel)
    if (type === "loop_room") {
      tileData.callRoomLabel = (body.title || body.roomLabel || "Loop room").toString().trim().slice(0, 120);
    }

    const tile = await prisma.tile.create({
      data: tileData,
    });

    // Return tile with metadata for frontend
    const effectiveRoomId = type === "loop_room" ? tile.id : (channelId ?? conversationId ?? gridId);
    const effectiveRoomLabel = type === "loop_room" ? (tile.callRoomLabel ?? "Loop room") : (roomLabel ?? tile.callRoomLabel ?? (channelId ? `${channelEmoji || "📢"} #${channelName}` : conversationId ? `Call with ${conversationName}` : "Grid call"));
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
