"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getTileVisibility,
  setTileVisibility as persistVisibility,
  type TileVisibility,
} from "@/lib/veil";

export function useVeil(tileId: string): {
  visibility: TileVisibility;
  setVisibility: (v: TileVisibility) => void;
} {
  const [visibility, setVisibilityState] = useState<TileVisibility>(() =>
    getTileVisibility(tileId)
  );

  useEffect(() => {
    setVisibilityState(getTileVisibility(tileId));
  }, [tileId]);

  const setVisibility = useCallback(
    (v: TileVisibility) => {
      persistVisibility(tileId, v);
      setVisibilityState(v);
    },
    [tileId]
  );

  return { visibility, setVisibility };
}
