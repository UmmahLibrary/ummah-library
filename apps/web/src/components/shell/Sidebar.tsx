"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Logo, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { useT } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";

// [sectionHeadingKey, [[labelKey, href, icon]…]] — labels resolve through i18n (#208).
const NAV: Array<[MessageKey, Array<[MessageKey, string, IconName]>]> = [
  [
    "nav.read",
    [
      ["nav.quran", "/", "book"],
      ["nav.search", "/search", "search"],
      ["nav.plans", "/plans", "route"],
      ["nav.bookmarks", "/bookmarks", "bookmark"],
      ["nav.tafsir", "/tafsir", "tafsir"],
    ],
  ],
  [
    "nav.memorize",
    [
      ["nav.hifz", "/hifz", "star"],
      ["nav.goals", "/goals", "check"],
    ],
  ],
  [
    "nav.worship",
    [
      ["nav.prayerTimes", "/prayer-times", "home"],
      ["nav.tracker", "/tracker", "check"],
      ["nav.ramadan", "/ramadan", "moon"],
      ["nav.duas", "/duas", "hands"],
      ["nav.qibla", "/qibla", "compass"],
      ["nav.adhkar", "/adhkar", "repeat"],
      ["nav.tasbih", "/tasbih", "more"],
    ],
  ],
  [
    "nav.learn",
    [
      ["nav.hadith", "/hadith", "globe"],
      ["nav.names", "/names", "grid"],
      ["nav.calendar", "/calendar", "moon"],
      ["nav.zakat", "/zakat", "layers"],
    ],
  ],
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside
      style={{
        width: 250,
        flexShrink: 0,
        background: N.bg2,
        borderRight: `1px solid ${N.borderSoft}`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 8px 24px" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1 }}>
        {NAV.map(([group, items]) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: N.faint,
                padding: "0 10px 8px",
                fontWeight: 700,
                fontFamily: N.ui,
              }}
            >
              {t(group)}
            </div>
            {items.map(([label, href, icon]) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={label}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "9px 11px",
                    borderRadius: 9,
                    marginBottom: 2,
                    fontSize: 14.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? N.ink : N.muted,
                    background: active ? N.goldGrad : "transparent",
                    textDecoration: "none",
                    transition: "background .15s, color .15s",
                    fontFamily: N.ui,
                  }}
                >
                  <Icon name={icon} size={17} sw={1.8} color={active ? N.ink : N.faint} />
                  {t(label)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Settings footer */}
      <Link
        href="/settings"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px",
          borderTop: `1px solid ${N.borderSoft}`,
          color: pathname === "/settings" ? N.gold : N.muted,
          fontSize: 14,
          textDecoration: "none",
          fontFamily: N.ui,
          marginTop: "auto",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: N.card,
            border: `1px solid ${N.border}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="settings" size={16} color={N.muted} />
        </div>
        {t("common.settings")}
      </Link>
    </aside>
  );
}
