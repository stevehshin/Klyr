import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users — List users for DM picker (id, email). Excludes current user.
 * Authenticated users only.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: session.userId } },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({ users });
}
