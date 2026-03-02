"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CallOverlay } from "@/components/call/CallOverlay";

function CallPageContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const roomLabel = searchParams.get("roomLabel") || "Call";
  const userEmail = searchParams.get("userEmail") || undefined;
  const defaultAudioOnly = searchParams.get("audioOnly") === "1";
  const isLoopRoom = searchParams.get("loopRoom") === "1";

  if (!roomId) {
    return (
      <div data-call-overlay className="min-h-screen flex flex-col items-center justify-center text-[var(--call-text)] p-6">
        <p className="text-[var(--call-muted)]">Missing room. Please start a call from your grid.</p>
      </div>
    );
  }

  return (
    <CallOverlay
      roomId={roomId}
      roomLabel={roomLabel}
      userEmail={userEmail}
      defaultAudioOnly={defaultAudioOnly}
      isLoopRoom={isLoopRoom}
      onClose={() => window.close()}
    />
  );
}

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div data-call-overlay className="min-h-screen flex items-center justify-center text-[var(--call-muted)]">
          Loading…
        </div>
      }
    >
      <CallPageContent />
    </Suspense>
  );
}
