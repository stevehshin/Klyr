import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/users/[id] — Set or clear admin (admin only, or bootstrap when 0 admins).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true },
  });

  const canChangeAdmin = currentUser?.isAdmin === true || adminCount === 0;

  if (!canChangeAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: targetUserId } = await params;
  const body = await request.json();
  const isAdmin = body.isAdmin === true;

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isAdmin },
    select: { id: true, email: true, isAdmin: true },
  });

  return NextResponse.json({ user: updated });
}
