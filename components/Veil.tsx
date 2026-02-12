"use client";

export interface VeilProps {
  onRequestAccess?: () => void;
}

export function Veil({ onRequestAccess }: VeilProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/40 dark:border-white/5 transition-opacity duration-200 hover:bg-white/70 dark:hover:bg-gray-900/70"
      role="presentation"
    >
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-200/80 dark:bg-gray-700/80 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Restricted</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px]">
          You don’t have access to this content.
        </p>
        {onRequestAccess && (
          <button
            type="button"
            onClick={onRequestAccess}
            className="mt-1 px-4 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 rounded-lg hover:bg-primary-500/10 transition-colors"
          >
            Request Access
          </button>
        )}
      </div>
    </div>
  );
}
