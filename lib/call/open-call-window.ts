export interface OpenCallOptions {
  /** Default the "Audio only" checkbox to true (e.g. for loop rooms). */
  audioOnly?: boolean;
  /** When true, call window will notify opener on leave/close and clear loop-joined state. */
  loopRoom?: boolean;
}

/**
 * Opens the video call in a new window so the user can stay on their grid while in a call.
 */
export function openCallInNewWindow(
  roomId: string,
  roomLabel: string,
  userEmail?: string,
  options?: OpenCallOptions
): void {
  const params = new URLSearchParams({ roomId, roomLabel });
  if (userEmail) params.set("userEmail", userEmail);
  if (options?.audioOnly) params.set("audioOnly", "1");
  if (options?.loopRoom) params.set("loopRoom", "1");
  const url = `${window.location.origin}/call?${params.toString()}`;
  window.open(url, "klyr-call", "width=800,height=600,menubar=no,toolbar=no,location=no,status=no");
}
