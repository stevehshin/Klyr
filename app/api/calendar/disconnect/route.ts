import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { googleCalendarRefreshToken: null },
    });
    return NextResponse.json({ connected: false });
  } catch (e) {
    console.error("Calendar disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
