import { RTC_CONFIG } from "./rtc-config";

export type PeerConnectionEvents = {
  onTrack: (peerId: string, stream: MediaStream, isScreenShare: boolean) => void;
  onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (peerId: string, state: RTCPeerConnectionState) => void;
};

export class PeerManager {
  private peers = new Map<string, RTCPeerConnection>();
  private events: PeerConnectionEvents;

  constructor(events: PeerConnectionEvents) {
    this.events = events;
  }

  createPeer(peerId: string) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) this.events.onTrack(peerId, stream, false);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) this.events.onIceCandidate(peerId, e.candidate);
    };
    pc.onconnectionstatechange = () => {
      this.events.onConnectionStateChange(peerId, pc.connectionState);
    };
    this.peers.set(peerId, pc);
    return pc;
  }

  getPeer(peerId: string) {
    return this.peers.get(peerId);
  }

  async createOffer(peerId: string, localStream: MediaStream) {
    const pc = this.getPeer(peerId) ?? this.createPeer(peerId);
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit, localStream: MediaStream) {
    const pc = this.getPeer(peerId) ?? this.createPeer(peerId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.getPeer(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.getPeer(peerId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Failed to add ICE candidate:", err);
    }
  }

  addScreenShareTrack(peerId: string, stream: MediaStream) {
    const pc = this.getPeer(peerId);
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender) {
      const track = stream.getVideoTracks()[0];
      if (track) sender.replaceTrack(track);
    } else {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    }
  }

  removeScreenShareTrack(peerId: string, cameraStream?: MediaStream | null) {
    const pc = this.getPeer(peerId);
    if (!pc) return;
    const cameraTrack = cameraStream?.getVideoTracks()[0] ?? null;
    const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (videoSender) videoSender.replaceTrack(cameraTrack);
  }

  destroyPeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
  }

  destroyAll() {
    for (const [, pc] of this.peers) pc.close();
    this.peers.clear();
  }

  getPeerIds() {
    return Array.from(this.peers.keys());
  }
}
