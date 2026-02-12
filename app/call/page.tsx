"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CallOverlay } from "@/components/call/CallOverlay";

function CallPageContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const roomLabel = searchParams.get("roomLabel") || "Call";
  const userEmail = searchParams.get("userEmail") || undefined;

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[var(--call-bg)] flex items-center justify-center text-[var(--call-text)]">
        <p>Missing room. Please start a call from your grid.</p>
      </div>
    );
  }

  return (
    <CallOverlay
      roomId={roomId}
      roomLabel={roomLabel}
      userEmail={userEmail}
      onClose={() => window.close()}
    />
  );
}

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--call-bg)] flex items-center justify-center text-[var(--call-text)]">
          Loading…
        </div>
      }
    >
      <CallPageContent />
    </Suspense>
  );
}
