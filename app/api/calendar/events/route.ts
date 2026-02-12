import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccessTokenFromRefresh,
  fetchCalendarEvents,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const timeMin = request.nextUrl.searchParams.get("timeMin");
    const timeMax = request.nextUrl.searchParams.get("timeMax");
    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "timeMin and timeMax (ISO dates) are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { googleCalendarRefreshToken: true },
    });
    if (!user?.googleCalendarRefreshToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected", connected: false },
        { status: 403 }
      );
    }

    const accessToken = await getAccessTokenFromRefresh(
      user.googleCalendarRefreshToken
    );
    const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);
    return NextResponse.json({ events, connected: true });
  } catch (e) {
    console.error("Calendar events error:", e);
    const message = e instanceof Error ? e.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
