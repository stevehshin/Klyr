import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/grid/[id] - Get specific grid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const grid = await prisma.grid.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.userId },
          { sharedWith: { some: { userId: session.userId } } },
        ],
      },
      include: {
        tiles: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!grid) {
      return NextResponse.json({ error: "Grid not found" }, { status: 404 });
    }

    return NextResponse.json({ grid });
  } catch (error) {
    console.error("Failed to fetch grid:", error);
    return NextResponse.json(
      { error: "Failed to fetch grid" },
      { status: 500 }
    );
  }
}

// PATCH /api/grid/[id] - Update grid name and/or icon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon } = body;

    const data: { name?: string; icon?: string | null } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (icon !== undefined) data.icon = icon === null || icon === "" ? null : String(icon).trim().slice(0, 4);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "At least one of name or icon is required" },
        { status: 400 }
      );
    }

    const grid = await prisma.grid.updateMany({
      where: {
        id,
        ownerId: session.userId,
      },
      data,
    });

    if (grid.count === 0) {
      return NextResponse.json({ error: "Grid not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update grid:", error);
    return NextResponse.json(
      { error: "Failed to update grid" },
      { status: 500 }
    );
  }
}

// DELETE /api/grid/[id] - Delete grid
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const grid = await prisma.grid.deleteMany({
      where: {
        id,
        ownerId: session.userId,
      },
    });

    if (grid.count === 0) {
      return NextResponse.json({ error: "Grid not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete grid:", error);
    return NextResponse.json(
      { error: "Failed to delete grid" },
      { status: 500 }
    );
  }
}
