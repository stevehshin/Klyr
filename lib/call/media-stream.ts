export async function getLocalStream(constraints: { audio: boolean; video: boolean | object }) {
  return navigator.mediaDevices.getUserMedia({
    audio: constraints.audio ? { echoCancellation: true, noiseSuppression: true } : false,
    video: constraints.video
      ? typeof constraints.video === "object"
        ? { ...constraints.video, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 } }
      : false,
  });
}

export async function getScreenStream() {
  return navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "monitor" },
    audio: false,
  });
}

export function getAudioTrack(stream: MediaStream) {
  return stream.getAudioTracks()[0] ?? null;
}

export function getVideoTrack(stream: MediaStream) {
  return stream.getVideoTracks()[0] ?? null;
}

export function muteTrack(track: MediaStreamTrack | null) {
  if (track) track.enabled = false;
}

export function unmuteTrack(track: MediaStreamTrack | null) {
  if (track) track.enabled = true;
}

export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}
