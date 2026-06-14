"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { N, Icon } from "@ummahlibrary/ui";
import { ThemeToggle } from "../ThemeToggle";
import { useSearch } from "./SearchContext";
import { formatHijri, gregorianToHijri } from "@ummahlibrary/core";
import { HIJRI_ADJUST_KEY, readHijriAdjust } from "../../lib/hijri";

function localToday() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { query, setQuery } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hijriLabel, setHijriLabel] = useState<string | null>(null);
  const [gregLabel, setGregLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setHijriLabel(formatHijri(gregorianToHijri(localToday(), readHijriAdjust())));
      setGregLabel(
        new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    };
    update();
    window.addEventListener(HIJRI_ADJUST_KEY, update);
    return () => window.removeEventListener(HIJRI_ADJUST_KEY, update);
  }, []);

  // Cmd/Ctrl+K focuses the search (matches the ⌘K hint).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (pathname !== "/" && pathname !== "/search") router.push("/search");
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pathname, router]);

  // On the Hub the search filters the surah list inline; elsewhere, focusing it
  // opens the full Search page.
  const handleFocus = () => {
    if (pathname !== "/" && pathname !== "/search") router.push("/search");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px clamp(16px, 4vw, 36px)",
        borderBottom: `1px solid ${N.borderSoft}`,
        flexShrink: 0,
        background: N.bg,
      }}
    >
      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          height: 44,
          borderRadius: 11,
          background: N.card,
          border: `1px solid ${N.border}`,
          flex: 1,
          maxWidth: 460,
        }}
      >
        <Icon name="search" size={18} color={N.muted} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search the Quran, a surah, or a tool…"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: N.fg,
            fontFamily: N.ui,
            fontSize: 14.5,
          }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              padding: 0,
              color: N.faint,
            }}
          >
            <Icon name="close" size={16} color={N.faint} />
          </button>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: N.faint,
              border: `1px solid ${N.border}`,
              borderRadius: 5,
              padding: "2px 6px",
              fontFamily: N.ui,
            }}
          >
            ⌘K
          </span>
        )}
      </form>

      {/* Right: theme toggle + Hijri date + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ThemeToggle />
        {hijriLabel && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: N.gold, fontFamily: N.ui }}>
              {hijriLabel}
            </div>
            {gregLabel && (
              <div
                style={{ fontSize: 12.5, color: N.faint, fontFamily: N.ui }}
                className="noor-hide-sm"
              >
                {gregLabel}
              </div>
            )}
          </div>
        )}
        <Link
          href="/settings"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: N.goldGrad,
            display: "grid",
            placeItems: "center",
            color: N.ink,
            fontWeight: 800,
            fontSize: 15,
            flexShrink: 0,
            textDecoration: "none",
            fontFamily: N.ui,
          }}
          className="noor-hide-sm"
        >
          A
        </Link>
      </div>
    </div>
  );
}
