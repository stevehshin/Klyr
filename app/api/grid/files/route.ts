import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewGrid } from "@/lib/gridAuth";

/** GET /api/grid/files?gridId=xxx - List files for grid (shared with everyone who can view grid) */
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

    const files = await prisma.gridFile.findMany({
      where: { gridId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        createdAt: true,
        uploadedByUserId: true,
        uploadedBy: { select: { id: true, email: true } },
      },
    });
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Grid files GET:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
