import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/stats — Dashboard counts (admin only).
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

  const [userCount, gridCount, channelCount, tileCount] = await Promise.all([
    prisma.user.count(),
    prisma.grid.count(),
    prisma.channel.count(),
    prisma.tile.count({ where: { hidden: false } }),
  ]);

  return NextResponse.json({
    userCount,
    gridCount,
    channelCount,
    tileCount,
  });
}
