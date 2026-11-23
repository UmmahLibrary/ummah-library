"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { N, Logo, Icon } from "@ummahlibrary/ui";
import { useIntl } from "../../i18n/I18nProvider";
import { NAV_DESTINATIONS, destinationOf } from "../../lib/nav";

// Five places, same as the phone tabs and hub pages (ADR 0041). Progressive
// disclosure: only the section you're in is open, so the sidebar shows about
// ten links instead of twenty-five. Every section name opens its hub page,
// which lists all of its features with a one-line description, and search
// finds any feature by name or everyday word. Labels resolve through i18n.
const NAV = NAV_DESTINATIONS.filter((d) => d.key !== "today");

export function Sidebar() {
  const pathname = usePathname();
  const { t, tf } = useIntl();
  const current = destinationOf(pathname);
  // The current section is open; the reader may open one other to look around.
  const [open, setOpen] = useState<string>(current);
  useEffect(() => setOpen(current), [current]);

  return (
    <aside
      style={{
        width: 250,
        flexShrink: 0,
        background: N.bg2,
        borderInlineEnd: `1px solid ${N.borderSoft}`,
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
      <nav style={{ flex: 1 }} aria-label={t("shell.mainNav")}>
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          style={navLink(pathname === "/")}
        >
          <Icon name="home" size={18} sw={1.8} color={pathname === "/" ? N.ink : N.muted} />
          {t("nav.today")}
        </Link>
        {NAV.map((group) => {
          const isOpen = open === group.key;
          const here = current === group.key;
          const panelId = `nav-${group.key}`;
          return (
            <div key={group.key} style={{ marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Link
                  href={group.href}
                  aria-current={pathname === group.href ? "page" : undefined}
                  style={{
                    ...navLink(false),
                    flex: 1,
                    marginBottom: 0,
                    fontWeight: here ? 800 : 600,
                    color: here ? N.gold : N.fg,
                  }}
                >
                  <Icon name={group.icon} size={18} sw={1.8} color={here ? N.gold : N.muted} />
                  {t(group.label)}
                </Link>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={tf(isOpen ? "shell.hideSection" : "shell.showSection", {
                    section: t(group.label),
                    n: group.items.length,
                  })}
                  onClick={() => setOpen(isOpen ? "" : group.key)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: N.muted,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    transform: isOpen ? "rotate(180deg)" : undefined,
                    transition: "transform .15s",
                  }}
                >
                  <Icon name="chevD" size={16} />
                </button>
              </div>
              {isOpen && (
                <div
                  id={panelId}
                  style={{
                    marginInlineStart: 20,
                    paddingInlineStart: 8,
                    borderInlineStart: `1px solid ${N.borderSoft}`,
                    marginTop: 2,
                    marginBottom: 6,
                  }}
                >
                  {group.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        style={{ ...navLink(active), minHeight: 40, fontSize: 14.5 }}
                      >
                        {t(item.label)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
