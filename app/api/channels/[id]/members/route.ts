import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Add members to a channel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channelId = params.id;
    const body = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to add members (is owner or admin)
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: session.userId,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You don't have permission to add members" },
        { status: 403 }
      );
    }

    // Find users by email
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No users found with those emails" },
        { status: 404 }
      );
    }

    // Add members to channel
    const members = await Promise.all(
      users.map((user) =>
        prisma.channelMember.upsert({
          where: {
            channelId_userId: {
              channelId,
              userId: user.id,
            },
          },
          create: {
            channelId,
            userId: user.id,
            role: "member",
          },
          update: {},
        })
      )
    );

    return NextResponse.json({ members, count: members.length });
  } catch (error) {
    console.error("Failed to add members:", error);
    return NextResponse.json(
      { error: "Failed to add members" },
      { status: 500 }
    );
  }
}
