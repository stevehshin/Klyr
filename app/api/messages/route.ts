import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid } from "@/lib/gridAuth";

async function canAccessTile(tileId: string, userId: string): Promise<boolean> {
  const tile = await prisma.tile.findUnique({
    where: { id: tileId },
    select: { gridId: true },
  });
  if (!tile) return false;
  return canViewGrid(userId, tile.gridId);
}

// GET /api/messages?tileId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tileId = searchParams.get("tileId");

    if (!tileId) {
      return NextResponse.json(
        { error: "Tile ID is required" },
        { status: 400 }
      );
    }

    if (!(await canAccessTile(tileId, session.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { tileId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tileId, encryptedContent } = body;

    if (!tileId || !encryptedContent) {
      return NextResponse.json(
        { error: "Tile ID and encrypted content are required" },
        { status: 400 }
      );
    }

    if (!(await canAccessTile(tileId, session.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create message (already encrypted client-side)
    const message = await prisma.message.create({
      data: {
        tileId,
        encryptedContent,
        userId: session.userId,
      },
      include: { user: { select: { email: true } } },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
