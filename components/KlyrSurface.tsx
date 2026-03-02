"use client";

import type { ReactNode } from "react";

/**
 * Presentational surface for tiles/cards. Uses theme CSS variables (--k-surface, --k-border, --k-shadow, --k-blur).
 * Classic theme matches existing look; Liquid Glass / Midnight / Paper override for their aesthetic.
 */
export function KlyrSurface({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`tile-surface klyr-surface ${className}`.trim()}
      style={{ borderRadius: "var(--k-radius, 0.5rem)", transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease" }}
      {...rest}
    >
      {children}
    </div>
  );
}
