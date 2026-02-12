"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

const ACTIVE_GRID_KEY = "klyr-active-grid";
const ACTIVE_TILE_KEY_PREFIX = "klyr-active-tile-";

type ActiveGridValue = {
  activeGridId: string | null;
  activeGridName: string | null;
  setActiveGrid: (id: string | null, name: string | null) => void;
};

const ActiveGridContext = createContext<ActiveGridValue | null>(null);

export function ActiveGridProvider({
  children,
  gridId,
  gridName,
}: {
  children: ReactNode;
  gridId: string | null;
  gridName: string | null;
}) {
  const [activeGridId, setActiveGridIdState] = useState<string | null>(gridId);
  const [activeGridName, setActiveGridNameState] = useState<string | null>(gridName);

  useEffect(() => {
    setActiveGridIdState(gridId);
    setActiveGridNameState(gridName);
    if (typeof window !== "undefined" && gridId) {
      try {
        localStorage.setItem(ACTIVE_GRID_KEY, gridId);
      } catch (_) {}
    }
  }, [gridId, gridName]);

  const setActiveGrid = useCallback((id: string | null, name: string | null) => {
    setActiveGridIdState(id);
    setActiveGridNameState(name);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(ACTIVE_GRID_KEY, id);
      else localStorage.removeItem(ACTIVE_GRID_KEY);
    }
  }, []);

  return (
    <ActiveGridContext.Provider
      value={{
        activeGridId,
        activeGridName,
        setActiveGrid,
      }}
    >
      {children}
    </ActiveGridContext.Provider>
  );
}

export function useActiveGrid(): ActiveGridValue {
  const ctx = useContext(ActiveGridContext);
  if (!ctx) {
    return {
      activeGridId: null,
      activeGridName: null,
      setActiveGrid: () => {},
    };
  }
  return ctx;
}

type ActiveTileValue = {
  activeTileId: string | null;
  setActiveTile: (tileId: string | null) => void;
  cycleForward: () => void;
  cycleBack: () => void;
  clear: () => void;
};

const ActiveTileContext = createContext<ActiveTileValue | null>(null);

export function ActiveTileProvider({
  children,
  gridId,
  tileIds,
  tileLabels,
}: {
  children: ReactNode;
  gridId: string;
  tileIds: string[];
  tileLabels: Record<string, string>;
}) {
  const storageKey = `${ACTIVE_TILE_KEY_PREFIX}${gridId}`;

  const [activeTileId, setActiveTileIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored && tileIds.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    const next = stored && tileIds.includes(stored) ? stored : null;
    setActiveTileIdState(next);
  }, [gridId, storageKey, tileIds.join(",")]);

  const setActiveTile = useCallback(
    (tileId: string | null) => {
      setActiveTileIdState(tileId);
      if (typeof window !== "undefined") {
        if (tileId) localStorage.setItem(storageKey, tileId);
        else localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

  const cycleForward = useCallback(() => {
    if (tileIds.length === 0) return;
    const idx = activeTileId ? tileIds.indexOf(activeTileId) : -1;
    const nextIdx = idx < tileIds.length - 1 ? idx + 1 : 0;
    setActiveTile(tileIds[nextIdx]!);
  }, [activeTileId, tileIds, setActiveTile]);

  const cycleBack = useCallback(() => {
    if (tileIds.length === 0) return;
    const idx = activeTileId ? tileIds.indexOf(activeTileId) : tileIds.length;
    const nextIdx = idx <= 0 ? tileIds.length - 1 : idx - 1;
    setActiveTile(tileIds[nextIdx]!);
  }, [activeTileId, tileIds, setActiveTile]);

  const clear = useCallback(() => setActiveTile(null), [setActiveTile]);

  const value: ActiveTileValue = {
    activeTileId,
    setActiveTile,
    cycleForward,
    cycleBack,
    clear,
  };

  return (
    <ActiveTileContext.Provider value={value}>
      {children}
    </ActiveTileContext.Provider>
  );
}

export function useActiveTile(): ActiveTileValue {
  const ctx = useContext(ActiveTileContext);
  if (!ctx) {
    return {
      activeTileId: null,
      setActiveTile: () => {},
      cycleForward: () => {},
      cycleBack: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
