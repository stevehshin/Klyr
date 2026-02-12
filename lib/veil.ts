/**
 * Tile visibility (Veil) and access requests.
 * Persist visibility per tile to localStorage; requests in memory + localStorage for demo.
 */

export type TileVisibility = "private" | "shared" | "veiled";

const VISIBILITY_KEY_PREFIX = "klyr-tile-visibility-";
const REQUESTS_KEY = "klyr-veil-requests";

export function getTileVisibility(tileId: string): TileVisibility {
  if (typeof window === "undefined") return "private";
  try {
    const v = localStorage.getItem(`${VISIBILITY_KEY_PREFIX}${tileId}`);
    if (v === "shared" || v === "veiled") return v;
    return "private";
  } catch {
    return "private";
  }
}

export function setTileVisibility(tileId: string, visibility: TileVisibility): void {
  if (typeof window === "undefined") return;
  try {
    if (visibility === "private") {
      localStorage.removeItem(`${VISIBILITY_KEY_PREFIX}${tileId}`);
    } else {
      localStorage.setItem(`${VISIBILITY_KEY_PREFIX}${tileId}`, visibility);
    }
  } catch (_) {}
}

export interface VeilRequest {
  tileId: string;
  gridId: string;
  tileName: string;
  gridName: string;
  message?: string;
  at: number;
}

function loadRequests(): VeilRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRequests(requests: VeilRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  } catch (_) {}
}

export function addVeilRequest(
  tileId: string,
  gridId: string,
  tileName: string,
  gridName: string,
  message?: string
): void {
  const requests = loadRequests();
  requests.push({
    tileId,
    gridId,
    tileName,
    gridName,
    message,
    at: Date.now(),
  });
  saveRequests(requests);
}

export function getVeilRequests(): VeilRequest[] {
  return loadRequests();
}
