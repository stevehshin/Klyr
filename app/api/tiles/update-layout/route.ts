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
    const { tiles } = body;

    if (!Array.isArray(tiles)) {
      return NextResponse.json(
        { error: "Invalid tiles data" },
        { status: 400 }
      );
    }

    // Update each tile's position and size
    await Promise.all(
      tiles.map((tile: { id: string; x: number; y: number; w: number; h: number }) =>
        prisma.tile.update({
          where: { id: tile.id },
          data: {
            x: tile.x,
            y: tile.y,
            w: tile.w,
            h: tile.h,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    );
  }
}
