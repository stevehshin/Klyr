/**
 * Neon HTTP (neon()) helpers for API routes - bypasses Prisma/WebSocket timeout on Vercel.
 */
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}

export type GridPermission = "none" | "view" | "edit" | "admin";

export async function getGridPermissionNeon(
  userId: string,
  gridId: string
): Promise<GridPermission> {
  const sql = getSql();
  const [grid] = await sql`
    SELECT "ownerId" FROM "Grid" WHERE id = ${gridId} LIMIT 1
  `;
  if (!grid) return "none";
  if ((grid as { ownerId: string }).ownerId === userId) return "edit"; // owner has full rights
  const [share] = await sql`
    SELECT permission FROM "GridShare" WHERE "gridId" = ${gridId} AND "userId" = ${userId} LIMIT 1
  `;
  if (!share) return "none";
  const p = (share as { permission: string }).permission;
  if (p === "admin" || p === "edit" || p === "view") return p as GridPermission;
  return "view";
}

export async function canViewGridNeon(userId: string, gridId: string): Promise<boolean> {
  const perm = await getGridPermissionNeon(userId, gridId);
  return perm === "view" || perm === "edit" || perm === "admin";
}

export async function canEditGridNeon(userId: string, gridId: string): Promise<boolean> {
  const perm = await getGridPermissionNeon(userId, gridId);
  return perm === "edit" || perm === "admin";
}

/** Owner or grid admin can manage members (assign admin, remove). */
export async function canManageGridNeon(userId: string, gridId: string): Promise<boolean> {
  const sql = getSql();
  const [grid] = await sql`
    SELECT "ownerId" FROM "Grid" WHERE id = ${gridId} LIMIT 1
  `;
  if (!grid) return false;
  if ((grid as { ownerId: string }).ownerId === userId) return true;
  const [share] = await sql`
    SELECT permission FROM "GridShare" WHERE "gridId" = ${gridId} AND "userId" = ${userId} LIMIT 1
  `;
  return (share as { permission: string } | undefined)?.permission === "admin";
}

export async function getTileGridIdNeon(tileId: string): Promise<string | null> {
  const sql = getSql();
  const [row] = await sql`SELECT "gridId" FROM "Tile" WHERE id = ${tileId} LIMIT 1`;
  return (row as { gridId: string } | undefined)?.gridId ?? null;
}
