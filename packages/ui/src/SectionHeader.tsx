"use client";
import type { ReactNode } from "react";
import { N } from "./tokens";
import { Icon, type IconName } from "./Icon";
import { iconSize } from "./scale";
import { rad, sp } from "./scale-css";
import { Text } from "./Text";
import type { Script } from "./scale";

export interface SectionHeaderProps {
  title: ReactNode;
  /** One line saying what the section is for. */
  note?: ReactNode;
  icon?: IconName;
  /** Something on the far side, such as a "See all" link. */
  action?: ReactNode;
  /** Id for the heading, so a section can use `aria-labelledby`. */
  id?: string;
  /** Heading level on web (default 2). */
  level?: 2 | 3;
  script?: Script;
}

/**
 * Section heading (ADR 0042): optional icon tile, title, and a one-line
 * purpose. Replaces the small uppercase labels mobile used, so a section reads
 * the same on both platforms.
 */
export function SectionHeader({
  title,
  note,
  icon,
  action,
  id,
  level = 2,
  script,
}: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: sp(3) }}>
      {icon && (
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: rad("md"),
            background: N.goldSoft,
            color: N.gold,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name={icon} size={iconSize.md} />
        </span>
      )}
      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: sp(0.5) }}>
        <Text as={level === 2 ? "h2" : "h3"} role="heading" id={id} script={script}>
          {title}
        </Text>
        {note && (
          <Text as="p" role="bodySm" tone="muted" script={script}>
            {note}
          </Text>
        )}
      </div>
      {action}
    </div>
  );
}
