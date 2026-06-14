/* Ummah Library — Mobile (React Native) spec kit.
   Device frame (iPhone 390×844), status bar, tab bar, and the redline/spec
   callout primitives. All visuals pull from the Noor token object `N` (kit.jsx),
   so the mockup stays 1:1 with the codebase palette. */

const { useState } = React;

// ── Resolve a Noor token name → hex (for spec chips) ──────────────────────────
const TOK_DESC = {
  bg: "App background", bg2: "Raised background", card: "Card / sheet fill",
  cardHi: "Elevated card", border: "Hairline border", borderSoft: "Faint divider",
  fg: "Primary text", muted: "Secondary text", faint: "Tertiary / disabled",
  gold: "Accent", goldHi: "Accent highlight", goldDim: "Accent dim",
  goldSoft: "Accent wash (12%)", ink: "Text on gold",
};
function tok(name) { return N[name]; }

// ── Device frame ──────────────────────────────────────────────────────────────
// 390×844 logical points. SafeAreaView insets: 54 top (status), 34 bottom (home).
function Phone({ children, label, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flexShrink: 0 }}>
      <div style={{
        width: 390 + 24, padding: 12, borderRadius: 56, background: "#05060a",
        border: `1px solid ${N.border}`, boxShadow: "0 40px 80px -30px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.04)",
        position: "relative",
      }}>
        <div style={{
          width: 390, height: 844, borderRadius: 46, overflow: "hidden", position: "relative",
          background: N.bg, color: N.fg, fontFamily: N.ui, display: "flex", flexDirection: "column",
        }}>
          {children}
        </div>
      </div>
      {label && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: N.fg, letterSpacing: 0.2 }}>{label}</div>
          {sub && <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, fontFamily: "ui-monospace, Menlo, monospace" }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// iOS status bar (part of the device, above SafeArea content)
function StatusBar() {
  return (
    <div style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 10px", position: "relative", zIndex: 5 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: N.fg, letterSpacing: 0.3 }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
          {[3, 6, 9, 12].map((h, i) => (
            <rect key={i} x={i * 4.5} y={12 - h} width="3" height={h} rx="0.8" fill={N.fg} />
          ))}
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke={N.fg} strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M1 4.2a10 10 0 0 1 14 0M3.4 6.8a6.4 6.4 0 0 1 9.2 0M8 10h.01" />
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke={N.fg} strokeOpacity="0.5" />
          <rect x="2" y="2" width="17" height="8" rx="1.6" fill={N.fg} />
          <rect x="24" y="4" width="2" height="4" rx="1" fill={N.fg} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

function HomeIndicator({ dark }) {
  return (
    <div style={{ height: 34, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <div style={{ width: 140, height: 5, borderRadius: 3, background: N.fg, opacity: 0.85 }} />
    </div>
  );
}

const TABS = [
  { id: "home", icon: "home", label: "Home" },
  { id: "read", icon: "book", label: "Read" },
  { id: "search", icon: "search", label: "Search" },
  { id: "duas", icon: "hands", label: "Du'ās" },
  { id: "more", icon: "grid", label: "More" },
];
function TabBar({ active = "home" }) {
  return (
    <div style={{ flexShrink: 0, background: N.bg2, borderTop: `1px solid ${N.borderSoft}` }}>
      <div style={{ display: "flex", padding: "9px 8px 0" }}>
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <div key={t.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Icon name={t.icon} size={23} sw={on ? 2 : 1.7} color={on ? N.gold : N.faint} />
              <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? N.gold : N.faint, letterSpacing: 0.2 }}>{t.label}</span>
            </div>
          );
        })}
      </div>
      <HomeIndicator />
    </div>
  );
}

// Stacked native header (back chevron / title / trailing action)
function NavHeader({ title, onBack = true, right, large }) {
  return (
    <div style={{ flexShrink: 0, padding: large ? "4px 20px 14px" : "0 12px 12px", display: "flex", flexDirection: large ? "column" : "row", alignItems: large ? "flex-start" : "center", gap: large ? 0 : 4 }}>
      {!large && (
        <>
          <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", marginLeft: -8 }}>
            {onBack && <Icon name="chevL" size={24} color={N.fg} />}
          </div>
          <div style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700, color: N.fg }}>{title}</div>
          <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", marginRight: -8 }}>{right}</div>
        </>
      )}
      {large && <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, color: N.fg }}>{title}</div>}
    </div>
  );
}

// Tool / stacked-route header — left-aligned title + subtitle + back (matches ToolFrame)
function ToolHead({ title, sub, glyph, right, onBack = true }) {
  return (
    <div style={{ flexShrink: 0, padding: "0 12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 40, height: 40, display: "grid", placeItems: "center", marginLeft: -6, flexShrink: 0 }}>{onBack && <Icon name="arrowL" size={22} color={N.fg} />}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {glyph && <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{glyph}</span>}
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          </div>
          {sub && <div style={{ fontSize: 12.5, color: N.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
        </div>
        {right && <div style={{ flexShrink: 0, marginLeft: 8 }}>{right}</div>}
      </div>
    </div>
  );
}

// Progress ring (concentric SVG)
function Ring({ pct, size = 84, sw = 8, color, children }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={N.border} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color || N.gold} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{children}</div>
    </div>
  );
}

// Stat tile (gold figure + label)
function MStat({ big, label }) {
  return (
    <div style={{ ...card, padding: "14px 15px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>{big}</div>
      <div style={{ fontSize: 11.5, color: N.faint, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// Filter pill
function Chip({ on, children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: on ? 700 : 500, color: on ? N.gold : N.muted, background: on ? N.goldSoft : N.card, border: `1px solid ${on ? N.gold : N.border}`, borderRadius: 999, padding: "7px 13px", whiteSpace: "nowrap" }}>{children}</span>;
}

// Scrollable content region (fills between header and tab bar)
function Body({ children, style, pad = 20 }) {
  return (
    <div className="ul-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: `0 ${pad}px`, ...style }}>
      {children}
    </div>
  );
}

const card = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 };

// ════════════════════════════════════════════════════════════════════════════
// SPEC / REDLINE PRIMITIVES (the right-hand column beside each frame)
// ════════════════════════════════════════════════════════════════════════════
function Spec({ route, blurb, children }) {
  return (
    <div style={{ width: 380, flexShrink: 0, paddingTop: 8 }}>
      <div style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: N.gold, background: N.goldSoft, border: `1px solid ${N.border}`, borderRadius: 7, padding: "5px 9px", display: "inline-block", marginBottom: 14 }}>{route}</div>
      {blurb && <p style={{ fontSize: 14, lineHeight: 1.6, color: N.muted, margin: "0 0 20px" }}>{blurb}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
    </div>
  );
}
function SGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: N.faint, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
// A measurement / note line
function Note({ k, v }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "7px 0", borderBottom: `1px solid ${N.borderSoft}`, fontSize: 13 }}>
      <span style={{ width: 116, flexShrink: 0, color: N.muted }}>{k}</span>
      <span style={{ flex: 1, color: N.fg, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5 }}>{v}</span>
    </div>
  );
}
// Token chips referenced by a screen
function Tokens({ names }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {names.map((n) => {
        const v = tok(n);
        const isGrad = typeof v === "string" && v.startsWith("linear");
        return (
          <div key={n} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 9px 5px 5px", borderRadius: 8, background: N.bg2, border: `1px solid ${N.border}` }}>
            <span style={{ width: 16, height: 16, borderRadius: 5, background: isGrad ? v : v, border: `1px solid ${N.border}`, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontFamily: "ui-monospace, Menlo, monospace", color: N.fg }}>{n}</span>
          </div>
        );
      })}
    </div>
  );
}
// Icons referenced by a screen
function IconRefs({ names }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {names.map((n) => (
        <div key={n} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 8px", borderRadius: 8, background: N.bg2, border: `1px solid ${N.border}` }}>
          <Icon name={n} size={16} color={N.muted} />
          <span style={{ fontSize: 12, fontFamily: "ui-monospace, Menlo, monospace", color: N.muted }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

// A screen section = frame (left) + spec (right)
function Screen({ n, title, frameLabel, frameSub, render, children }) {
  return (
    <section style={{ display: "flex", gap: 56, alignItems: "flex-start", padding: "60px 0", borderTop: `1px solid ${N.borderSoft}` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, alignSelf: "flex-start", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: N.ink, background: N.goldGrad, width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center" }}>{n}</span>
          <span style={{ fontSize: 19, fontWeight: 800, color: N.fg, letterSpacing: -0.2 }}>{title}</span>
        </div>
        <Phone label={frameLabel} sub={frameSub}>{render()}</Phone>
      </div>
      {children}
    </section>
  );
}

Object.assign(window, {
  Phone, StatusBar, HomeIndicator, TabBar, NavHeader, ToolHead, Ring, MStat, Chip, Body, card,
  Spec, SGroup, Note, Tokens, IconRefs, Screen, TOK_DESC, tok, useState,
});
