"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { N, Logo, Icon } from "@ummahlibrary/ui";
import { useT } from "../../i18n/I18nProvider";
import { NAV_DESTINATIONS } from "../../lib/nav";

// Five groups, same as the phone tabs and hub pages (ADR 0041). Labels resolve
// through i18n (#208).
const NAV = NAV_DESTINATIONS.filter((d) => d.key !== "today");

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

      {/* Today, then the four groups */}
      <nav style={{ flex: 1 }} aria-label="Main">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          style={navLink(pathname === "/")}
        >
          <Icon name="home" size={18} sw={1.8} color={pathname === "/" ? N.ink : N.muted} />
          {t("nav.today")}
        </Link>
        {NAV.map((group) => (
          <div key={group.key} style={{ marginTop: 18 }}>
            <Link
              href={group.href}
              style={{
                display: "block",
                fontSize: 13,
                letterSpacing: 0.6,
                color: N.muted,
                padding: "0 11px 6px",
                fontWeight: 800,
                fontFamily: N.ui,
                textDecoration: "none",
              }}
            >
              {t(group.label)}
            </Link>
            {group.items.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={navLink(active)}
                >
                  <Icon name={item.icon} size={18} sw={1.8} color={active ? N.ink : N.muted} />
                  {t(item.label)}
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

function navLink(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minHeight: 44,
    padding: "8px 11px",
    borderRadius: 10,
    marginBottom: 2,
    fontSize: 15,
    fontWeight: active ? 700 : 500,
    color: active ? N.ink : N.fg,
    background: active ? N.goldGrad : "transparent",
    textDecoration: "none",
    transition: "background .15s, color .15s",
    fontFamily: N.ui,
  };
}
