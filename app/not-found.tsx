import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Image
        src="/klyr-logo.png"
        alt="Klyr"
        width={180}
        height={56}
        className="h-12 w-auto object-contain dark:invert mb-8"
      />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/grid"
        className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
      >
        Back to workspace
      </Link>
    </div>
  );
}
