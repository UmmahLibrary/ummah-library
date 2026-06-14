import Svg, { Circle, Rect } from "react-native-svg";
import type { CSSProperties } from "react";
import { N } from "./tokens";

interface KhatamProps {
  size?: number;
  color?: string;
  sw?: number;
  opacity?: number;
  fill?: string;
  /** Ignored on native — layout is handled by the parent View. */
  style?: CSSProperties;
}

/** 8-point khatam star (two overlapped squares) — the Noor signature motif. */
export function Khatam({
  size = 120,
  color = N.gold,
  sw = 1,
  opacity = 1,
  fill = "none",
}: KhatamProps) {
  // CSS vars don't resolve on native — fall back to the obsidian gold value.
  const stroke = color.startsWith("var(") ? "#e6b855" : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <Rect
        x="22"
        y="22"
        width="56"
        height="56"
        fill={fill === "none" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
      />
      <Rect
        x="22"
        y="22"
        width="56"
        height="56"
        fill={fill === "none" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
        rotation={45}
        origin="50,50"
      />
      <Circle
        cx="50"
        cy="50"
        r="11"
        fill={fill === "none" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    </Svg>
  );
}
