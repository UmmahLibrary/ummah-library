"use client";
import type { ReactNode } from "react";
import { N } from "./tokens";
import { target, type Script } from "./scale";
import { rad, sp, text } from "./scale-css";
import { Text } from "./Text";

export interface StepperProps {
  label: ReactNode;
  /** The current value as shown, e.g. "110%". Announced politely on change. */
  value: ReactNode;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease?: boolean;
  canIncrease?: boolean;
  /** Accessible names for the − and + buttons, e.g. "Smaller Arabic text". */
  decreaseLabel: string;
  increaseLabel: string;
  /** Button size in px (comfort settings raise it); default 48. */
  size?: number;
  script?: Script;
}

const btn = (size: number, disabled: boolean) => ({
  minWidth: size,
  minHeight: size,
  display: "grid",
  placeItems: "center",
  borderRadius: rad("md"),
  border: `1px solid ${N.border}`,
  background: N.bg,
  color: N.fg,
  fontSize: 22,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.4 : 1,
});

/** A labelled − value + control (ADR 0042), e.g. text size. */
export function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  canDecrease = true,
  canIncrease = true,
  decreaseLabel,
  increaseLabel,
  size = target.default,
  script,
}: StepperProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: sp(3),
        flexWrap: "wrap",
      }}
    >
      <Text role="subheading" script={script}>
        {label}
      </Text>
      <div style={{ display: "flex", alignItems: "center", gap: sp(2.5) }}>
        <button
          type="button"
          style={btn(size, !canDecrease)}
          disabled={!canDecrease}
          onClick={onDecrease}
          aria-label={decreaseLabel}
        >
          −
        </button>
        <span
          aria-live="polite"
          style={{
            ...text("subheading"),
            minWidth: 56,
            textAlign: "center",
            color: N.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        <button
          type="button"
          style={btn(size, !canIncrease)}
          disabled={!canIncrease}
          onClick={onIncrease}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  );
}
