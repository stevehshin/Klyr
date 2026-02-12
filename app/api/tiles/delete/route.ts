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
    const { tileIds } = body;

    if (!tileIds || !Array.isArray(tileIds) || tileIds.length === 0) {
      return NextResponse.json(
        { error: "At least one tile ID is required" },
        { status: 400 }
      );
    }

    await prisma.tile.deleteMany({
      where: { id: { in: tileIds } },
    });

    return NextResponse.json({ success: true, deleted: tileIds.length });
  } catch (error) {
    console.error("Failed to delete tiles:", error);
    return NextResponse.json(
      { error: "Failed to delete tiles" },
      { status: 500 }
    );
  }
}
