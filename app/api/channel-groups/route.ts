import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all channel groups and ungrouped channels for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.channelGroup.findMany({
      where: { ownerId: session.userId },
      include: {
        channels: {
          include: {
            _count: { select: { members: true, messages: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const ungroupedChannels = await prisma.channel.findMany({
      where: {
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
        channelGroupId: null,
      },
      include: {
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ groups, ungroupedChannels });
  } catch (error) {
    console.error("Failed to fetch channel groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel groups" },
      { status: 500 }
    );
  }
}

// POST - Create a new channel group
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.channelGroup.findFirst({
      where: { ownerId: session.userId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const group = await prisma.channelGroup.create({
      data: {
        name: name.trim(),
        order: (maxOrder?.order ?? -1) + 1,
        ownerId: session.userId,
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Failed to create channel group:", error);
    return NextResponse.json(
      { error: "Failed to create channel group" },
      { status: 500 }
    );
  }
}
