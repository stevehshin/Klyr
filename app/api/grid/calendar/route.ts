import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

/** GET /api/grid/calendar?gridId=xxx&timeMin=ISO&timeMax=ISO */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const gridId = request.nextUrl.searchParams.get("gridId");
    const timeMin = request.nextUrl.searchParams.get("timeMin");
    const timeMax = request.nextUrl.searchParams.get("timeMax");
    if (!gridId) {
      return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    }
    const canView = await canViewGrid(session.userId, gridId);
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await prisma.gridCalendarEvent.findMany({
      where: {
        gridId,
        ...(timeMin && timeMax
          ? {
              startAt: { lte: new Date(timeMax) },
              endAt: { gte: new Date(timeMin) },
            }
          : {}),
      },
      orderBy: { startAt: "asc" },
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Grid calendar GET:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/grid/calendar - create event */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { gridId, title, description, startAt, endAt, isAllDay, color } = body;
    if (!gridId || !title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "gridId and title are required" },
        { status: 400 }
      );
    }
    const canEdit = await canEditGrid(session.userId, gridId);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const start = startAt ? new Date(startAt) : new Date();
    const end = endAt ? new Date(endAt) : new Date(start.getTime() + 60 * 60 * 1000);
    if (end < start) {
      return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
    }
    const event = await prisma.gridCalendarEvent.create({
      data: {
        gridId,
        title: title.trim().slice(0, 500),
        description: typeof description === "string" ? description.trim().slice(0, 2000) || null : null,
        startAt: start,
        endAt: end,
        isAllDay: !!isAllDay,
        color: typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null,
        createdByUserId: session.userId,
      },
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Grid calendar POST:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
