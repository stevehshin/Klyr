/**
 * Fetch who is in a room (presence) from the signaling server.
 * Uses NEXT_PUBLIC_SIGNALING_URL in production, or localhost:3001 for local dev.
 */

export interface PresenceParticipant {
  id: string;
  displayName: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
}

function getPresenceBaseUrl(): string {
  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SIGNALING_URL : "";
  if (env && typeof env === "string" && env.trim()) {
    const url = env.trim();
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url.replace(/^wss?:\/\//, "")}`;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${host}:3001`;
}

export async function fetchRoomPresence(roomId: string): Promise<PresenceParticipant[]> {
  const base = getPresenceBaseUrl();
  const url = `${base}/presence?roomId=${encodeURIComponent(roomId)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.participants ?? [];
}
