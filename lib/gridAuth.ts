import { prisma } from "@/lib/prisma";

export type GridPermission = "none" | "view" | "edit";

/** Resolve user's permission for a grid: owner = edit, shared = view/edit from GridShare. */
export async function getGridPermission(
  userId: string,
  gridId: string
): Promise<GridPermission> {
  const grid = await prisma.grid.findUnique({
    where: { id: gridId },
    select: { ownerId: true, sharedWith: { where: { userId }, select: { permission: true } } },
  });
  if (!grid) return "none";
  if (grid.ownerId === userId) return "edit";
  const share = grid.sharedWith[0];
  if (!share) return "none";
  return share.permission === "edit" ? "edit" : "view";
}

/** Check if user can view grid (owner or shared). */
export async function canViewGrid(userId: string, gridId: string): Promise<boolean> {
  const perm = await getGridPermission(userId, gridId);
  return perm === "view" || perm === "edit";
}

/** Check if user can edit grid (owner or edit share). */
export async function canEditGrid(userId: string, gridId: string): Promise<boolean> {
  const perm = await getGridPermission(userId, gridId);
  return perm === "edit";
}
