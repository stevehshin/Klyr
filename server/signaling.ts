/**
 * Signaling server for video calls.
 * Run with: npm run signaling
 */

import { WebSocketServer } from "ws";
import type { SignalingEvent, ServerEvent, ParticipantInfo } from "../lib/call/signaling-types";

const PORT = parseInt(process.env.SIGNALING_PORT || "3001", 10);

interface ClientConnection {
  ws: import("ws").WebSocket;
  id: string;
  roomId: string;
  displayName: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
}

const rooms = new Map<string, Map<string, ClientConnection>>();

function getOrCreateRoom(roomId: string): Map<string, ClientConnection> {
  let room = rooms.get(roomId);
  if (!room) {
    room = new Map();
    rooms.set(roomId, room);
  }
  return room;
}

function toParticipantInfo(c: ClientConnection): ParticipantInfo {
  return {
    id: c.id,
    displayName: c.displayName,
    audioMuted: c.audioMuted,
    videoMuted: c.videoMuted,
    isScreenSharing: c.isScreenSharing,
  };
}

function broadcastToRoom(roomId: string, excludeId: string | null, event: ServerEvent) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(event);
  for (const [id, conn] of room) {
    if (id !== excludeId && conn.ws.readyState === 1) {
      conn.ws.send(payload);
    }
  }
}

function sendTo(conn: ClientConnection, event: ServerEvent) {
  if (conn.ws.readyState === 1) {
    conn.ws.send(JSON.stringify(event));
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  let conn: ClientConnection | null = null;

  ws.on("message", (data) => {
    try {
      const event = JSON.parse(data.toString()) as SignalingEvent;

      switch (event.type) {
        case "join": {
          const room = getOrCreateRoom(event.roomId);
          const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          conn = {
            ws,
            id,
            roomId: event.roomId,
            displayName: event.displayName,
            audioMuted: false,
            videoMuted: true,
            isScreenSharing: false,
          };
          room.set(id, conn);

          const participants = Array.from(room.values()).map(toParticipantInfo);
          sendTo(conn, { type: "room-joined", roomId: event.roomId, yourId: id, participants });

          broadcastToRoom(event.roomId, id, {
            type: "participant-joined",
            participant: toParticipantInfo(conn),
          });
          break;
        }

        case "leave": {
          if (conn) {
            const room = rooms.get(conn.roomId);
            if (room) {
              room.delete(conn.id);
              broadcastToRoom(conn.roomId, null, { type: "participant-left", id: conn.id });
              if (room.size === 0) rooms.delete(conn.roomId);
            }
            conn = null;
          }
          break;
        }

        case "offer":
        case "answer":
        case "ice-candidate": {
          if (!conn) break;
          const target = rooms.get(conn.roomId)?.get(event.to);
          if (target) {
            const relay =
              event.type === "offer"
                ? { type: "offer" as const, from: conn.id, sdp: event.sdp }
                : event.type === "answer"
                  ? { type: "answer" as const, from: conn.id, sdp: event.sdp }
                  : { type: "ice-candidate" as const, from: conn.id, candidate: event.candidate };
            sendTo(target, relay);
          }
          break;
        }

        case "mute": {
          if (!conn) break;
          if (event.audio !== undefined) conn.audioMuted = event.audio;
          if (event.video !== undefined) conn.videoMuted = event.video;
          broadcastToRoom(conn.roomId, conn.id, {
            type: "mute-update",
            from: conn.id,
            audio: conn.audioMuted,
            video: conn.videoMuted,
          });
          break;
        }

        case "screen-share": {
          if (!conn) break;
          conn.isScreenSharing = event.active;
          broadcastToRoom(conn.roomId, conn.id, {
            type: "screen-share-update",
            from: conn.id,
            active: event.active,
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      if (conn) sendTo(conn, { type: "error", message: "Invalid message" });
    }
  });

  ws.on("close", () => {
    if (conn) {
      const room = rooms.get(conn.roomId);
      if (room) {
        room.delete(conn.id);
        broadcastToRoom(conn.roomId, null, { type: "participant-left", id: conn.id });
        if (room.size === 0) rooms.delete(conn.roomId);
      }
    }
  });
});

console.log(`Signaling server listening on ws://localhost:${PORT}`);
