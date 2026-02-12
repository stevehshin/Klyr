import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gridId = searchParams.get("gridId");

    if (!gridId) {
      return NextResponse.json(
        { error: "Grid ID is required" },
        { status: 400 }
      );
    }

    const hiddenTiles = await prisma.tile.findMany({
      where: {
        gridId,
        hidden: true,
      },
      include: {
        channel: true,
      },
    });

    const tiles = hiddenTiles.map((t) => ({
      id: t.id,
      type: t.type,
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
      channelId: t.channelId,
      channelName: t.channel?.name,
      channelEmoji: t.channel?.emoji ?? "📢",
      conversationId: t.conversationId,
      roomLabel: t.callRoomLabel,
    }));

    return NextResponse.json({ tiles });
  } catch (error) {
    console.error("Failed to fetch hidden tiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch hidden tiles" },
      { status: 500 }
    );
  }
}
