"use client";

import { useState, useEffect, useRef } from "react";
import type { TileData, GridInfo, GridMember } from "@/components/Grid";
import { TileRenderer } from "./TileRenderer";
import { FullscreenTileOverlay } from "./FullscreenTileOverlay";
import { TileMenu } from "@/components/TileMenu";
import { RestoreHiddenTilesModal } from "@/components/RestoreHiddenTilesModal";
import { getTileLabel } from "@/lib/tileLabels";
import { openCallInNewWindow } from "@/lib/call/open-call-window";

const PRIMARY_TILE_KEY = "klyr-primary-tile";
const PREVIEW_MAX_HEIGHT = 160;

export interface MobileGridStackProps {
  initialTiles: TileData[];
  userId: string;
  gridId: string;
  gridName?: string;
  userEmail?: string;
  grids?: GridInfo[];
  gridMembers?: GridMember[];
  onGridSelect?: (id: string) => void;
  onShare?: () => void;
  onOpenSidebar?: () => void;
}

function TileTypeIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0";
  switch (type) {
    case "notes":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "tasks":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "links":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.172-1.172a4 4 0 105.656-5.656l-1.172-1.172z" />
        </svg>
      );
    case "channel":
    case "dm":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "call":
    case "loop_room":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case "summary":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
      );
  }
}

export function MobileGridStack({
  initialTiles,
  userId,
  gridId,
  gridName,
  userEmail,
  grids = [],
  gridMembers = [],
  onGridSelect,
  onShare,
  onOpenSidebar,
}: MobileGridStackProps) {
  const [tiles, setTiles] = useState<TileData[]>(() => initialTiles.filter((t) => !t.hidden));
  const [showToast, setShowToast] = useState<string | null>(null);
  const [gridSwitcherOpen, setGridSwitcherOpen] = useState(false);
  const [primaryTileId, setPrimaryTileIdState] = useState<string | null>(null);
  const [openedTileId, setOpenedTileId] = useState<string | null>(null);
  const [showGridPeek, setShowGridPeek] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const gridSwitcherRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTiles((prev) => {
      const next = initialTiles.filter((t) => !t.hidden);
      if (next.length !== prev.length || next.some((t, i) => t.id !== prev[i]?.id)) return next;
      return prev;
    });
  }, [initialTiles]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${PRIMARY_TILE_KEY}-${gridId}`;
    const stored = localStorage.getItem(key);
    if (stored && tiles.some((t) => t.id === stored)) setPrimaryTileIdState(stored);
    else setPrimaryTileIdState(null);
  }, [gridId, tiles]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridSwitcherRef.current && !gridSwitcherRef.current.contains(e.target as Node))
        setGridSwitcherOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toast = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleCloseTile = async (tileId: string) => {
    try {
      const res = await fetch("/api/tiles/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileId }),
      });
      if (res.ok) {
        setTiles((prev) => prev.filter((t) => t.id !== tileId));
        if (openedTileId === tileId) setOpenedTileId(null);
        toast("Tile hidden");
      }
    } catch (e) {
      console.error("Failed to hide tile:", e);
    }
  };

  const handleAddTile = async (
    type: string,
    metadata?: {
      channelId?: string;
      channelName?: string;
      channelEmoji?: string;
      conversationId?: string;
      conversationName?: string;
      roomId?: string;
      roomLabel?: string;
    }
  ) => {
    try {
      const res = await fetch("/api/tiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridId, type, ...metadata }),
      });
      if (res.ok) {
        const data = await res.json();
        setTiles((prev) => [...prev, data.tile]);
        toast(`${type.charAt(0).toUpperCase() + type.slice(1)} tile added`);
      }
    } catch (e) {
      console.error("Failed to add tile:", e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
    toast("Link copied to clipboard");
  };

  const handleRestored = (restoredTiles: TileData[]) => {
    setTiles((prev) => [...prev, ...restoredTiles]);
    toast(`Restored ${restoredTiles.length} hidden tiles`);
  };

  const handleDeleted = (deletedIds: string[]) => {
    setTiles((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
    if (openedTileId && deletedIds.includes(openedTileId)) setOpenedTileId(null);
    toast(`Deleted ${deletedIds.length} tiles`);
  };

  const displayName = gridName?.trim() || "Grid Workspace";

  // Order: primary first, then by y then x
  const orderedTiles = [...tiles].sort((a, b) => {
    if (primaryTileId === a.id) return -1;
    if (primaryTileId === b.id) return 1;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const openedTile = openedTileId ? tiles.find((t) => t.id === openedTileId) : null;
  const openedTileTitle = openedTile
    ? getTileLabel(openedTile.type, openedTile.channelName ?? openedTile.conversationName ?? openedTile.roomLabel ?? undefined)
    : "";

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-[var(--background)]">
      {/* Header — matches Grid, with Grid Peek (mobile-only) */}
      <header
        className="relative z-30 flex-shrink-0 border-b border-gray-200/60 dark:border-white/5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3"
        style={{ transition: "border-color var(--motion-duration) var(--motion-ease)" }}
      >
        <a href="/grid" className="flex-shrink-0 flex items-center gap-1.5 mr-1" aria-label="Klyr home">
          <img src="/klyr-logo.png" alt="Klyr" className="h-10 w-auto object-contain" />
        </a>
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex-shrink-0 p-2.5 -ml-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:hidden"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-1 min-w-0 flex-1" ref={gridSwitcherRef}>
          {grids.length > 0 && onGridSelect ? (
            <>
              <button
                onClick={() => setGridSwitcherOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-900 dark:text-white font-medium text-[15px] tracking-tight hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-0 truncate max-w-[140px]"
                aria-expanded={gridSwitcherOpen}
                aria-label="Switch grid"
              >
                <span className="truncate">{displayName}</span>
                <svg className="w-4 h-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {gridSwitcherOpen && (
                <div className="absolute top-full left-4 mt-1 py-1 min-w-[200px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-lg z-[100] max-h-[60vh] overflow-y-auto">
                  {grids.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onGridSelect(g.id);
                        setGridSwitcherOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        g.id === gridId
                          ? "bg-primary-600/10 text-primary-600 dark:text-primary-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-[15px] font-medium text-gray-900 dark:text-white truncate">{displayName}</span>
          )}
        </div>

        <div className="flex-1 min-w-0" aria-hidden="true" />

        <div className="flex items-center gap-0.5 sm:gap-1" ref={actionsRef}>
          {onShare && (
            <button
              onClick={onShare}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Share grid"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          {/* Grid Peek — mobile only */}
          <button
            type="button"
            onClick={() => setShowGridPeek(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
            aria-label="Grid peek"
            title="View grid map"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM6 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <TileMenu gridId={gridId} onSelectTileType={handleAddTile} />
          <div className="relative">
            <button
              onClick={() => setActionsOpen((o) => !o)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="More actions"
              aria-expanded={actionsOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full mt-1 py-1.5 min-w-[200px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-lg z-[100]">
                <button
                  onClick={() => {
                    openCallInNewWindow(gridId, "Grid call", userEmail);
                    setActionsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 rounded-lg mx-1"
                >
                  <svg className="w-4 h-4 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                  Start call
                </button>
                <button
                  onClick={() => {
                    handleCopyLink();
                    setActionsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 rounded-lg mx-1"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy link
                </button>
                <button
                  onClick={() => {
                    setShowRestoreModal(true);
                    setActionsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 rounded-lg mx-1"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore hidden tiles
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stack body */}
      <div
        className="flex-1 overflow-auto px-4 py-4 pb-24"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="flex flex-col gap-4 max-w-full">
          {orderedTiles.map((tile) => {
            const title = getTileLabel(tile.type, tile.channelName ?? tile.conversationName ?? tile.roomLabel ?? undefined);
            const isOpen = openedTileId === tile.id;
            return (
              <div
                key={tile.id}
                className="rounded-xl bg-white/80 dark:bg-gray-900/60 shadow-sm border border-gray-200/60 dark:border-white/10 overflow-hidden flex flex-col"
                style={{ transition: "box-shadow 200ms ease, border-color 200ms ease" }}
              >
                {/* TileCard header */}
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-white/5 min-h-[48px]">
                  <TileTypeIcon type={tile.type} />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">
                    {title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTile(tile.id);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Hide tile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Preview with gradient — tap opens fullscreen */}
                <button
                  type="button"
                  className="flex-1 w-full text-left flex flex-col min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-b-xl"
                  onClick={() => setOpenedTileId(tile.id)}
                  aria-label={`Open ${title}`}
                >
                  <div className="relative overflow-hidden" style={{ maxHeight: PREVIEW_MAX_HEIGHT }}>
                    <div className="overflow-hidden pointer-events-none [&_.tile-header]:hidden">
                      <TileRenderer
                        tile={tile}
                        gridId={gridId}
                        userId={userId}
                        userEmail={userEmail}
                        gridMembers={gridMembers}
                        onClose={handleCloseTile}
                      />
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, var(--background), transparent)",
                      }}
                    />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen overlay when a tile is opened */}
      {openedTile && (
        <FullscreenTileOverlay
          title={openedTileTitle}
          onBack={() => setOpenedTileId(null)}
          onHide={() => handleCloseTile(openedTile.id)}
          onMinimizeToDock={() => {
            if (openedTileId) {
              window.dispatchEvent(new CustomEvent("klyr-focus-tile", { detail: { tileId: openedTileId } }));
              setOpenedTileId(null);
            }
          }}
        >
          <div className="p-4 min-h-full">
            <TileRenderer
              tile={openedTile}
              gridId={gridId}
              userId={userId}
              userEmail={userEmail}
              gridMembers={gridMembers}
              onClose={handleCloseTile}
            />
          </div>
        </FullscreenTileOverlay>
      )}

      {/* Grid Peek modal */}
      {showGridPeek && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Grid peek"
          onClick={() => setShowGridPeek(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-white/5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grid map</h2>
              <button
                type="button"
                onClick={() => setShowGridPeek(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                }}
              >
                {orderedTiles.map((tile) => {
                  const title = getTileLabel(tile.type, tile.channelName ?? tile.conversationName ?? tile.roomLabel ?? undefined);
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => {
                        setShowGridPeek(false);
                        setOpenedTileId(tile.id);
                      }}
                      className="flex flex-col items-center justify-center min-h-[72px] rounded-lg border border-gray-200/80 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 hover:bg-primary-500/10 dark:hover:bg-primary-500/10 text-gray-900 dark:text-white transition-colors"
                    >
                      <TileTypeIcon type={tile.type} />
                      <span className="mt-1 text-xs font-medium truncate w-full px-1 text-center">{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestoreModal && (
        <RestoreHiddenTilesModal
          gridId={gridId}
          onClose={() => setShowRestoreModal(false)}
          onRestored={handleRestored}
          onDeleted={handleDeleted}
        />
      )}

      {showToast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm"
          role="alert"
          aria-live="polite"
        >
          {showToast}
        </div>
      )}
    </div>
  );
}
