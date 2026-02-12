"use client";

import { useState } from "react";
import { useCall } from "@/lib/call/use-call";
import { CallLobbyView } from "./CallLobbyView";
import { CallParticipantGrid } from "./CallParticipantGrid";
import { CallControlBar } from "./CallControlBar";
import type { CallStateData } from "@/lib/call/call-state";

export interface CallOverlayProps {
  roomId: string;
  roomLabel: string;
  userEmail?: string;
  onClose: () => void;
}

export function CallOverlay({ roomId, roomLabel, userEmail, onClose }: CallOverlayProps) {
  const [toast, setToast] = useState<string | null>(null);

  const { data, join, leave, toggleMute, toggleVideo, toggleScreenShare } = useCall({
    roomId,
    onToast: setToast,
  });

  const handleLeave = () => {
    leave();
    onClose();
  };

  const displayName = userEmail ? userEmail.split("@")[0] : "Guest";

  return (
    <div
      data-call-overlay
      className="fixed inset-0 z-[100] bg-[var(--call-bg)] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Video call"
    >
      {/* Close button when in lobby or joining */}
      {(data.state === "lobby" || data.state === "joining" || data.state === "ended") && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--call-surface)] text-[var(--call-text)] hover:bg-[var(--call-border)] z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {data.state === "lobby" || data.state === "ended" ? (
        <CallLobbyView roomLabel={roomLabel} onJoin={(name, audioOnly) => join(name, audioOnly)} error={data.error} />
      ) : data.state === "joining" ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--call-muted)]">Joining…</p>
        </div>
      ) : data.state === "reconnecting" ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--call-muted)]">Reconnecting…</p>
        </div>
      ) : (
        <>
          <main className="flex-1 overflow-auto">
            <CallParticipantGrid
              participants={data.participants}
              local={data.local}
              localDisplayName={data.displayName || displayName}
            />
          </main>
          <CallControlBar
            muted={data.local.audioMuted}
            videoOff={data.local.videoMuted}
            screenSharing={data.local.isScreenSharing}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
            onLeave={handleLeave}
          />
          <p className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs text-[var(--call-muted)] hidden sm:block">
            M mute · V video · S screen · L leave
          </p>
        </>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[var(--call-surface)] border border-[var(--call-border)] text-sm text-[var(--call-text)] shadow-lg z-50"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
