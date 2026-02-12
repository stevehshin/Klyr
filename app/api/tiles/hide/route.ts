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
    const { tileId } = body;

    if (!tileId) {
      return NextResponse.json(
        { error: "Tile ID is required" },
        { status: 400 }
      );
    }

    // Update tile to hidden
    await prisma.tile.update({
      where: { id: tileId },
      data: { hidden: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to hide tile:", error);
    return NextResponse.json(
      { error: "Failed to hide tile" },
      { status: 500 }
    );
  }
}
