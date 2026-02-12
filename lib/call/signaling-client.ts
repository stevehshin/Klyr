import type { SignalingEvent, ServerEvent } from "./signaling-types";

const WS_URL =
  typeof window !== "undefined"
    ? `ws://${window.location.hostname}:3001`
    : "ws://localhost:3001";

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
