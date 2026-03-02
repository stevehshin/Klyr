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
  const audioRef = useRef<HTMLAudioElement>(null);
  const stream = participant.screenStream ?? participant.stream;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Dedicated audio element for remote participants so browser actually plays remote audio
  useEffect(() => {
    if (isLocal || !stream) return;
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.srcObject = stream;
    const play = () => audioEl.play().catch(() => {});
    play();
    // Re-play when new tracks are added (e.g. audio arrives after video) so we hear remote audio
    stream.addEventListener("addtrack", play);
    return () => {
      stream.removeEventListener("addtrack", play);
      audioEl.srcObject = null;
    };
  }, [isLocal, stream]);

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled) ?? false;

  return (
    <div
      className={`relative rounded-[var(--call-radius)] overflow-hidden bg-[var(--call-surface)] border-2 transition-all shadow-[var(--call-shadow-sm)] ${
        isSpeaking ? "border-[var(--call-accent)] shadow-[0 0 0 1px var(--call-accent)]" : "border-[var(--call-border)]"
      } aspect-video min-w-[200px]`}
      role="group"
      aria-label={`${participant.displayName}${participant.audioMuted ? ", muted" : ""}`}
    >
      {!isLocal && stream ? (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      ) : null}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--call-surface-elevated)]">
          <span className="text-4xl font-medium text-[var(--call-muted)]">{participant.displayName.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
        <span className="text-sm font-medium truncate text-[var(--call-text)] drop-shadow-sm">{participant.displayName}</span>
        <div className="flex gap-1">
          {participant.audioMuted && <span className="px-1.5 py-0.5 rounded-md bg-[var(--call-error)]/90 text-xs text-white">Muted</span>}
          {participant.videoMuted && <span className="px-1.5 py-0.5 rounded-md bg-[var(--call-muted)]/80 text-xs text-[var(--call-text)]">Camera off</span>}
        </div>
      </div>
    </div>
  );
}
