"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";
import { NAV_DESTINATIONS, destinationOf } from "../../lib/nav";
import { useT } from "../../i18n/I18nProvider";

/**
 * Phone tab bar — five concrete places, each an icon *and* a word
 * (ADR 0041): Today · Quran · Prayer · Learn · More.
 */
export function TabBar() {
  const pathname = usePathname();
  const t = useT();
  const current = destinationOf(pathname);
  return (
    <nav
      aria-label="Main"
      style={{
        borderTop: `1px solid ${N.border}`,
        background: N.bg2,
        padding: "6px 4px max(8px, env(safe-area-inset-bottom, 8px))",
        flexShrink: 0,
        display: "flex",
      }}
    >
      {NAV_DESTINATIONS.map((d) => {
        const active = d.key === current;
        return (
          <Link
            key={d.key}
            href={d.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              minHeight: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: active ? N.gold : N.muted,
              textDecoration: "none",
              fontFamily: N.ui,
            }}
          >
            <Icon name={d.icon} size={22} sw={1.8} color={active ? N.gold : N.muted} />
            <span style={{ fontSize: 12.5, fontWeight: active ? 800 : 600 }}>{t(d.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
