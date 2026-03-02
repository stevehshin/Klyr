import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { canEditGridNeon } from "@/lib/neonDb";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gridId, type, channelId, channelName, channelEmoji, conversationId, conversationName, roomId, roomLabel, onGrid } = body;

    if (!gridId || !type) {
      return NextResponse.json(
        { error: "Grid ID and type are required" },
        { status: 400 }
      );
    }

    if (!(await canEditGridNeon(session.userId, gridId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL not set");
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const sql = neon(dbUrl);

    // Get existing on-grid tiles to find next available position
    const existingRows = await sql`
      SELECT id, x, y, w, h FROM "Tile"
      WHERE "gridId" = ${gridId} AND hidden = false AND "onGrid" = true
      ORDER BY y DESC
      LIMIT 1
    `;
    const bottomTile = Array.isArray(existingRows) ? existingRows[0] : (existingRows as { rows?: unknown[] })?.rows?.[0];
    let newY = 0;
    if (bottomTile) {
      const t = bottomTile as { y: number; h: number };
      newY = t.y + t.h;
    }

    // When onGrid is false (e.g. DM in panel first), don't use grid position yet
    const placeOnGrid = onGrid !== false;

    let channelIdVal: string | null = null;
    let conversationIdVal: string | null = null;
    let callRoomLabelVal: string | null = null;

    if (type === "channel" && channelId) channelIdVal = channelId;
    if (type === "dm" && conversationId) conversationIdVal = conversationId;
    if (type === "call" && roomLabel) callRoomLabelVal = roomLabel;
    if (type === "call" && channelId) channelIdVal = channelId;
    if (type === "call" && conversationId) conversationIdVal = conversationId;
    if (type === "loop_room") {
      callRoomLabelVal = (body.title || body.roomLabel || "Loop room").toString().trim().slice(0, 120);
    }
    if (type === "room") {
      callRoomLabelVal = (body.title || body.roomLabel || "The Room").toString().trim().slice(0, 120);
    }

    const rows = await sql`
      INSERT INTO "Tile" (id, "gridId", type, x, y, w, h, hidden, "onGrid", "channelId", "conversationId", "callRoomLabel")
      VALUES (gen_random_uuid()::text, ${gridId}, ${type}, 0, ${placeOnGrid ? newY : 0}, 4, 3, false, ${placeOnGrid}, ${channelIdVal}, ${conversationIdVal}, ${callRoomLabelVal})
      RETURNING id, "gridId", type, x, y, w, h, hidden, "onGrid", "channelId", "conversationId", "callRoomLabel", "createdAt"
    `;
    const tileRow = Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] })?.rows?.[0];
    if (!tileRow) {
      console.error("Tile INSERT returned no rows");
      return NextResponse.json({ error: "Failed to create tile" }, { status: 500 });
    }

    const tile = tileRow as Record<string, unknown>;
    const effectiveRoomId = (type === "loop_room" || type === "room") ? tile.id : (channelId ?? conversationId ?? gridId);
    const effectiveRoomLabel =
      (type === "loop_room" || type === "room")
        ? ((tile.callRoomLabel as string) ?? (type === "room" ? "The Room" : "Loop room"))
        : (roomLabel ?? (tile.callRoomLabel as string) ?? (channelId ? `${channelEmoji || "📢"} #${channelName}` : conversationId ? `Call with ${conversationName}` : "Grid call"));

    const tileWithMetadata = {
      ...tile,
      channelName,
      channelEmoji,
      conversationId,
      conversationName,
      roomId: effectiveRoomId,
      roomLabel: effectiveRoomLabel,
    };

    return NextResponse.json({ success: true, tile: tileWithMetadata });
  } catch (error) {
    console.error("Failed to create tile:", error);
    return NextResponse.json(
      { error: "Failed to create tile" },
      { status: 500 }
    );
  }
}
