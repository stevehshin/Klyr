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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--call-text)]">Join call</h2>
          <p className="mt-2 text-sm text-[var(--call-muted)]">{roomLabel}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="callDisplayName" className="block text-sm font-medium text-[var(--call-muted)] mb-1">
              Your name
            </label>
            <input
              id="callDisplayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Guest"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--call-surface)] border border-[var(--call-border)] text-[var(--call-text)] placeholder:text-[var(--call-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--call-accent)]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--call-border)] text-[var(--call-accent)]"
            />
            <span className="text-sm text-[var(--call-text)]">Audio only</span>
          </label>
          {error && <p role="alert" className="text-sm text-[var(--call-error)]">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--call-accent)] text-white font-medium hover:opacity-90"
          >
            Join call
          </button>
        </form>
      </div>
    </div>
  );
}
