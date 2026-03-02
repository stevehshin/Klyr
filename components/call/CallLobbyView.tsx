"use client";

import { useState } from "react";

export function CallLobbyView({
  roomLabel,
  onJoin,
  error,
  defaultAudioOnly = true,
}: {
  roomLabel: string;
  onJoin: (displayName: string, audioOnly: boolean) => void;
  error: string | null;
  defaultAudioOnly?: boolean;
}) {
  const [displayName, setDisplayName] = useState("");
  const [audioOnly, setAudioOnly] = useState(defaultAudioOnly);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(displayName.trim() || "Guest", audioOnly);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-[var(--call-radius)] bg-[var(--call-surface)]/80 border border-[var(--call-border)] p-6 shadow-[var(--call-shadow)] backdrop-blur-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--call-text)]">Join the room</h2>
            <p className="mt-2 text-sm text-[var(--call-muted)]">{roomLabel}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="callDisplayName" className="block text-sm font-medium text-[var(--call-muted)] mb-1.5">
                Your name
              </label>
              <input
                id="callDisplayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Guest"
                className="w-full px-4 py-2.5 rounded-[var(--call-radius-sm)] bg-[var(--call-bg)]/60 border border-[var(--call-border)] text-[var(--call-text)] placeholder:text-[var(--call-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--call-accent)] focus:border-transparent transition-shadow"
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={audioOnly}
                onChange={(e) => setAudioOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--call-border)] text-[var(--call-accent)] focus:ring-[var(--call-accent)]"
              />
              <span className="text-sm text-[var(--call-text)]">Audio only</span>
            </label>
            {error && <p role="alert" className="text-sm text-[var(--call-error)]">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-[var(--call-radius-sm)] bg-[var(--call-accent)] hover:bg-[var(--call-accent-hover)] text-white font-medium transition-colors"
            >
              Join call
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
