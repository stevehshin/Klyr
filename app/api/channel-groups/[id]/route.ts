import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update channel group (name, or assign channels)
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
    const { name, channelIds } = body;

    const existing = await prisma.channelGroup.findFirst({
      where: { id, ownerId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const data: { name?: string } = {};
    if (name !== undefined && typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }

    if (Object.keys(data).length > 0) {
      await prisma.channelGroup.update({
        where: { id },
        data,
      });
    }

    if (Array.isArray(channelIds)) {
      await prisma.channel.updateMany({
        where: {
          id: { in: channelIds },
          ownerId: session.userId,
        },
        data: { channelGroupId: id },
      });
      await prisma.channel.updateMany({
        where: {
          channelGroupId: id,
          id: { notIn: channelIds },
        },
        data: { channelGroupId: null },
      });
    }

    const group = await prisma.channelGroup.findUnique({
      where: { id },
      include: { channels: true },
    });
    return NextResponse.json({ group });
  } catch (error) {
    console.error("Failed to update channel group:", error);
    return NextResponse.json(
      { error: "Failed to update channel group" },
      { status: 500 }
    );
  }
}

// DELETE - Delete channel group (channels become ungrouped)
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

    await prisma.channel.updateMany({
      where: { channelGroupId: id },
      data: { channelGroupId: null },
    });

    await prisma.channelGroup.deleteMany({
      where: { id, ownerId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete channel group:", error);
    return NextResponse.json(
      { error: "Failed to delete channel group" },
      { status: 500 }
    );
  }
}
