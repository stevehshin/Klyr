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
    const { gridId, tileIds } = body;

    if (!gridId) {
      return NextResponse.json(
        { error: "Grid ID is required" },
        { status: 400 }
      );
    }

    const where: { gridId: string; hidden: boolean; id?: { in: string[] } } = {
      gridId,
      hidden: true,
    };
    if (tileIds && Array.isArray(tileIds) && tileIds.length > 0) {
      where.id = { in: tileIds };
    }

    const hiddenTiles = await prisma.tile.findMany({
      where,
      include: { channel: { select: { name: true, emoji: true } } },
    });

    if (hiddenTiles.length === 0) {
      return NextResponse.json({ success: true, tiles: [] });
    }

    await prisma.tile.updateMany({
      where: { id: { in: hiddenTiles.map((t) => t.id) } },
      data: { hidden: false },
    });

    const tiles = hiddenTiles.map((t) => {
      const channelName = t.channel?.name;
      const channelEmoji = t.channel?.emoji ?? "📢";
      const conversationName = t.conversationId
        ? `Conversation ${t.conversationId.split("-")[0]}`
        : undefined;
      const roomId = t.channelId ?? t.conversationId ?? t.gridId;
      const roomLabel =
        t.callRoomLabel ??
        (t.channelId ? `${channelEmoji} #${channelName}` : t.conversationId ? `Call with ${conversationName}` : "Grid call");
      return {
        id: t.id,
        type: t.type,
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        hidden: false,
        channelId: t.channelId,
        channelName,
        channelEmoji,
        conversationId: t.conversationId,
        conversationName,
        roomId,
        roomLabel,
      };
    });

    return NextResponse.json({ success: true, tiles });
  } catch (error) {
    console.error("Failed to restore tiles:", error);
    return NextResponse.json(
      { error: "Failed to restore tiles" },
      { status: 500 }
    );
  }
}
