import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditGrid } from "@/lib/gridAuth";

async function getTaskAndPermission(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, email: true } },
      createdBy: { select: { id: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!task) return { task: null, canEdit: false };
  const canEdit =
    task.createdByUserId === userId ||
    (task.visibility === "SHARED" && (await canEditGrid(userId, task.gridId)));
  return { task, canEdit };
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { task, canEdit } = await getTaskAndPermission(id, session.userId);
    if (!task || !canEdit) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueAt,
      assigneeUserId,
      projectId,
      visibility,
      calendarEventId,
    } = body;
    const data: any = {};
    if (typeof title === "string" && title.trim()) data.title = title.trim();
    if (description !== undefined)
      data.description = typeof description === "string" ? description.trim() || null : null;
    if (["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"].includes(status)) data.status = status;
    if (["LOW", "MEDIUM", "HIGH"].includes(priority)) data.priority = priority;
    if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
    if (assigneeUserId !== undefined) data.assigneeUserId = assigneeUserId || null;
    if (projectId !== undefined) data.projectId = projectId || null;
    if (visibility === "PRIVATE" || visibility === "SHARED") data.visibility = visibility;
    if (calendarEventId !== undefined) data.calendarEventId = calendarEventId || null;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, email: true } },
        createdBy: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { task, canEdit } = await getTaskAndPermission(id, session.userId);
    if (!task || !canEdit) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
