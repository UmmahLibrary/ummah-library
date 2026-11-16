"use client";
import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from "react";
import { N } from "./tokens";
import { Icon, type IconName } from "./Icon";
import { iconSize, target, type Script } from "./scale";
import { rad, sp, text } from "./scale-css";

export interface ChipProps {
  children: ReactNode;
  /** A chosen filter or option: gold outline and text. */
  selected?: boolean;
  onPress?: MouseEventHandler<HTMLElement>;
  href?: string;
  /** Web: the link component to render `href` with (e.g. Next's `Link`). */
  linkAs?: ElementType;
  icon?: IconName;
  /** Accessible name when the visible text is not enough. */
  label?: string;
  lang?: string;
  /** Native uses it to pick the label's face; web takes the page's font. */
  script?: Script;
  style?: CSSProperties;
}

/**
 * A pill for filters, language choices and jump links (ADR 0042). Selected
 * chips announce their state; every chip is at least 44px tall to tap.
 */
export function Chip({
  children,
  selected,
  onPress,
  href,
  linkAs,
  icon,
  label,
  lang,
  style,
}: ChipProps) {
  const s: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: sp(1.5),
    minHeight: target.min,
    padding: `0 ${sp(4)}`,
    borderRadius: rad("pill"),
    border: `1px solid ${selected ? N.gold : N.border}`,
    background: selected ? N.goldSoft : N.card,
    color: selected ? N.gold : N.fg,
    ...text("label"),
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    textDecoration: "none",
    cursor: "pointer",
    ...style,
  };
  const body = (
    <>
      {icon && <Icon name={icon} size={iconSize.sm} />}
      {children}
    </>
  );
  if (href) {
    const Link = linkAs ?? "a";
    return (
      <Link href={href} style={s} aria-label={label} lang={lang} onClick={onPress}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      style={s}
      aria-label={label}
      aria-pressed={selected}
      lang={lang}
      onClick={onPress}
    >
      {body}
    </button>
  );
}
