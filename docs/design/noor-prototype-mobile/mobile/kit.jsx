/* Ummah Library — Noor design kit (Obsidian & Gold).
   Tokens, base CSS, Khatam motif, line-icon set, shared UI primitives.
   App-wide Dark + Light theming via a mutable N object (so SVG strokes get hex)
   plus CSS variables for global chrome. Exports: N, Khatam, Icon, Logo, Btn, Seg,
   applyAppTheme, AppThemes. */

// Curated full-app palettes. Each defines neutrals + the accent set (gold*),
// the accent gradient (goldGrad) and the readable text on accent (ink). Tokenised
// so a theme recolours the entire app — reader accents follow too. WCAG-conscious:
// deep greys over pure black (except the AMOLED "Midnight" high-contrast option).
const AppThemes = {
  // ── DARK ──
  obsidian: {
    bg: "#0A0B0F", bg2: "#0E1017", card: "#14171F", cardHi: "#191D27",
    border: "#242A38", borderSoft: "#1B2029", fg: "#F4F1EA", muted: "#9AA0B2",
    faint: "#5C6273", gold: "#E6B855", goldHi: "#F4D58A", goldDim: "#A98432",
    goldSoft: "rgba(230,184,85,0.12)", goldGrad: "linear-gradient(180deg,#F4D58A,#E6B855)", ink: "#1A1404",
  },
  midnight: {
    bg: "#000000", bg2: "#060608", card: "#0C0D11", cardHi: "#14151B",
    border: "#262830", borderSoft: "#16171D", fg: "#FFFFFF", muted: "#B7BBC7",
    faint: "#6B707D", gold: "#F0C868", goldHi: "#FFE39A", goldDim: "#B9933F",
    goldSoft: "rgba(240,200,104,0.15)", goldGrad: "linear-gradient(180deg,#FFE39A,#F0C868)", ink: "#15100A",
  },
  emerald: {
    bg: "#07140E", bg2: "#0A1A12", card: "#0E2118", cardHi: "#13291E",
    border: "#1F3A2C", borderSoft: "#16281E", fg: "#EFF4EE", muted: "#94AC9F",
    faint: "#557064", gold: "#E3B756", goldHi: "#F2D184", goldDim: "#A07E32",
    goldSoft: "rgba(227,183,86,0.13)", goldGrad: "linear-gradient(180deg,#F2D184,#E3B756)", ink: "#11200A",
  },
  ocean: {
    bg: "#08121A", bg2: "#0C1822", card: "#102230", cardHi: "#15293A",
    border: "#21384B", borderSoft: "#182838", fg: "#ECF2F6", muted: "#93A6B5",
    faint: "#556979", gold: "#45C7BD", goldHi: "#74E2D9", goldDim: "#2C8A83",
    goldSoft: "rgba(69,199,189,0.14)", goldGrad: "linear-gradient(180deg,#74E2D9,#45C7BD)", ink: "#04201D",
  },
  // ── LIGHT ──
  ivory: {
    bg: "#FAF6EE", bg2: "#F3ECDD", card: "#FFFFFF", cardHi: "#FBF6EC",
    border: "#E7DECB", borderSoft: "#F0E9DA", fg: "#1F1B12", muted: "#6E6757",
    faint: "#A99E86", gold: "#B0842A", goldHi: "#C99A3A", goldDim: "#CBB488",
    goldSoft: "rgba(176,132,40,0.14)", goldGrad: "linear-gradient(180deg,#F4D58A,#E6B855)", ink: "#2A1F08",
  },
  sepia: {
    bg: "#F3EAD8", bg2: "#ECE0C8", card: "#FBF4E3", cardHi: "#F4EAD3",
    border: "#DECDA8", borderSoft: "#EADDC0", fg: "#3A2E1B", muted: "#6E5C3F",
    faint: "#A0895F", gold: "#A6781E", goldHi: "#C2933A", goldDim: "#C8B07A",
    goldSoft: "rgba(166,120,30,0.16)", goldGrad: "linear-gradient(180deg,#E7C572,#C99A3A)", ink: "#2A1E08",
  },
  mint: {
    bg: "#F0F6F3", bg2: "#E4EFEA", card: "#FFFFFF", cardHi: "#F2F8F5",
    border: "#D5E5DD", borderSoft: "#E6F0EB", fg: "#16241D", muted: "#5A6E64",
    faint: "#93A89C", gold: "#13857A", goldHi: "#1BA192", goldDim: "#7FB3A9",
    goldSoft: "rgba(19,133,122,0.13)", goldGrad: "linear-gradient(180deg,#2FB3A4,#13857A)", ink: "#EAFBF6",
  },
  rose: {
    bg: "#FAF3F1", bg2: "#F1E5E2", card: "#FFFFFF", cardHi: "#FBF1EE",
    border: "#ECD9D3", borderSoft: "#F4E6E2", fg: "#271A18", muted: "#6E5A56",
    faint: "#AE968F", gold: "#B14A6B", goldHi: "#C76283", goldDim: "#C99AA6",
    goldSoft: "rgba(177,74,107,0.12)", goldGrad: "linear-gradient(180deg,#CE6E8C,#B14A6B)", ink: "#FFF0F4",
  },
};
// Picker metadata (order, label, mode, one-line description).
const THEME_LIST = [
  { key: "obsidian", label: "Obsidian", mode: "dark", desc: "Charcoal & gold" },
  { key: "midnight", label: "Midnight", mode: "dark", desc: "True-black, high contrast" },
  { key: "emerald", label: "Emerald", mode: "dark", desc: "Deep green & gold" },
  { key: "ocean", label: "Ocean", mode: "dark", desc: "Slate & teal" },
  { key: "ivory", label: "Ivory", mode: "light", desc: "Warm paper & gold" },
  { key: "sepia", label: "Sepia", mode: "light", desc: "Parchment & amber" },
  { key: "mint", label: "Mint", mode: "light", desc: "Cool light & teal" },
  { key: "rose", label: "Rose", mode: "light", desc: "Soft light & rose" },
];
const THEME_MODE = THEME_LIST.reduce((m, t) => ((m[t.key] = t.mode), m), {});
const __legacyTheme = { dark: "obsidian", light: "ivory" };

const N = {
  // neutrals/accent are filled by applyAppTheme() at load; obsidian defaults below.
  bg: "#0A0B0F", bg2: "#0E1017", card: "#14171F", cardHi: "#191D27",
  border: "#242A38", borderSoft: "#1B2029", fg: "#F4F1EA", muted: "#9AA0B2",
  faint: "#5C6273", gold: "#E6B855", goldHi: "#F4D58A", goldDim: "#A98432",
  goldSoft: "rgba(230,184,85,0.12)",
  goldGrad: "linear-gradient(180deg, #F4D58A, #E6B855)",
  ui: "'Hanken Grotesk', system-ui, sans-serif",
  ar: "'IBM Plex Sans Arabic', serif",
  ink: "#1A1404",
};

// Apply a theme: mutate N (for hex-based inline/SVG values, refreshed on re-render)
// and set CSS variables on <html> (for the injected global chrome + var()-based consts).
function applyAppTheme(name) {
  name = __legacyTheme[name] || name;
  if (!AppThemes[name]) name = "obsidian";
  const t = AppThemes[name];
  Object.assign(N, t);
  if (typeof document !== "undefined") {
    const r = document.documentElement;
    Object.keys(t).forEach((k) => r.style.setProperty("--ul-" + k, t[k]));
    r.dataset.theme = name;
    r.dataset.mode = THEME_MODE[name] || "dark";
    try { localStorage.setItem("ul.appTheme", name); } catch (e) {}
  }
  return name;
}
// initialise before first render (default obsidian; map any legacy value)
const __rawTheme = (typeof localStorage !== "undefined" && localStorage.getItem("ul.appTheme")) || "obsidian";
applyAppTheme(__rawTheme);

// One-time base CSS + font scale variables + responsive helpers. Uses CSS vars so
// the global chrome (body, scrollbar, selection) re-themes instantly.
if (typeof document !== "undefined" && !document.getElementById("ul-base")) {
  const s = document.createElement("style");
  s.id = "ul-base";
  s.textContent = `
    :root { --ar-scale: 1; --tr-show: block; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--ul-bg); }
    body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: var(--ul-fg); -webkit-font-smoothing: antialiased; }
    ::selection { background: var(--ul-goldSoft); }
    .ul-scroll { scrollbar-width: thin; scrollbar-color: var(--ul-border) transparent; }
    .ul-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
    .ul-scroll::-webkit-scrollbar-thumb { background: var(--ul-border); border-radius: 6px; border: 3px solid var(--ul-bg); }
    .ul-scroll::-webkit-scrollbar-track { background: transparent; }
    .ul-ar { font-family: 'IBM Plex Sans Arabic', serif; direction: rtl; }
    .ul-press { transition: transform .12s ease, opacity .15s ease; }
    .ul-press:active { transform: scale(.97); }
    .ul-link { cursor: pointer; }
    /* Entrance: transform-only so content is ALWAYS visible (opacity stays 1)
       even where the animation clock is frozen at frame 0 (preview/capture/print). */
    .ul-fade { animation: ulFade .5s cubic-bezier(.2,.7,.2,1) both; }
    @keyframes ulFade { from { transform: translateY(10px); } to { transform: none; } }
    .ul-rise > * { animation: ulRise .55s cubic-bezier(.2,.7,.2,1) both; }
    @keyframes ulRise { from { transform: translateY(16px); } to { transform: none; } }
    @media (prefers-reduced-motion: reduce) { .ul-fade, .ul-rise > * { animation: none !important; } }
    .ul-only-sm { display: none !important; }
    @media (max-width: 760px) {
      .ul-hide-sm { display: none !important; }
      .ul-only-sm { display: revert !important; }
    }
    @media (max-width: 980px) { .ul-hide-md { display: none !important; } }
  `;
  document.head.appendChild(s);
}

// 8-point khatam star (two overlapped squares) — the signature motif.
function Khatam({ size = 120, color = N.gold, sw = 1, opacity = 1, fill = "none", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", opacity, ...style }} aria-hidden="true">
      <rect x="22" y="22" width="56" height="56" fill={fill} stroke={color} strokeWidth={sw} />
      <rect x="22" y="22" width="56" height="56" fill={fill} stroke={color} strokeWidth={sw} transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="11" fill={fill} stroke={color} strokeWidth={sw} />
    </svg>
  );
}

// Line-icon set. stroke=currentColor, consistent 1.7 weight.
const ICONS = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.6-3.6",
  play: null, // drawn as filled triangle below
  pause: null,
  heart: "M12 20s-7-4.3-9.2-8.4C1.2 8.3 2.6 5 6 5c2 0 3.2 1.3 4 2.5C10.8 6.3 12 5 14 5c3.4 0 4.8 3.3 3.2 6.6C19 15.7 12 20 12 20Z",
  bookmark: "M6 4h12v16l-6-4-6 4V4Z",
  share: "M16 6l-4-3-4 3M12 3v12M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  chevL: "M15 5l-7 7 7 7",
  chevR: "M9 5l7 7-7 7",
  chevD: "M5 9l7 7 7-7",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  arrowL: "M19 12H5M11 6l-6 6 6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  hands: "M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V6a1.5 1.5 0 0 1 3 0v6c0 3-2 6-5.5 6S5 16 5 13v-1a1.5 1.5 0 0 1 3 0",
  cal: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6ZM4 9h16M8 3v3M16 3v3",
  fire: "M12 3c1 3-1 5-1 5s4 1 4 6a5 5 0 1 1-10 0c0-2 1-3 1-3s0 2 2 2c0 0-1-4 4-10Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  route: "M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 16h6a3 3 0 0 0 3-3V11M6 13V8",
  book: "M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2V5ZM20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2V5Z",
  headphones: "M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h0a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h0a2 2 0 0 1-2-2v-2ZM20 14a2 2 0 0 0-2-2h0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h0a2 2 0 0 0 2-2v-2Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12l4.5 4.5L19 7",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  layers: "M12 3l9 5-9 5-9-5 9-5ZM3 13l9 5 9-5",
  repeat: "M4 9V7a2 2 0 0 1 2-2h12l-3-3M20 15v2a2 2 0 0 1-2 2H6l3 3",
  download: "M12 3v12M8 11l4 4 4-4M5 21h14",
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z",
  star: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  tafsir: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4ZM9 8h7M9 12h7",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20",
  type: "M5 7V5h14v2M9 19h6M12 5v14",
};

function Icon({ name, size = 20, sw = 1.7, color = "currentColor", style }) {
  const base = { width: size, height: size, display: "block", ...style };
  if (name === "play") return (
    <svg viewBox="0 0 24 24" style={base} aria-hidden="true"><path d="M7 4.5v15l13-7.5-13-7.5Z" fill={color} /></svg>
  );
  if (name === "pause") return (
    <svg viewBox="0 0 24 24" style={base} aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" fill={color} /><rect x="14" y="4.5" width="4" height="15" rx="1" fill={color} /></svg>
  );
  const d = ICONS[name] || "";
  return (
    <svg viewBox="0 0 24 24" style={base} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Logo({ scale = 1, color = N.gold, text = N.fg, onClick }) {
  return (
    <div className={onClick ? "ul-link" : ""} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
      <Khatam size={26 * scale} color={color} sw={2.2} />
      <span style={{ fontWeight: 700, fontSize: 17 * scale, color: text, letterSpacing: 0.2 }}>
        Ummah<span style={{ color, fontWeight: 600 }}> Library</span>
      </span>
    </div>
  );
}

function Btn({ children, variant = "gold", size = "md", onClick, style, icon }) {
  const sizes = { sm: { p: "8px 14px", fs: 13.5, r: 9 }, md: { p: "12px 22px", fs: 15, r: 11 }, lg: { p: "15px 30px", fs: 16, r: 12 } };
  const z = sizes[size];
  const variants = {
    gold: { background: N.goldGrad, color: N.ink, border: "1px solid transparent", fontWeight: 700 },
    ghost: { background: N.card, color: N.fg, border: `1px solid ${N.border}`, fontWeight: 600 },
    soft: { background: N.goldSoft, color: N.gold, border: `1px solid ${N.gold}`, fontWeight: 600 },
    quiet: { background: "transparent", color: N.muted, border: "1px solid transparent", fontWeight: 600 },
  };
  return (
    <button className="ul-press ul-link" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: z.p, borderRadius: z.r, fontSize: z.fs, fontFamily: N.ui, cursor: "pointer", whiteSpace: "nowrap", ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={z.fs + 3} sw={1.8} />}
      {children}
    </button>
  );
}

// Segmented control (e.g. Verse / Reading / Mushaf)
function Seg({ options, value, onChange, size = "md" }) {
  const pad = size === "sm" ? "6px 12px" : "8px 15px";
  const fs = size === "sm" ? 13 : 14;
  return (
    <div style={{ display: "flex", borderRadius: 10, border: `1px solid ${N.border}`, overflow: "hidden", background: N.card }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const active = v === value;
        return (
          <button key={v} className="ul-press ul-link" onClick={() => onChange(v)} style={{ padding: pad, fontSize: fs, fontFamily: N.ui, fontWeight: active ? 700 : 500, color: active ? N.ink : N.muted, background: active ? N.gold : "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { N, Khatam, Icon, Logo, Btn, Seg, applyAppTheme, AppThemes, THEME_LIST, THEME_MODE });
