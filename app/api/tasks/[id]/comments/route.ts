import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid } from "@/lib/gridAuth";

async function canAccessTaskForComment(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { visibility: true, createdByUserId: true, gridId: true },
  });
  if (!task) return false;
  if (task.visibility === "PRIVATE") return task.createdByUserId === userId;
  return canViewGrid(userId, task.gridId);
}

// GET /api/tasks/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const taskId = id;
    const canAccess = await canAccessTaskForComment(taskId, session.userId);
    if (!canAccess) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Failed to list comments:", error);
    return NextResponse.json(
      { error: "Failed to list comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - encryptedContent in body
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const taskId = id;
    const canAccess = await canAccessTaskForComment(taskId, session.userId);
    if (!canAccess) {
      return NextResponse.json({ error: "Task not found or forbidden" }, { status: 404 });
    }
    const body = await request.json();
    const { encryptedContent } = body;
    if (typeof encryptedContent !== "string") {
      return NextResponse.json(
        { error: "encryptedContent is required" },
        { status: 400 }
      );
    }
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: session.userId,
        encryptedContent,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
