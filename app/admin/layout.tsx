import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionWithUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getSessionWithUser();
  if (!data) {
    redirect("/login");
  }
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  const allowAccess = data.user.isAdmin || adminCount === 0;
  if (!allowAccess) {
    redirect("/grid");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Klyr Admin
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Users
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.user.email}
            </span>
            <Link
              href="/grid"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Back to workspace
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
