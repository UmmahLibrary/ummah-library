"use client";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import type { ElevationLevel, SpaceStep } from "./scale";
import { rad, shadow, sp } from "./scale-css";

export type CardTone = "default" | "accent" | "soft";

export interface CardProps {
  children?: ReactNode;
  /** Inner padding as a spacing step (default 4 = 16px). */
  padding?: SpaceStep;
  /** Gap between children as a spacing step (default 3 = 12px). */
  gap?: SpaceStep;
  /** `accent`: gold outline, for the one card to look at. `soft`: gold tint. */
  tone?: CardTone;
  elevation?: ElevationLevel;
  /** Makes the whole card a button. Prefer `href` for navigation. */
  onPress?: MouseEventHandler<HTMLElement>;
  href?: string;
  /** Accessible name when the card is pressable. */
  label?: string;
  style?: CSSProperties;
}

/**
 * The Noor card surface (ADR 0042): one radius, border and padding on every
 * platform. Use it to set off a group, not around every block.
 */
export function Card({
  children,
  padding = 4,
  gap = 3,
  tone = "default",
  elevation = "flat",
  onPress,
  href,
  label,
  style,
}: CardProps) {
  const pressable = Boolean(onPress || href);
  const s: CSSProperties = {
    display: "grid",
    gap: sp(gap),
    padding: sp(padding),
    borderRadius: rad("lg"),
    border: `1px solid ${tone === "accent" ? N.gold : N.border}`,
    background: tone === "soft" ? N.goldSoft : N.card,
    boxShadow: shadow(elevation),
    color: N.fg,
    textAlign: "start",
    ...(pressable && {
      cursor: "pointer",
      textDecoration: "none",
      width: "100%",
      font: "inherit",
    }),
    ...style,
  };
  if (href)
    return (
      <a href={href} style={s} aria-label={label} onClick={onPress}>
        {children}
      </a>
    );
  if (onPress)
    return (
      <button type="button" style={s} aria-label={label} onClick={onPress}>
        {children}
      </button>
    );
  return <div style={s}>{children}</div>;
}
