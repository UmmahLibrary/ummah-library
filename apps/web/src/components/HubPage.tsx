"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { N, Icon } from "@ummahlibrary/ui";
import { NAV_DESTINATIONS, type NavDestination } from "../lib/nav";
import { useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

/**
 * A destination's hub (Prayer, Learn, More): big labelled tiles — an icon, a
 * name and a one-line note each — two taps from anything (ADR 0041).
 */
export function HubPage({
  destination,
  intro,
  children,
}: {
  destination: NavDestination["key"];
  /** An i18n key for the one-line intro under the title. */
  intro?: MessageKey;
  children?: ReactNode;
}) {
  const t = useT();
  const d = NAV_DESTINATIONS.find((x) => x.key === destination);
  if (!d) return null;
  return (
    <div className="noor-scroll" style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 34px) clamp(16px, 4vw, 36px) 60px",
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: N.ui,
              fontSize: "clamp(24px, 4vw, 30px)",
              fontWeight: 800,
            }}
          >
            {t(d.label)}
          </h1>
          {intro && (
            <p style={{ margin: 0, fontFamily: N.ui, fontSize: 16, color: N.muted }}>{t(intro)}</p>
          )}
        </div>
        {children}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: 12,
          }}
        >
          {d.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nf-tile"
              style={{ minHeight: 84, fontSize: 18 }}
            >
              <span className="ic" aria-hidden="true">
                <Icon name={item.icon} size={24} />
              </span>
              <span style={{ minWidth: 0 }}>
                {t(item.label)}
                <small>{t(item.note)}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
