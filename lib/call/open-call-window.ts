/**
 * Opens the video call in a new window so the user can stay on their grid while in a call.
 */
export function openCallInNewWindow(
  roomId: string,
  roomLabel: string,
  userEmail?: string
): void {
  const params = new URLSearchParams({ roomId, roomLabel });
  if (userEmail) {
    params.set("userEmail", userEmail);
  }
  const url = `${window.location.origin}/call?${params.toString()}`;
  window.open(url, "klyr-call", "width=800,height=600,menubar=no,toolbar=no,location=no,status=no");
}
