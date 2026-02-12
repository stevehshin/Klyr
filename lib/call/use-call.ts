"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEvent } from "./signaling-types";
import { SignalingClient } from "./signaling-client";
import { PeerManager } from "./peer-manager";
import {
  getLocalStream,
  getScreenStream,
  stopStream,
  getAudioTrack,
  getVideoTrack,
  muteTrack,
  unmuteTrack,
} from "./media-stream";
import {
  type CallStateData,
  initialState,
  createRemoteParticipant,
} from "./call-state";

type CallState = CallStateData["state"];

export interface UseCallOptions {
  roomId: string;
  onStateChange?: (state: CallState) => void;
  onToast?: (message: string) => void;
}

export function useCall({ roomId, onStateChange, onToast }: UseCallOptions) {
  const [data, setData] = useState<CallStateData>({ ...initialState, roomId, displayName: "" });
  const signalingRef = useRef<SignalingClient | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const toast = useCallback((msg: string) => onToast?.(msg), [onToast]);

  const updateState = useCallback((updater: (d: CallStateData) => CallStateData) => {
    setData((prev) => {
      const next = updater(prev);
      onStateChange?.(next.state);
      return next;
    });
  }, [onStateChange]);

  const cleanup = useCallback(() => {
    peerManagerRef.current?.destroyAll();
    peerManagerRef.current = null;
    signalingRef.current?.disconnect();
    signalingRef.current = null;
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
  }, []);

  const leave = useCallback(() => {
    signalingRef.current?.send({ type: "leave" });
    cleanup();
    updateState((d) => ({ ...d, state: "ended", participants: [], localId: null }));
  }, [cleanup, updateState]);

  const handleServerEvent = useCallback(
    (event: ServerEvent, peerManager: PeerManager) => {
      switch (event.type) {
        case "room-joined":
          setData((prev) => {
            const participants = event.participants
              .filter((p) => p.id !== event.yourId)
              .map(createRemoteParticipant);
            return {
              ...prev,
              state: "in-call" as const,
              localId: event.yourId,
              participants,
              displayName: prev.displayName || "Guest",
            };
          });
          for (const p of event.participants) {
            if (p.id !== event.yourId) {
              const stream = localStreamRef.current;
              if (stream) {
                peerManager.createOffer(p.id, stream).then((offer) => {
                  signalingRef.current?.send({ type: "offer", to: p.id, sdp: offer });
                });
              }
            }
          }
          toast("You joined the call");
          break;
        case "participant-joined": {
          const newParticipant = createRemoteParticipant(event.participant);
          setData((prev) => ({
            ...prev,
            participants: [...prev.participants.filter((p) => p.id !== newParticipant.id), newParticipant],
          }));
          const stream = localStreamRef.current;
          if (stream) {
            peerManager.createOffer(event.participant.id, stream).then((offer) => {
              signalingRef.current?.send({ type: "offer", to: event.participant.id, sdp: offer });
            });
          }
          toast(`${event.participant.displayName} joined`);
          break;
        }
        case "participant-left":
          peerManager.destroyPeer(event.id);
          setData((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.id !== event.id),
          }));
          break;
        case "offer": {
          const stream = localStreamRef.current;
          if (!stream) break;
          peerManager.handleOffer(event.from, event.sdp, stream).then((answer) => {
            signalingRef.current?.send({ type: "answer", to: event.from, sdp: answer });
          });
          break;
        }
        case "answer":
          peerManager.handleAnswer(event.from, event.sdp);
          break;
        case "ice-candidate":
          peerManager.addIceCandidate(event.from, event.candidate);
          break;
        case "mute-update":
          setData((prev) => ({
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === event.from ? { ...p, audioMuted: event.audio, videoMuted: event.video } : p
            ),
          }));
          break;
        case "screen-share-update":
          setData((prev) => ({
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === event.from ? { ...p, isScreenSharing: event.active } : p
            ),
          }));
          break;
        case "error":
          toast(event.message);
          break;
      }
    },
    [toast]
  );

  const join = useCallback(
    async (displayName: string, audioOnly = false) => {
      updateState((d) => ({ ...d, state: "joining", error: null, displayName: displayName || "Guest" }));

      try {
        const stream = await getLocalStream({ audio: true, video: !audioOnly });
        localStreamRef.current = stream;

        const peerManager = new PeerManager({
          onTrack: (peerId, stream, isScreenShare) => {
            setData((prev) => ({
              ...prev,
              participants: prev.participants.map((p) =>
                p.id === peerId
                  ? { ...p, [isScreenShare ? "screenStream" : "stream"]: stream }
                  : p
              ),
            }));
          },
          onIceCandidate: (peerId, candidate) => {
            signalingRef.current?.send({ type: "ice-candidate", to: peerId, candidate: candidate.toJSON() });
          },
          onConnectionStateChange: (peerId, state) => {
            setData((prev) => ({
              ...prev,
              participants: prev.participants.map((p) =>
                p.id === peerId ? { ...p, connectionState: state } : p
              ),
            }));
          },
        });
        peerManagerRef.current = peerManager;

        const signaling = new SignalingClient({
          onMessage: (event) => handleServerEvent(event, peerManager),
          onClose: () => updateState((d) => ({ ...d, state: "reconnecting" })),
          onError: () => {},
        });

        await signaling.connect();
        signalingRef.current = signaling;

        const name = displayName.trim() || "Guest";
        signaling.send({
          type: "join",
          roomId,
          userId: `user-${Date.now()}`,
          displayName: name,
        });

        updateState((d) => ({
          ...d,
          local: {
            ...d.local,
            stream,
            audioMuted: false,
            videoMuted: audioOnly,
          },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join";
        updateState((d) => ({ ...d, state: "lobby", error: message }));
        cleanup();
        toast(message);
      }
    },
    [roomId, updateState, cleanup, toast, handleServerEvent]
  );

  const toggleMute = useCallback(() => {
    const next = !data.local.audioMuted;
    const track = data.local.stream ? getAudioTrack(data.local.stream) : null;
    if (track) next ? muteTrack(track) : unmuteTrack(track);
    signalingRef.current?.send({ type: "mute", audio: next });
    updateState((d) => ({ ...d, local: { ...d.local, audioMuted: next } }));
    toast(next ? "Muted" : "Unmuted");
  }, [data.local.audioMuted, data.local.stream, updateState, toast]);

  const toggleVideo = useCallback(() => {
    const next = !data.local.videoMuted;
    const track = data.local.stream ? getVideoTrack(data.local.stream) : null;
    if (track) next ? muteTrack(track) : unmuteTrack(track);
    signalingRef.current?.send({ type: "mute", video: next });
    updateState((d) => ({ ...d, local: { ...d.local, videoMuted: next } }));
    toast(next ? "Camera off" : "Camera on");
  }, [data.local.videoMuted, data.local.stream, updateState, toast]);

  const stopScreenShare = useCallback(() => {
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
    peerManagerRef.current?.getPeerIds().forEach((id) => {
      peerManagerRef.current?.removeScreenShareTrack(id, localStreamRef.current);
    });
    signalingRef.current?.send({ type: "screen-share", active: false });
    updateState((d) => ({ ...d, local: { ...d.local, isScreenSharing: false, screenStream: null } }));
    toast("Screen share stopped");
  }, [updateState, toast]);

  const toggleScreenShare = useCallback(async () => {
    if (data.local.isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const stream = await getScreenStream();
        screenStreamRef.current = stream;
        peerManagerRef.current?.getPeerIds().forEach((id) => {
          peerManagerRef.current?.addScreenShareTrack(id, stream);
        });
        signalingRef.current?.send({ type: "screen-share", active: true });
        updateState((d) => ({ ...d, local: { ...d.local, isScreenSharing: true, screenStream: stream } }));
        toast("Sharing screen");
        stream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
      } catch (err) {
        toast("Could not share screen");
      }
    }
  }, [data.local.isScreenSharing, updateState, toast, stopScreenShare]);

  useEffect(() => () => leave(), []);

  return { data, join, leave, toggleMute, toggleVideo, toggleScreenShare };
}
