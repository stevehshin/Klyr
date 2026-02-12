import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/grid - List all grids for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grids = await prisma.grid.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ grids });
  } catch (error) {
    console.error("Failed to fetch grids:", error);
    return NextResponse.json(
      { error: "Failed to fetch grids" },
      { status: 500 }
    );
  }
}

// POST /api/grid - Create new grid
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Create grid with default tiles
    const grid = await prisma.grid.create({
      data: {
        name: name || "Untitled Grid",
        ownerId: session.userId,
        tiles: {
          create: [
            {
              type: "notes",
              x: 0,
              y: 0,
              w: 4,
              h: 3,
              hidden: false,
            },
            {
              type: "dm",
              x: 4,
              y: 0,
              w: 4,
              h: 3,
              hidden: false,
            },
          ],
        },
      },
      include: {
        tiles: true,
      },
    });

    return NextResponse.json({ success: true, grid }, { status: 201 });
  } catch (error) {
    console.error("Failed to create grid:", error);
    return NextResponse.json(
      { error: "Failed to create grid" },
      { status: 500 }
    );
  }
}
