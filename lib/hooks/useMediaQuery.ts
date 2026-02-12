"use client";

import { useState, useEffect } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Matches Tailwind breakpoints. Use for responsive UI: sidebar overlay on mobile/tablet, etc.
 * - isMobile: < 768px (single column, sidebar as drawer)
 * - isTablet: 768px–1023px (sidebar can be drawer for more space)
 * - isDesktop: >= 1024px (full layout)
 */
export function useMediaQuery() {
  // Default to mobile so we don't flash desktop layout on small screens (SSR + first paint)
  const [width, setWidth] = useState(768);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    width,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSm: width >= BREAKPOINTS.sm,
    isMd: width >= BREAKPOINTS.md,
    isLg: width >= BREAKPOINTS.lg,
  };
}
