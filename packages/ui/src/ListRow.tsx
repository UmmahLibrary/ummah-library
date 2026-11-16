"use client";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import { Icon } from "./Icon";
import { iconSize, target, type Script } from "./scale";
import { sp } from "./scale-css";
import { Text } from "./Text";

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Before the text: an icon, number badge or avatar. */
  leading?: ReactNode;
  /** After the text: a value, a switch, or Arabic text. */
  trailing?: ReactNode;
  /** Shows a forward chevron (it mirrors in right-to-left pages). */
  chevron?: boolean;
  onPress?: MouseEventHandler<HTMLElement>;
  href?: string;
  /** Line under the row, for rows stacked inside one card. */
  divider?: boolean;
  /** Accessible name when the visible text is not enough. */
  label?: string;
  selected?: boolean;
  script?: Script;
  style?: CSSProperties;
}

/**
 * One row of a list (ADR 0042): leading slot, title and subtitle, trailing
 * slot. At least a 48px touch target on every platform.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  onPress,
  href,
  divider,
  label,
  selected,
  script,
  style,
}: ListRowProps) {
  const s: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: sp(3),
    minHeight: target.default,
    padding: `${sp(3)} ${sp(4)}`,
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: divider ? `1px solid ${N.borderSoft}` : "none",
    color: N.fg,
    textAlign: "start",
    textDecoration: "none",
    font: "inherit",
    cursor: onPress || href ? "pointer" : undefined,
    ...style,
  };
  const body = (
    <>
      {leading}
      <span style={{ flex: 1, minWidth: 0, display: "grid", gap: sp(0.5) }}>
        <Text role="subheading" script={script} tone={selected ? "accent" : "fg"}>
          {title}
        </Text>
        {subtitle && (
          <Text role="label" tone="muted" script={script} style={{ fontWeight: 500 }}>
            {subtitle}
          </Text>
        )}
      </span>
      {trailing}
      {chevron && (
        <span className="noor-mirror-rtl" style={{ color: N.faint, display: "flex" }}>
          <Icon name="chevR" size={iconSize.md} />
        </span>
      )}
    </>
  );
  if (href)
    return (
      <a
        href={href}
        style={s}
        aria-label={label}
        aria-current={selected || undefined}
        onClick={onPress}
      >
        {body}
      </a>
    );
  if (onPress)
    return (
      <button type="button" style={s} aria-label={label} aria-pressed={selected} onClick={onPress}>
        {body}
      </button>
    );
  return <div style={s}>{body}</div>;
}
