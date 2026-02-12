"use client";

import { CallParticipantTile } from "./CallParticipantTile";
import type { RemoteParticipant, LocalState } from "@/lib/call/call-state";

export function CallParticipantGrid({
  participants,
  local,
  localDisplayName,
}: {
  participants: RemoteParticipant[];
  local: LocalState;
  localDisplayName: string;
}) {
  const gridClass = participants.length + 1 <= 2 ? "grid-cols-2" : participants.length + 1 <= 4 ? "grid-cols-2" : "grid-cols-3";
  const localParticipant = {
    id: "local",
    displayName: localDisplayName,
    audioMuted: local.audioMuted,
    videoMuted: local.videoMuted,
    isScreenSharing: local.isScreenSharing,
    stream: local.isScreenSharing ? local.screenStream : local.stream,
    screenStream: local.screenStream,
    connectionState: "connected" as const,
    isSpeaking: false,
  };

  return (
    <div className={`grid gap-4 p-4 ${gridClass} place-items-center`} role="list" aria-label="Participants">
      <div role="listitem">
        <CallParticipantTile participant={localParticipant} isLocal />
      </div>
      {participants.map((p) => (
        <div key={p.id} role="listitem">
          <CallParticipantTile participant={p} />
        </div>
      ))}
    </div>
  );
}
