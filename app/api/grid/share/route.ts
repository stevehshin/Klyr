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
    const { gridId, email, permission } = body;

    if (!gridId || !email || !permission) {
      return NextResponse.json(
        { error: "Grid ID, email, and permission are required" },
        { status: 400 }
      );
    }

    // Verify the user owns this grid
    const grid = await prisma.grid.findFirst({
      where: {
        id: gridId,
        ownerId: session.userId,
      },
    });

    if (!grid) {
      return NextResponse.json(
        { error: "Grid not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Find the user to share with
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    // Don't allow sharing with yourself
    if (targetUser.id === session.userId) {
      return NextResponse.json(
        { error: "You cannot share a grid with yourself" },
        { status: 400 }
      );
    }

    // Create or update the share
    const share = await prisma.gridShare.upsert({
      where: {
        gridId_userId: {
          gridId,
          userId: targetUser.id,
        },
      },
      create: {
        gridId,
        userId: targetUser.id,
        permission,
      },
      update: {
        permission,
      },
    });

    return NextResponse.json({ success: true, share });
  } catch (error) {
    console.error("Failed to share grid:", error);
    return NextResponse.json(
      { error: "Failed to share grid" },
      { status: 500 }
    );
  }
}
