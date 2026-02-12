import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { googleCalendarRefreshToken: true },
    });
    const connected = !!user?.googleCalendarRefreshToken;
    return NextResponse.json({ connected });
  } catch (e) {
    console.error("Calendar status error:", e);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
