import type { CSSProperties } from "react";
import { N } from "./tokens";

interface KhatamProps {
  size?: number;
  color?: string;
  sw?: number;
  opacity?: number;
  fill?: string;
  style?: CSSProperties;
}

/** 8-point khatam star (two overlapped squares) — the Noor signature motif. */
export function Khatam({
  size = 120,
  color = N.gold,
  sw = 1,
  opacity = 1,
  fill = "none",
  style,
}: KhatamProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      // `color` is set in CSS so a `var(--…)` stroke resolves; shapes use currentColor.
      style={{ display: "block", opacity, color, ...style }}
      aria-hidden="true"
    >
      <rect
        x="22"
        y="22"
        width="56"
        height="56"
        fill={fill}
        stroke="currentColor"
        strokeWidth={sw}
      />
      <rect
        x="22"
        y="22"
        width="56"
        height="56"
        fill={fill}
        stroke="currentColor"
        strokeWidth={sw}
        transform="rotate(45 50 50)"
      />
      <circle cx="50" cy="50" r="11" fill={fill} stroke="currentColor" strokeWidth={sw} />
    </svg>
  );
}
