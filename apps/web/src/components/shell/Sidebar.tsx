"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Logo, Icon } from "../noor";
import type { IconName } from "../noor";

const NAV: Array<[string, Array<[string, string, IconName]>]> = [
  [
    "Read",
    [
      ["Quran", "/", "book"],
      ["Search", "/search", "search"],
      ["Bookmarks", "/bookmarks", "bookmark"],
      ["Tafsir", "/tafsir", "tafsir"],
    ],
  ],
  [
    "Memorize",
    [
      ["Hifz Review", "/hifz", "star"],
      ["Reading Goals", "/goals", "check"],
    ],
  ],
  [
    "Worship",
    [
      ["Prayer Times", "/prayer-times", "home"],
      ["Qibla", "/qibla", "compass"],
      ["Adhkār", "/adhkar", "repeat"],
      ["Tasbih", "/tasbih", "more"],
    ],
  ],
  [
    "Learn",
    [
      ["Hadith", "/hadith", "globe"],
      ["99 Names", "/names", "grid"],
      ["Hijri Calendar", "/calendar", "moon"],
      ["Zakat", "/zakat", "layers"],
    ],
  ],
];

export function Sidebar() {
  const pathname = usePathname();

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
              {group}
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
                  {label}
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
        Settings
      </Link>
    </aside>
  );
}
