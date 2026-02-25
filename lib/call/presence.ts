/**
 * Fetch who is in a room (presence) from the signaling server.
 * The signaling server must be running (npm run signaling).
 */

const PRESENCE_PORT = 3001;

export interface PresenceParticipant {
  id: string;
  displayName: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
}

export async function fetchRoomPresence(roomId: string): Promise<PresenceParticipant[]> {
  const host =
    typeof window !== "undefined"
      ? window.location.hostname
      : "localhost";
  const url = `http://${host}:${PRESENCE_PORT}/presence?roomId=${encodeURIComponent(roomId)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.participants ?? [];
}
