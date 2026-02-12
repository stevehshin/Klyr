"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import GridLayout from "react-grid-layout";
import { NotesTile } from "./NotesTile";
import { DMTile } from "./DMTile";
import { TasksTile } from "./TasksTile";
import { LinksTile } from "./LinksTile";
import { CalendarTile } from "./CalendarTile";
import { ChannelTile } from "./ChannelTile";
import { CallTile } from "./CallTile";
import { SummaryTile } from "./SummaryTile";
import { openCallInNewWindow } from "@/lib/call/open-call-window";
import { TileMenu } from "./TileMenu";
import { RestoreHiddenTilesModal } from "./RestoreHiddenTilesModal";
import { Veil } from "./Veil";
import { RequestAccessModal } from "./RequestAccessModal";
import { ActiveTileProvider, useActiveTile } from "@/context/KlyrContext";
import { useVeil } from "@/lib/hooks/useVeil";
import { getTileLabel } from "@/lib/tileLabels";
import type { TileVisibility } from "@/lib/veil";
import "react-grid-layout/css/styles.css";

export interface TileData {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hidden: boolean;
  channelId?: string;
  channelName?: string;
  channelEmoji?: string;
  conversationId?: string;
  conversationName?: string;
  roomId?: string;
  roomLabel?: string;
}

export interface GridInfo {
  id: string;
  name: string;
}

export interface GridProps {
  initialTiles: TileData[];
  userId: string;
  gridId: string;
  gridName?: string;
  userEmail?: string;
  /** For OS top bar: grid switcher and share */
  grids?: GridInfo[];
  onGridSelect?: (id: string) => void;
  onShare?: () => void;
  focusMode?: boolean;
  onFocusModeChange?: (value: boolean) => void;
}

const PRIMARY_TILE_KEY = "klyr-primary-tile";
const TILE_HEADER_HEIGHT = 52;

/** Inner tile UI (menu, veil, surface). Renders inside the grid-item div so the grid can clone a plain div. */
function TileContent({
  tile,
  primaryTileId,
  setPrimaryTileId,
  isActive,
  onActivate,
  onRequestAccessOpen,
  onToast,
  children,
}: {
  tile: TileData;
  primaryTileId: string | null;
  setPrimaryTileId: (id: string | null) => void;
  isActive: boolean;
  onActivate: () => void;
  onRequestAccessOpen: () => void;
  onToast: (msg: string) => void;
  children: ReactNode;
}) {
  const { visibility, setVisibility } = useVeil(tile.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const setVis = (v: TileVisibility) => {
    setVisibility(v);
    setMenuOpen(false);
  };

  return (
    <div
      className="tile-surface h-full flex flex-col overflow-hidden rounded-lg relative"
      style={{ transition: "box-shadow 200ms ease, border-color 200ms ease" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPrimaryTileId(primaryTileId === tile.id ? null : tile.id);
        }}
        className="tile-primary-btn absolute bottom-2 right-2 z-10 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 transition-opacity duration-200"
        aria-label={primaryTileId === tile.id ? "Clear primary" : "Set as primary"}
      >
        {primaryTileId === tile.id ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        )}
      </button>

      <div className="absolute top-2 right-10 z-20 flex items-center gap-1" ref={menuRef}>
        {visibility === "shared" && (
          <span className="text-gray-400 dark:text-gray-500" title="Shared" aria-hidden>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
          aria-label="Tile options"
          aria-expanded={menuOpen}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute top-full right-0 mt-1 py-1 min-w-[140px] rounded-lg bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-lg z-[100]">
            <p className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Visibility</p>
            {(["private", "shared", "veiled"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVis(v)}
                className={`w-full px-3 py-2 text-left text-sm capitalize ${visibility === v ? "text-primary-600 dark:text-primary-400 bg-primary-500/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {visibility === "veiled" && (
        <div
          className="absolute left-0 right-0 bottom-0 z-10 flex flex-col items-center justify-center rounded-b-lg bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-t border-gray-200/40 dark:border-white/5 transition-all duration-200 hover:bg-white/60 dark:hover:bg-gray-900/60"
          style={{ top: TILE_HEADER_HEIGHT }}
          role="presentation"
        >
          <Veil onRequestAccess={onRequestAccessOpen} />
        </div>
      )}

      <div className="h-full flex flex-col" data-tile-body onClick={() => onActivate()}>
        {children}
      </div>
    </div>
  );
}

function ActiveTileKeyboard() {
  const { cycleForward, cycleBack, clear } = useActiveTile();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) cycleBack();
        else cycleForward();
      }
      if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycleForward, cycleBack, clear]);
  return null;
}

export function Grid({
  initialTiles,
  userId,
  gridId,
  gridName,
  userEmail,
  grids = [],
  onGridSelect,
  onShare,
  focusMode = false,
  onFocusModeChange,
}: GridProps) {
  const [tiles, setTiles] = useState<TileData[]>(
    initialTiles.filter((t) => !t.hidden)
  );
  const [showToast, setShowToast] = useState<string | null>(null);
  const [gridSwitcherOpen, setGridSwitcherOpen] = useState(false);
  const gridSwitcherRef = useRef<HTMLDivElement>(null);
  const [primaryTileId, setPrimaryTileIdState] = useState<string | null>(null);
  const [requestAccessTile, setRequestAccessTile] = useState<TileData | null>(null);
  const { activeTileId, setActiveTile } = useActiveTile();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${PRIMARY_TILE_KEY}-${gridId}`;
    const stored = localStorage.getItem(key);
    if (stored && tiles.some((t) => t.id === stored)) setPrimaryTileIdState(stored);
    else setPrimaryTileIdState(null);
  }, [gridId, tiles]);

  const setPrimaryTileId = (id: string | null) => {
    setPrimaryTileIdState(id);
    if (typeof window !== "undefined") {
      const key = `${PRIMARY_TILE_KEY}-${gridId}`;
      if (id) localStorage.setItem(key, id);
      else localStorage.removeItem(key);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridSwitcherRef.current && !gridSwitcherRef.current.contains(e.target as Node)) {
        setGridSwitcherOpen(false);
      }
    };
    if (gridSwitcherOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [gridSwitcherOpen]);

  // Update tiles when switching grids
  useEffect(() => {
    setTiles(initialTiles.filter((t) => !t.hidden));
  }, [gridId, initialTiles]);

  // Convert tiles to react-grid-layout format
  const layout = tiles.map((tile) => ({
    i: tile.id,
    x: tile.x,
    y: tile.y,
    w: tile.w,
    h: tile.h,
    minW: 2,
    minH: 2,
  }));

  // Handle layout changes (drag/resize)
  const handleLayoutChange = async (newLayout: GridLayout.Layout[]) => {
    // Update local state
    const updatedTiles = tiles.map((tile) => {
      const layoutItem = newLayout.find((l) => l.i === tile.id);
      if (layoutItem) {
        return {
          ...tile,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return tile;
    });

    setTiles(updatedTiles);

    // Persist to database
    try {
      await fetch("/api/tiles/update-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tiles: updatedTiles.map((t) => ({
            id: t.id,
            x: t.x,
            y: t.y,
            w: t.w,
            h: t.h,
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };

  // Handle tile close
  const handleCloseTile = async (tileId: string) => {
    try {
      const response = await fetch("/api/tiles/hide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tileId }),
      });

      if (response.ok) {
        setTiles((prev) => prev.filter((t) => t.id !== tileId));
        toast("Tile hidden");
      }
    } catch (error) {
      console.error("Failed to hide tile:", error);
    }
  };

  // Handle add tile
  const handleAddTile = async (type: string, metadata?: { channelId?: string; channelName?: string; channelEmoji?: string; conversationId?: string; conversationName?: string; roomId?: string; roomLabel?: string }) => {
    try {
      const response = await fetch("/api/tiles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gridId,
          type,
          ...metadata,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTiles((prev) => [...prev, data.tile]);
        toast(`${type.charAt(0).toUpperCase() + type.slice(1)} tile added`);
      }
    } catch (error) {
      console.error("Failed to add tile:", error);
    }
  };

  // Handle copy grid link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast("Link copied to clipboard");
  };

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const handleRestored = (restoredTiles: TileData[]) => {
    setTiles((prev) => [...prev, ...restoredTiles]);
    toast(`Restored ${restoredTiles.length} hidden tiles`);
  };

  const handleDeleted = (deletedIds: string[]) => {
    setTiles((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
    toast(`Deleted ${deletedIds.length} tiles`);
  };

  // Toast helper
  const toast = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const [showDropGrid, setShowDropGrid] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    };
    if (actionsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionsOpen]);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.clientWidth;
      if (typeof w === "number" && w > 0) setGridWidth(w);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<{ tileId: string }>) => {
      const id = e.detail?.tileId;
      if (!id) return;
      const el = document.querySelector(`[data-tile-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    window.addEventListener("klyr-focus-tile", handler as EventListener);
    return () => window.removeEventListener("klyr-focus-tile", handler as EventListener);
  }, []);

  const COLS = 12;
  const ROW_HEIGHT = 100;
  const MARGIN: [number, number] = [10, 10];
  const CONTAINER_PADDING: [number, number] = [10, 10];
  const colWidth = (gridWidth - MARGIN[0] * (COLS - 1) - CONTAINER_PADDING[0] * 2) / COLS;
  const cellWidth = colWidth + MARGIN[0];
  const cellHeight = ROW_HEIGHT + MARGIN[1];
  const DROP_GRID_ROWS = 24;
  const dropGridHeight =
    CONTAINER_PADDING[1] * 2 + DROP_GRID_ROWS * (ROW_HEIGHT + MARGIN[1]) - MARGIN[1];

  const displayName = gridName?.trim() || "Grid Workspace";

  const renderTileContent = useCallback(
    (tile: TileData) => {
      if (tile.type === "notes")
        return <NotesTile tileId={tile.id} onClose={() => handleCloseTile(tile.id)} />;
      if (tile.type === "dm")
        return (
          <DMTile
            tileId={tile.id}
            conversationId={tile.conversationId || ""}
            conversationName={tile.conversationName || "DM"}
            userEmail={userEmail}
            onClose={() => handleCloseTile(tile.id)}
          />
        );
      if (tile.type === "channel")
        return (
          <ChannelTile
            tileId={tile.id}
            channelId={tile.channelId || ""}
            channelName={tile.channelName || "Channel"}
            channelEmoji={tile.channelEmoji || "📢"}
            onClose={() => handleCloseTile(tile.id)}
          />
        );
      if (tile.type === "call")
        return (
          <CallTile
            tileId={tile.id}
            roomId={tile.roomId || tile.channelId || tile.conversationId || gridId}
            roomLabel={tile.roomLabel || "Call"}
            userEmail={userEmail}
            onClose={() => handleCloseTile(tile.id)}
          />
        );
      if (tile.type === "summary")
        return (
          <SummaryTile
            tileId={tile.id}
            gridId={gridId}
            onClose={() => handleCloseTile(tile.id)}
          />
        );
      if (tile.type === "tasks")
        return <TasksTile tileId={tile.id} onClose={() => handleCloseTile(tile.id)} />;
      if (tile.type === "links")
        return <LinksTile tileId={tile.id} onClose={() => handleCloseTile(tile.id)} />;
      if (tile.type === "calendar")
        return <CalendarTile tileId={tile.id} onClose={() => handleCloseTile(tile.id)} />;
      return null;
    },
    [
      gridId,
      userEmail,
      handleCloseTile,
    ]
  );

  return (
    <>
      <ActiveTileKeyboard />
      <div className="h-screen w-full overflow-hidden flex flex-col bg-[var(--background)]">
        {/* OS Control Layer — [Grid ▼] [Share] [Focus] [Add] [⋮] */}
        <header
        className="relative z-30 flex-shrink-0 border-b border-gray-200/60 dark:border-white/5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2.5 flex items-center gap-3"
        style={{ transition: "border-color var(--motion-duration) var(--motion-ease)" }}
      >
        {/* Grid switcher */}
        <div className="flex items-center gap-1 min-w-0" ref={gridSwitcherRef}>
          {grids.length > 0 && onGridSelect ? (
            <>
              <button
                onClick={() => setGridSwitcherOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-900 dark:text-white font-medium text-[15px] tracking-tight hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-0 truncate max-w-[180px]"
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

        <div className="flex items-center gap-1" ref={actionsRef}>
          {onShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Share grid"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          {onFocusModeChange && (
            <button
              onClick={() => onFocusModeChange(!focusMode)}
              className={`p-2 rounded-lg transition-colors ${
                focusMode
                  ? "text-primary-600 dark:text-primary-400 bg-primary-600/10"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              aria-label={focusMode ? "Exit focus mode" : "Focus mode"}
              title={focusMode ? "Exit focus mode" : "Focus mode — hide sidebar"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
          <TileMenu gridId={gridId} onSelectTileType={handleAddTile} />
          <div className="relative">
            <button
              onClick={() => setActionsOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

      {/* Grid area — soft background with subtle pattern */}
      <div
        className="flex-1 w-full overflow-auto p-5 min-w-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div
          ref={gridContainerRef}
          className="w-full min-w-0"
        >
          <div
            className="relative inline-block rounded-xl bg-white/60 dark:bg-gray-900/40 shadow-sm border border-gray-200/60 dark:border-white/10"
            style={{
              width: gridWidth,
              ...(showDropGrid ? { minHeight: dropGridHeight } : {}),
            }}
          >
            {showDropGrid && (
              <div
                className="absolute top-0 left-0 pointer-events-none z-0 rounded-lg"
                style={{
                  width: gridWidth,
                  height: dropGridHeight,
                backgroundImage: `
                  linear-gradient(to right, rgba(100, 116, 139, 0.18) 0px, transparent 1px),
                  linear-gradient(to bottom, rgba(100, 116, 139, 0.18) 0px, transparent 1px)
                `,
                backgroundSize: `${cellWidth}px ${cellHeight}px`,
                backgroundPosition: `${CONTAINER_PADDING[0]}px ${CONTAINER_PADDING[1]}px`,
                boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.08)",
              }}
              aria-hidden="true"
            />
          )}
          <GridLayout
            className="layout"
            layout={layout}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            width={gridWidth}
            margin={MARGIN}
            containerPadding={CONTAINER_PADDING}
            onLayoutChange={handleLayoutChange}
            onDragStart={() => setShowDropGrid(true)}
            onDragStop={() => setShowDropGrid(false)}
            onResizeStart={() => setShowDropGrid(true)}
            onResizeStop={() => setShowDropGrid(false)}
            draggableHandle=".tile-header"
            compactType={null}
            preventCollision={true}
            isResizable={true}
            isDraggable={true}
          >
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`tile-container ${primaryTileId === tile.id ? "tile-primary" : ""} ${activeTileId === tile.id ? "tile-active" : ""}`}
                data-tile-id={tile.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest(".tile-header, [data-tile-body]")) return;
                  setActiveTile(tile.id);
                }}
              >
                <TileContent
                  tile={tile}
                  primaryTileId={primaryTileId}
                  setPrimaryTileId={setPrimaryTileId}
                  isActive={activeTileId === tile.id}
                  onActivate={() => setActiveTile(tile.id)}
                  onRequestAccessOpen={() => setRequestAccessTile(tile)}
                  onToast={toast}
                >
                  {renderTileContent(tile)}
                </TileContent>
              </div>
            ))}
        </GridLayout>
          </div>
        </div>
      </div>

        {showRestoreModal && (
          <RestoreHiddenTilesModal
            gridId={gridId}
            onClose={() => setShowRestoreModal(false)}
            onRestored={handleRestored}
            onDeleted={handleDeleted}
          />
        )}

        {/* Toast */}
        {showToast && (
          <div
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
            role="alert"
            aria-live="polite"
          >
            {showToast}
          </div>
        )}
      </div>

      {requestAccessTile && (
        <RequestAccessModal
          tileId={requestAccessTile.id}
          gridId={gridId}
          tileName={getTileLabel(requestAccessTile.type, requestAccessTile.channelName ?? requestAccessTile.conversationName ?? undefined)}
          gridName={displayName}
          onClose={() => setRequestAccessTile(null)}
          onSubmitted={() => {
            toast("Access requested.");
            setRequestAccessTile(null);
          }}
        />
      )}
    </>
  );
}
