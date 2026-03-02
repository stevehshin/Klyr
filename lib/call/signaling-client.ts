import type { SignalingEvent, ServerEvent } from "./signaling-types";

/** WebSocket URL for the signaling server. Use NEXT_PUBLIC_SIGNALING_URL in production (e.g. wss://your-signaling.onrender.com). */
function getSignalingWsUrl(): string {
  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SIGNALING_URL : "";
  if (env && typeof env === "string" && env.trim()) {
    const url = env.trim();
    return url.startsWith("ws://") || url.startsWith("wss://") ? url : `wss://${url.replace(/^https?:\/\//, "")}`;
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `ws://${host}:3001`;
}
const WS_URL = getSignalingWsUrl();

export type SignalingClientEvents = {
  onMessage: (event: ServerEvent) => void;
  onClose: () => void;
  onError: (err: Event) => void;
};

export class SignalingClient {
  private ws: WebSocket | null = null;
  private events: SignalingClientEvents;

  constructor(events: SignalingClientEvents) {
    this.events = events;
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => resolve();
      this.ws.onmessage = (e) => {
        try {
          this.events.onMessage(JSON.parse(e.data) as ServerEvent);
        } catch (err) {
          console.error("Failed to parse signaling message:", err);
        }
      };
      this.ws.onclose = () => this.events.onClose();
      this.ws.onerror = (err) => {
        this.events.onError(err);
        reject(err);
      };
    });
  }

  send(event: SignalingEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
