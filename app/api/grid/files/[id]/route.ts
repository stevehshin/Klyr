import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid, canEditGrid } from "@/lib/gridAuth";

/** GET /api/grid/files/[id]?download=1 - Get file for preview or download (inline vs attachment) */
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
    const download = request.nextUrl.searchParams.get("download") === "1";

    const file = await prisma.gridFile.findUnique({
      where: { id },
      select: { gridId: true, name: true, mimeType: true, size: true, data: true },
    });
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const canView = await canViewGrid(session.userId, file.gridId);
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = Buffer.from(file.data);
    const disposition = download ? `attachment; filename="${file.name.replace(/"/g, '\\"')}"` : "inline";
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": disposition,
        "Content-Length": String(file.size),
      },
    });
  } catch (error) {
    console.error("Grid file GET:", error);
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
  }
}

/** DELETE /api/grid/files/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const file = await prisma.gridFile.findUnique({
      where: { id },
      select: { gridId: true },
    });
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const canEdit = await canEditGrid(session.userId, file.gridId);
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.gridFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grid file DELETE:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
