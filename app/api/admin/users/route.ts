import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users — List all users (admin only). Returns id, email, isAdmin, createdAt, gridCount.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true },
  });
  if (!currentUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      _count: {
        select: { grids: true, ownedChannels: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = users.map((u) => ({
    id: u.id,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    gridCount: u._count.grids,
    channelCount: u._count.ownedChannels,
  }));

  return NextResponse.json({ users: list });
}
