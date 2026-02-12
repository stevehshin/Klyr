"use client";

import { useRef, useEffect } from "react";
import type { RemoteParticipant } from "@/lib/call/call-state";

export function CallParticipantTile({
  participant,
  isLocal = false,
  isSpeaking = false,
}: {
  participant: RemoteParticipant;
  isLocal?: boolean;
  isSpeaking?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = participant.screenStream ?? participant.stream;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled) ?? false;

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-[var(--call-surface)] border-2 transition-all ${
        isSpeaking ? "border-[var(--call-accent)] shadow-lg" : "border-[var(--call-border)]"
      } aspect-video min-w-[200px]`}
      role="group"
      aria-label={`${participant.displayName}${participant.audioMuted ? ", muted" : ""}`}
    >
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--call-surface)]">
          <span className="text-4xl text-[var(--call-muted)]">{participant.displayName.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
        <span className="text-sm font-medium truncate text-[var(--call-text)]">{participant.displayName}</span>
        <div className="flex gap-1">
          {participant.audioMuted && <span className="px-1.5 py-0.5 rounded bg-[var(--call-error)]/80 text-xs">🎤</span>}
          {participant.videoMuted && <span className="px-1.5 py-0.5 rounded bg-[var(--call-muted)]/80 text-xs">📷</span>}
        </div>
      </div>
    </div>
  );
}
