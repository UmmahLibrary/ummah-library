"use client";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import { Icon, type IconName } from "./Icon";
import { control, iconSize } from "./scale";
import { rad, sp, text } from "./scale-css";

type BtnVariant = "gold" | "ghost" | "soft" | "quiet";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  children?: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  icon?: IconName;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const VARIANTS: Record<BtnVariant, CSSProperties> = {
  gold: {
    background: N.goldGrad,
    color: N.ink,
    border: "1px solid transparent",
    fontWeight: 700,
  },
  ghost: {
    background: N.card,
    color: N.fg,
    border: `1px solid ${N.border}`,
    fontWeight: 600,
  },
  soft: {
    background: N.goldSoft,
    color: N.gold,
    border: `1px solid ${N.gold}`,
    fontWeight: 600,
  },
  quiet: {
    background: "transparent",
    color: N.muted,
    border: "1px solid transparent",
    fontWeight: 600,
  },
};

export function Btn({
  children,
  variant = "gold",
  size = "md",
  onClick,
  style,
  icon,
  disabled,
  type = "button",
}: BtnProps) {
  const z = control[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sp(2),
        padding: `${sp(z.padY)} ${sp(z.padX)}`,
        borderRadius: rad(z.radius),
        ...text(z.text),
        fontFamily: N.ui,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
        transition:
          "transform var(--noor-dur-fast) var(--noor-ease), opacity var(--noor-dur-base) var(--noor-ease)",
        ...VARIANTS[variant],
        ...(disabled ? { opacity: 0.5 } : {}),
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={iconSize[z.icon]} sw={1.8} />}
      {children}
    </button>
  );
}
