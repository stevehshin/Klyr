import { getSessionWithUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminClaimBootstrap } from "./AdminClaimBootstrap";

export default async function AdminDashboardPage() {
  const data = await getSessionWithUser();
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  const isBootstrap = !data?.user.isAdmin && adminCount === 0;

  if (isBootstrap) {
    return <AdminClaimBootstrap userId={data!.user.id} userEmail={data!.user.email} />;
  }
  if (!data?.user.isAdmin) {
    return null;
  }

  const [userCount, gridCount, channelCount, tileCount] = await Promise.all([
    prisma.user.count(),
    prisma.grid.count(),
    prisma.channel.count(),
    prisma.tile.count({ where: { hidden: false } }),
  ]);

  const stats = [
    { label: "Registered users", value: userCount, href: "/admin/users" },
    { label: "Grids", value: gridCount, href: null },
    { label: "Channels", value: channelCount, href: null },
    { label: "Tiles (visible)", value: tileCount, href: null },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {s.value}
            </p>
            {s.href && (
              <Link
                href={s.href}
                className="mt-2 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
