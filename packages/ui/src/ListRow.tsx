"use client";
import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import { Icon } from "./Icon";
import { iconSize, target, type Script } from "./scale";
import { rad, sp } from "./scale-css";
import { Text } from "./Text";

/** `plain`: a row in a list. `card`: its own bordered card. `adaptive`: a row
 *  on phones and a card from 700px up (the list-style rule, ADR 0042). */
export type ListRowSurface = "plain" | "card" | "adaptive";

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
  /** Web: the link component to render `href` with (e.g. Next's `Link`). */
  linkAs?: ElementType;
  surface?: ListRowSurface;
  /** Line under a plain row, for rows stacked inside one card. */
  divider?: boolean;
  /** Accessible name when the visible text is not enough. */
  label?: string;
  selected?: boolean;
  /** Keep the title on one line, ending with an ellipsis. */
  truncate?: boolean;
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
  linkAs,
  surface = "plain",
  divider,
  label,
  selected,
  truncate,
  script,
  style,
}: ListRowProps) {
  // Adaptive rows are drawn as cards; below 700px the generated stylesheet
  // turns them back into plain rows (.noor-row-adaptive).
  const card = surface !== "plain";
  const s: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: sp(3.5),
    minHeight: target.default,
    padding: `${sp(3)} ${sp(card ? 3.5 : 4)}`,
    width: "100%",
    boxSizing: "border-box",
    background: card ? N.card : "transparent",
    border: card ? `1px solid ${selected ? N.gold : N.border}` : "none",
    borderRadius: card ? rad("md") : 0,
    borderBottom: card
      ? `1px solid ${selected ? N.gold : N.border}`
      : divider
        ? `1px solid ${N.borderSoft}`
        : "none",
    color: N.fg,
    textAlign: "start",
    textDecoration: "none",
    font: "inherit",
    cursor: onPress || href ? "pointer" : undefined,
    transition: "border-color var(--noor-dur-base) var(--noor-ease)",
    ...style,
  };
  const body = (
    <>
      {leading}
      <span style={{ flex: 1, minWidth: 0, display: "grid", gap: sp(0.5) }}>
        <Text
          role="subheading"
          script={script}
          tone={selected ? "accent" : "fg"}
          style={
            truncate
              ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
              : undefined
          }
        >
          {title}
        </Text>
        {subtitle && (
          <Text role="label" tone="faint" script={script} style={{ fontWeight: 500 }}>
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
  const className = surface === "adaptive" ? "noor-row-adaptive" : undefined;
  if (href) {
    const Link = linkAs ?? "a";
    return (
      <Link
        href={href}
        className={className}
        style={s}
        aria-label={label}
        aria-current={selected || undefined}
        onClick={onPress}
      >
        {body}
      </Link>
    );
  }
  if (onPress)
    return (
      <button
        type="button"
        className={className}
        style={s}
        aria-label={label}
        aria-pressed={selected}
        onClick={onPress}
      >
        {body}
      </button>
    );
  return (
    <div className={className} style={s}>
      {body}
    </div>
  );
}
