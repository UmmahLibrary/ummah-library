"use client";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import { Icon, type IconName } from "./Icon";

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

const SIZES: Record<BtnSize, { p: string; fs: number; r: number }> = {
  sm: { p: "8px 14px", fs: 13.5, r: 9 },
  md: { p: "12px 22px", fs: 15, r: 11 },
  lg: { p: "15px 30px", fs: 16, r: 12 },
};

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
  const z = SIZES[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        padding: z.p,
        borderRadius: z.r,
        fontSize: z.fs,
        fontFamily: N.ui,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
        transition: "transform .12s ease, opacity .15s ease",
        ...VARIANTS[variant],
        ...(disabled ? { opacity: 0.5 } : {}),
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={z.fs + 3} sw={1.8} />}
      {children}
    </button>
  );
}
