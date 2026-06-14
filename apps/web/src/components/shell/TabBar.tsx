"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";

const TABS: Array<[string, string, IconName]> = [
  ["Home", "/", "home"],
  ["Read", "/search", "book"],
  ["Tools", "/tools", "grid"],
  ["Memorize", "/hifz", "star"],
  ["More", "/settings", "menu"],
];

export function TabBar() {
  const pathname = usePathname();
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
      {TABS.map(([label, href, icon]) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={label}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: active ? N.gold : N.faint,
              textDecoration: "none",
              fontFamily: N.ui,
            }}
          >
            <Icon name={icon} size={20} sw={1.8} color={active ? N.gold : N.faint} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
