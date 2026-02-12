import type { ParticipantInfo } from "./signaling-types";

export type CallState = "lobby" | "joining" | "in-call" | "reconnecting" | "ended";

export interface RemoteParticipant {
  id: string;
  displayName: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  isSpeaking: boolean;
}

export interface LocalState {
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
}

export interface CallStateData {
  state: CallState;
  roomId: string;
  localId: string | null;
  displayName: string;
  participants: RemoteParticipant[];
  local: LocalState;
  error: string | null;
}

export const initialState: CallStateData = {
  state: "lobby",
  roomId: "",
  localId: null,
  displayName: "",
  participants: [],
  local: {
    audioMuted: false,
    videoMuted: true,
    isScreenSharing: false,
    stream: null,
    screenStream: null,
  },
  error: null,
};

export function createRemoteParticipant(info: ParticipantInfo): RemoteParticipant {
  return {
    id: info.id,
    displayName: info.displayName,
    audioMuted: info.audioMuted,
    videoMuted: info.videoMuted,
    isScreenSharing: info.isScreenSharing,
    stream: null,
    screenStream: null,
    connectionState: "new",
    isSpeaking: false,
  };
}
