import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 15;

// GET - Fetch all channel groups and ungrouped channels for a user (Neon HTTP for Vercel reliability)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const groupRows = await sql`
      SELECT id, name, "order", "ownerId"
      FROM "ChannelGroup"
      WHERE "ownerId" = ${session.userId}
      ORDER BY "order" ASC
    `;
    const groups = await Promise.all(
      (groupRows as { id: string; name: string; order: number }[]).map(async (g) => {
        const channels = await sql`
          SELECT id, name, emoji, "isPrivate"
          FROM "Channel"
          WHERE "channelGroupId" = ${g.id}
          ORDER BY "createdAt" ASC
        `;
        return {
          ...g,
          channels: (channels as { id: string; name: string; emoji: string; isPrivate: boolean }[]).map((c) => ({
            id: c.id,
            name: c.name,
            emoji: c.emoji ?? "📢",
            isPrivate: c.isPrivate ?? false,
          })),
        };
      })
    );
    const ungroupedRows = await sql`
      SELECT id, name, emoji, "isPrivate"
      FROM "Channel"
      WHERE "channelGroupId" IS NULL
        AND ("ownerId" = ${session.userId}
             OR EXISTS (SELECT 1 FROM "ChannelMember" m WHERE m."channelId" = "Channel".id AND m."userId" = ${session.userId}))
      ORDER BY "createdAt" DESC
    `;
    const ungroupedChannels = (ungroupedRows as { id: string; name: string; emoji: string; isPrivate: boolean }[]).map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji ?? "📢",
      isPrivate: c.isPrivate ?? false,
    }));
    return NextResponse.json({ groups, ungroupedChannels });
  } catch (error) {
    console.error("Failed to fetch channel groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel groups" },
      { status: 500 }
    );
  }
}

// POST - Create a new channel group
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const [maxRow] = await sql`
      SELECT "order" FROM "ChannelGroup"
      WHERE "ownerId" = ${session.userId}
      ORDER BY "order" DESC
      LIMIT 1
    `;
    const nextOrder = (maxRow as { order?: number } | undefined)?.order ?? -1;
    const [groupRow] = await sql`
      INSERT INTO "ChannelGroup" (id, name, "order", "ownerId")
      VALUES (gen_random_uuid()::text, ${name.trim()}, ${nextOrder + 1}, ${session.userId})
      RETURNING id, name, "order", "ownerId"
    `;
    const group = groupRow as { id: string; name: string; order: number; ownerId: string };
    return NextResponse.json({ group });
  } catch (error) {
    console.error("Failed to create channel group:", error);
    return NextResponse.json(
      { error: "Failed to create channel group" },
      { status: 500 }
    );
  }
}
