/**
 * Signaling server for video calls.
 * Run with: npm run signaling
 *
 * - WebSocket: signaling (join, leave, offer, answer, ice-candidate, mute, screen-share)
 * - HTTP GET /presence?roomId=X: returns JSON { participants: ParticipantInfo[] }
 */

import * as http from "http";
import { WebSocketServer } from "ws";
import type { SignalingEvent, ServerEvent, ParticipantInfo } from "../lib/call/signaling-types";

// Port is read at startup; Render sets PORT (e.g. 10000). Local dev: SIGNALING_PORT or 3001.
function getPort(): number {
  const raw = process.env.PORT || process.env.SIGNALING_PORT || "3001";
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 3001 : n;
}

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

const server = http.createServer((req, res) => {
  // Health check for Render and other hosts (GET / or GET /health)
  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "signaling" }));
    return;
  }
  if (req.method === "GET" && req.url?.startsWith("/presence")) {
    const port = getPort();
    const u = new URL(req.url, `http://0.0.0.0:${port}`);
    const roomId = u.searchParams.get("roomId");
    if (!roomId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "roomId required" }));
      return;
    }
    const room = rooms.get(roomId);
    const participants = room ? Array.from(room.values()).map(toParticipantInfo) : [];
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ participants }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

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

// Render requires binding to 0.0.0.0 and listening on process.env.PORT (e.g. 10000).
const HOST = "0.0.0.0";
const PORT = getPort();
server.listen(PORT, HOST, () => {
  console.log(`Signaling server listening on ${HOST}:${PORT} (PORT=${process.env.PORT ?? "not set"})`);
  console.log(`WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`Presence API: http://0.0.0.0:${PORT}/presence?roomId=...`);
});
