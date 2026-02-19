import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditGrid } from "@/lib/gridAuth";

/** PATCH /api/grid/calendar/[eventId] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { eventId } = await params;
    const existing = await prisma.gridCalendarEvent.findUnique({
      where: { id: eventId },
      select: { gridId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const canEdit = await canEditGrid(session.userId, existing.gridId);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { title, description, startAt, endAt, isAllDay, color } = body;
    const data: Record<string, unknown> = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim().slice(0, 500);
    if (description !== undefined) data.description = typeof description === "string" ? description.trim().slice(0, 2000) || null : null;
    if (startAt) data.startAt = new Date(startAt);
    if (endAt) data.endAt = new Date(endAt);
    if (typeof isAllDay === "boolean") data.isAllDay = isAllDay;
    if (color !== undefined) data.color = typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null;
    const event = await prisma.gridCalendarEvent.update({
      where: { id: eventId },
      data,
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Grid calendar PATCH:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

/** DELETE /api/grid/calendar/[eventId] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { eventId } = await params;
    const existing = await prisma.gridCalendarEvent.findUnique({
      where: { id: eventId },
      select: { gridId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const canEdit = await canEditGrid(session.userId, existing.gridId);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.gridCalendarEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grid calendar DELETE:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
