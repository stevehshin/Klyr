/**
 * Grid page data fetching via Neon HTTP (neon()) - bypasses Prisma/WebSocket for Vercel serverless.
 */
import { neon } from "@neondatabase/serverless";

export interface GridDataUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface GridDataGrid {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  isOwner: boolean;
}

export interface GridDataTile {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hidden: boolean;
  channelId?: string;
  channelName?: string;
  channelEmoji?: string;
  conversationId?: string;
  conversationName?: string;
  roomId: string;
  roomLabel: string;
}

export interface GridDataMember {
  id: string;
  email: string;
  displayName: string;
}

export interface GridDataResult {
  user: GridDataUser;
  allGrids: GridDataGrid[];
  currentGrid: {
    id: string;
    name: string;
    tiles: GridDataTile[];
    gridMembers: GridDataMember[];
  } | null;
}

export async function getGridData(
  userId: string,
  gridId: string | null
): Promise<GridDataResult | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  const sql = neon(connectionString);

  const [userRow] = await sql`
    SELECT id, email, "isAdmin" FROM "User" WHERE id = ${userId} LIMIT 1
  `;
  if (!userRow) return null;

  const user: GridDataUser = {
    id: userRow.id as string,
    email: userRow.email as string,
    isAdmin: userRow.isAdmin as boolean,
  };

  const ownedGrids = await sql`
    SELECT id, name, icon, "createdAt" FROM "Grid"
    WHERE "ownerId" = ${userId}
    ORDER BY "createdAt" ASC
  `;

  const sharedGridRows = await sql`
    SELECT g.id, g.name, g.icon, g."createdAt" FROM "GridShare" gs
    JOIN "Grid" g ON gs."gridId" = g.id
    WHERE gs."userId" = ${userId}
  `;

  const ownedIds = new Set((ownedGrids as { id: string }[]).map((r) => r.id));
  const allGrids: GridDataGrid[] = [
    ...(ownedGrids as { id: string; name: string; icon: string | null; createdAt: Date }[]).map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      createdAt: new Date(g.createdAt).toISOString(),
      isOwner: true,
    })),
    ...(sharedGridRows as { id: string; name: string; icon: string | null; createdAt: Date }[])
      .filter((g) => !ownedIds.has(g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        createdAt: new Date(g.createdAt).toISOString(),
        isOwner: false,
      })),
  ];

  const firstGridId = allGrids[0]?.id;
  const targetGridId = gridId ?? firstGridId;

  let currentGrid: GridDataResult["currentGrid"] = null;

  if (targetGridId) {
    const [gridRow] = await sql`
      SELECT g.id, g.name, g."ownerId" FROM "Grid" g
      WHERE g.id = ${targetGridId}
      AND (g."ownerId" = ${userId} OR EXISTS (
        SELECT 1 FROM "GridShare" gs WHERE gs."gridId" = g.id AND gs."userId" = ${userId}
      ))
      LIMIT 1
    `;

    if (gridRow) {
      const tiles = await sql`
        SELECT t.id, t.type, t.x, t.y, t.w, t.h, t.hidden, t."channelId", t."conversationId", t."callRoomLabel",
               c.name as channel_name, c.emoji as channel_emoji
        FROM "Tile" t
        LEFT JOIN "Channel" c ON t."channelId" = c.id
        WHERE t."gridId" = ${targetGridId} AND (t."onGrid" IS NOT FALSE)
        ORDER BY t."createdAt" ASC
      `;

      type TileRow = {
        id: string;
        type: string;
        x: number;
        y: number;
        w: number;
        h: number;
        hidden: boolean;
        channelId: string | null;
        conversationId: string | null;
        callRoomLabel: string | null;
        channel_name: string | null;
        channel_emoji: string | null;
      };
      const tilesWithMetadata: GridDataTile[] = (tiles as TileRow[]).map((t) => {
          const channelName = t.channel_name ?? undefined;
          const channelEmoji = t.channel_emoji ?? undefined;
          const conversationName = t.conversationId
            ? `Conversation ${t.conversationId.split("-")[0]}`
            : undefined;
          const roomId = t.channelId ?? t.conversationId ?? (gridRow as { id: string }).id;
          const roomLabel =
            t.callRoomLabel ??
            (t.channelId ? `${channelEmoji || "📢"} #${channelName}` : t.conversationId ? `Call with ${conversationName}` : (t.type === "loop_room" || t.type === "room") ? (t.callRoomLabel ?? (t.type === "room" ? "The Room" : "Loop room")) : "Grid call");
          return {
            id: t.id,
            type: t.type,
            x: t.x,
            y: t.y,
            w: t.w,
            h: t.h,
            hidden: t.hidden,
            channelId: t.channelId ?? undefined,
            channelName,
            channelEmoji,
            conversationId: t.conversationId ?? undefined,
            conversationName,
            roomId,
            roomLabel,
          };
        });

      const [ownerRow] = await sql`
        SELECT id, email, "displayName" FROM "User" WHERE id = ${(gridRow as { ownerId: string }).ownerId} LIMIT 1
      `;

      const shareRows = await sql`
        SELECT u.id, u.email, u."displayName" FROM "GridShare" gs
        JOIN "User" u ON gs."userId" = u.id
        WHERE gs."gridId" = ${targetGridId}
      `;

      const memberIds = new Set<string>();
      const gridMembers: GridDataMember[] = [];

      if (ownerRow) {
        memberIds.add(ownerRow.id as string);
        gridMembers.push({
          id: ownerRow.id as string,
          email: ownerRow.email as string,
          displayName:
            (ownerRow.displayName as string)?.trim() ||
            (ownerRow.email as string).split("@")[0] ||
            (ownerRow.email as string),
        });
      }

      for (const r of shareRows) {
        if (!memberIds.has(r.id as string)) {
          memberIds.add(r.id as string);
          gridMembers.push({
            id: r.id as string,
            email: r.email as string,
            displayName:
              (r.displayName as string)?.trim() ||
              (r.email as string).split("@")[0] ||
              (r.email as string),
          });
        }
      }

      currentGrid = {
        id: (gridRow as { id: string }).id,
        name: (gridRow as { name: string }).name,
        tiles: tilesWithMetadata,
        gridMembers,
      };
    }
  }

  return { user, allGrids, currentGrid };
}
