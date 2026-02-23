import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getGridData } from "@/lib/grid-data";
import { GridWorkspace } from "./GridWorkspace";

export const dynamic = "force-dynamic";

export default async function GridPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let session;
  try {
    session = await getSession();
  } catch (e) {
    console.error("Grid getSession error:", e);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const gridId = params.id || null;

  let data;
  try {
    data = await getGridData(session.userId, gridId);
  } catch (e) {
    console.error("Grid getGridData error:", e);
    throw e;
  }

  if (!data) {
    redirect("/login");
  }

  const { user, allGrids, currentGrid } = data;
  const gridMembers = currentGrid?.gridMembers ?? [];

  return (
    <GridWorkspace
      initialGrids={allGrids}
      currentGrid={
        currentGrid
          ? { id: currentGrid.id, name: currentGrid.name, tiles: currentGrid.tiles }
          : null
      }
      userId={user.id}
      userEmail={user.email}
      userIsAdmin={user.isAdmin}
      gridMembers={gridMembers}
    />
  );
}
