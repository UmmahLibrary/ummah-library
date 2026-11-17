"use client";
import type { ReactNode } from "react";
import { N } from "./tokens";
import { Khatam } from "./Khatam";

export interface NumberBadgeProps {
  /** The number as shown, already in the interface's digits. */
  n: ReactNode;
  /** Badge size in px (default 40). */
  size?: number;
}

/**
 * A surah or āyah number inside the eight-point Khatam star (ADR 0042), the
 * same on web and mobile.
 */
export function NumberBadge({ n, size = 40 }: NumberBadgeProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Khatam size={size} color={N.gold} sw={1.2} opacity={0.55} />
      <span
        style={{
          position: "absolute",
          fontSize: Math.round(size * 0.32 * 10) / 10,
          fontWeight: 700,
          color: N.gold,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </span>
    </span>
  );
}
