import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

function canViewTask(
  task: { visibility: string; createdByUserId: string },
  userId: string,
  canViewGridResult: boolean
): boolean {
  if (task.visibility === "PRIVATE") return task.createdByUserId === userId;
  return canViewGridResult;
}

function canEditTask(
  task: { visibility: string; createdByUserId: string },
  userId: string,
  canEditGridResult: boolean
): boolean {
  if (task.visibility === "PRIVATE") return task.createdByUserId === userId;
  return canEditGridResult;
}

// GET /api/tasks?gridId=xxx&status=...&assigneeUserId=...&projectId=...&visibility=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const gridId = request.nextUrl.searchParams.get("gridId");
    if (!gridId) {
      return NextResponse.json({ error: "gridId is required" }, { status: 400 });
    }
    const canView = await canViewGrid(session.userId, gridId);
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = request.nextUrl.searchParams.get("status");
    const assigneeUserId = request.nextUrl.searchParams.get("assigneeUserId");
    const projectId = request.nextUrl.searchParams.get("projectId");
    const visibility = request.nextUrl.searchParams.get("visibility");

    const where: any = {
      gridId,
      OR: [
        { visibility: "SHARED" },
        { createdByUserId: session.userId },
      ],
    };
    if (status && ["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"].includes(status)) {
      where.status = status;
    }
    if (assigneeUserId !== null && assigneeUserId !== undefined && assigneeUserId !== "") {
      if (assigneeUserId === "__unassigned__") {
        where.assigneeUserId = null;
      } else {
        where.assigneeUserId = assigneeUserId;
      }
    }
    if (projectId) where.projectId = projectId;
    if (visibility === "PRIVATE" || visibility === "SHARED") where.visibility = visibility;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      include: {
        assignee: { select: { id: true, email: true } },
        createdBy: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to list tasks:", error);
    return NextResponse.json(
      { error: "Failed to list tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const {
      gridId,
      projectId,
      title,
      description,
      status,
      priority,
      dueAt,
      assigneeUserId,
      visibility,
      calendarEventId,
    } = body;
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
    const vis = visibility === "PRIVATE" ? "PRIVATE" : "SHARED";
    const st = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"].includes(status) ? status : "BACKLOG";
    const pri = ["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM";
    const task = await prisma.task.create({
      data: {
        gridId,
        projectId: projectId || null,
        title: title.trim(),
        description: typeof description === "string" ? description.trim() || null : null,
        status: st,
        priority: pri,
        dueAt: dueAt ? new Date(dueAt) : null,
        assigneeUserId: assigneeUserId || null,
        createdByUserId: session.userId,
        visibility: vis,
        calendarEventId: calendarEventId || null,
      },
      include: {
        assignee: { select: { id: true, email: true } },
        createdBy: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
