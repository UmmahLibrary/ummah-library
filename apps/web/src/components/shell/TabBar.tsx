"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { useT } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";

// [labelKey, href, icon] — labels resolve through i18n (#208).
const TABS: Array<[MessageKey, string, IconName]> = [
  ["tab.home", "/", "home"],
  ["tab.read", "/search", "book"],
  ["tab.tools", "/tools", "grid"],
  ["tab.memorize", "/hifz", "star"],
  ["tab.more", "/settings", "menu"],
];

export function TabBar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      style={{
        borderTop: `1px solid ${N.border}`,
        background: N.bg2,
        padding: "9px 6px env(safe-area-inset-bottom, 8px)",
        flexShrink: 0,
        display: "flex",
      }}
    >
      {TABS.map(([labelKey, href, icon]) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={labelKey}
            href={href}
            // "More" alone is not a descriptive link name (Lighthouse SEO/a11y);
            // the longer form says where it goes.
            aria-label={href === "/settings" ? t("tab.moreLabel") : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: active ? N.gold : N.muted,
              textDecoration: "none",
              fontFamily: N.ui,
            }}
          >
            <Icon name={icon} size={20} sw={1.8} color={active ? N.gold : N.muted} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
