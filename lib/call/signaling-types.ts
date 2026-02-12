export type SignalingEvent =
  | { type: "join"; roomId: string; userId: string; displayName: string }
  | { type: "leave" }
  | { type: "offer"; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; to: string; candidate: RTCIceCandidateInit }
  | { type: "mute"; audio?: boolean; video?: boolean }
  | { type: "screen-share"; active: boolean };

export type ServerEvent =
  | { type: "room-joined"; roomId: string; yourId: string; participants: ParticipantInfo[] }
  | { type: "participant-joined"; participant: ParticipantInfo }
  | { type: "participant-left"; id: string }
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; from: string; candidate: RTCIceCandidateInit }
  | { type: "mute-update"; from: string; audio: boolean; video: boolean }
  | { type: "screen-share-update"; from: string; active: boolean }
  | { type: "error"; message: string };

export interface ParticipantInfo {
  id: string;
  displayName: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
}
