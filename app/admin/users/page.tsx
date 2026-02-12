import { getSessionWithUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const data = await getSessionWithUser();
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (!data?.user.isAdmin && adminCount > 0) {
    redirect("/grid");
  }
  if (!data?.user.isAdmin) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { grids: true, ownedChannels: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = users.map((u) => ({
    id: u.id,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt.toISOString(),
    gridCount: u._count.grids,
    channelCount: u._count.ownedChannels,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Users
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Grant or revoke admin access. Only admins can access /admin. If there are no admins, any logged-in user can grant admin once.
      </p>
      <AdminUsersClient initialUsers={list} currentUserId={data.user.id} />
    </div>
  );
}
