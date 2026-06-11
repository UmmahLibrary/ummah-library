"use client";
import type { MouseEventHandler } from "react";
import { N } from "./tokens";
import { Khatam } from "./Khatam";

interface LogoProps {
  scale?: number;
  color?: string;
  text?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Logo({ scale = 1, color = N.gold, text = N.fg, onClick }: LogoProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * scale,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <Khatam size={26 * scale} color={color} sw={2.2} />
      <span
        style={{
          fontWeight: 700,
          fontSize: 17 * scale,
          color: text,
          letterSpacing: 0.2,
          fontFamily: N.ui,
        }}
      >
        Ummah<span style={{ color, fontWeight: 600 }}> Library</span>
      </span>
    </div>
  );
}
