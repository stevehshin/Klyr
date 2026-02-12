import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditGrid } from "@/lib/gridAuth";

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

    for (const tile of tiles as { id: string }[]) {
      const t = await prisma.tile.findUnique({ where: { id: tile.id }, select: { gridId: true } });
      if (!t || !(await canEditGrid(session.userId, t.gridId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await Promise.all(
      (tiles as { id: string; x: number; y: number; w: number; h: number }[]).map((tile) =>
        prisma.tile.update({
          where: { id: tile.id },
          data: { x: tile.x, y: tile.y, w: tile.w, h: tile.h },
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
