/* Ummah Library — App shell + routing (Noor).
   Sidebar + top search (desktop), bottom tab bar (mobile), full view routing.
   Screen registry: window.SCREENS (filled by tools.jsx + learn.jsx). */

const { useState: useS, useEffect: useE } = React;

if (!document.getElementById("ul-shell-css")) {
  const s = document.createElement("style");
  s.id = "ul-shell-css";
  s.textContent = `
    .ul-side { display: flex; }
    .ul-tabs { display: none; }
    .ul-topsearch { display: flex; }
    @media (max-width: 900px) {
      .ul-side { display: none !important; }
      .ul-tabs { display: flex !important; }
    }
  `;
  document.head.appendChild(s);
}

// label, route, icon
const NAV = [
  ["Read", [["Quran", "hub", "book"], ["Search", "search", "search"], ["Reading Plans", "plans", "route"], ["Bookmarks", "bookmarks", "bookmark"], ["Tafsir", "tafsir", "tafsir"]]],
  ["Memorize", [["Hifz Review", "hifz", "star"], ["Reading Goals", "goals", "check"]]],
  ["Worship", [["Prayer Times", "prayer", "home"], ["Prayer Tracker", "tracker", "check"], ["Ramadan", "ramadan", "moon"], ["Duʿās", "duas", "hands"], ["Qibla", "qibla", "compass"], ["Adhkār", "adhkar", "repeat"], ["Tasbih", "tasbih", "more"]]],
  ["Learn", [["Hadith", "hadith", "globe"], ["99 Names", "names", "grid"], ["Hijri Calendar", "calendar", "cal"], ["Zakat", "zakat", "layers"]]],
];

function Sidebar({ active, go }) {
  return (
    <div className="ul-side ul-scroll" style={{ width: 250, flexShrink: 0, background: N.bg2, borderRight: `1px solid ${N.borderSoft}`, padding: "24px 16px", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "0 8px 22px" }}><Logo onClick={() => go("hub")} /></div>
      {NAV.map(([group, items]) => (
        <div key={group} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: N.faint, padding: "0 10px 8px", fontWeight: 700 }}>{group}</div>
          {items.map(([label, target, icon]) => {
            const on = active === target;
            return (
              <div key={label} className="ul-link ul-press" onClick={() => go(target)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 9, marginBottom: 2, fontSize: 14.5, fontWeight: on ? 700 : 500, color: on ? N.ink : N.muted, background: on ? N.goldGrad : "transparent" }}>
                <Icon name={icon} size={17} sw={1.8} color={on ? N.ink : N.faint} /> {label}
              </div>
            );
          })}
        </div>
      ))}
      <div className="ul-link ul-press" onClick={() => go("settings")} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px", borderTop: `1px solid ${N.borderSoft}`, color: active === "settings" ? N.gold : N.muted, fontSize: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center" }}><Icon name="settings" size={16} /></div>
        Settings
      </div>
    </div>
  );
}

function TabBar({ view, go }) {
  const tabs = [["Home", "hub", "home"], ["Read", "search", "book"], ["Tools", "tools", "grid"], ["Memorize", "hifz", "star"], ["More", "settings", "menu"]];
  return (
    <div className="ul-tabs" style={{ borderTop: `1px solid ${N.border}`, background: N.bg2, padding: "9px 6px calc(9px + env(safe-area-inset-bottom, 8px))", flexShrink: 0 }}>
      {tabs.map(([label, target, icon]) => {
        const on = view === target;
        return (
          <button key={label} className="ul-link ul-press" onClick={() => go(target)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: on ? N.gold : N.faint, fontFamily: N.ui }}>
            <Icon name={icon} size={20} sw={1.8} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ query, setQuery, searchRef, go, mode, toggleTheme }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px clamp(16px, 4vw, 36px)", borderBottom: `1px solid ${N.borderSoft}`, flexShrink: 0, background: N.bg }}>
      <div className="ul-topsearch" style={{ alignItems: "center", gap: 10, padding: "0 16px", height: 44, borderRadius: 11, background: N.card, border: `1px solid ${N.border}`, flex: 1, maxWidth: 460 }}>
        <Icon name="search" size={18} color={N.muted} />
        <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => go("search")} placeholder="Search verses, hadith, duʿās, names…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 14.5 }} />
        {query ? <Icon name="close" size={16} color={N.faint} style={{ cursor: "pointer" }} onClick={() => setQuery("")} /> : <span style={{ fontSize: 12, color: N.faint, border: `1px solid ${N.border}`, borderRadius: 5, padding: "2px 6px" }}>⌘K</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="ul-link ul-press" onClick={toggleTheme} title={mode === "dark" ? "Switch to a light theme" : "Switch to a dark theme"} style={{ width: 40, height: 40, borderRadius: 11, border: `1px solid ${N.border}`, background: N.card, color: N.muted, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name={mode === "dark" ? "sun" : "moon"} size={19} />
        </button>
        <div style={{ textAlign: "right", flexShrink: 0 }} className="ul-hide-sm">
          <div style={{ fontSize: 14.5, fontWeight: 600, color: N.gold }}>{QURAN.hijri}</div>
          <div style={{ fontSize: 12.5, color: N.faint }}>{QURAN.greg}</div>
        </div>
        <div className="ul-link ul-press" onClick={() => go("profile")} style={{ width: 40, height: 40, borderRadius: 20, background: N.goldGrad, display: "grid", placeItems: "center", color: N.ink, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>A</div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useS(() => {
    const saved = localStorage.getItem("ul.view");
    if (saved) return saved;
    return localStorage.getItem("ul.onboarded") ? "landing" : "onboarding";
  });
  const [surah, setSurah] = useS(() => parseInt(localStorage.getItem("ul.surah")) || 2);
  const [query, setQuery] = useS("");
  const [theme, setTheme] = useS(() => { const legacy = { dark: "obsidian", light: "ivory" }; const v = localStorage.getItem("ul.appTheme") || "obsidian"; return legacy[v] || v; });
  const searchRef = React.useRef(null);

  // Quick toggle flips to the opposite mode, remembering the last theme used per mode.
  const setAppTheme = (t) => {
    const applied = applyAppTheme(t); setTheme(applied);
    const mode = (window.THEME_MODE || {})[applied] || "dark";
    try { localStorage.setItem(mode === "dark" ? "ul.lastDark" : "ul.lastLight", applied); } catch (e) {}
  };
  const toggleTheme = () => {
    const curMode = (window.THEME_MODE || {})[theme] || "dark";
    const targetMode = curMode === "dark" ? "light" : "dark";
    const remembered = localStorage.getItem(targetMode === "dark" ? "ul.lastDark" : "ul.lastLight");
    setAppTheme(remembered || (targetMode === "dark" ? "obsidian" : "ivory"));
  };
  const curMode = (window.THEME_MODE || {})[theme] || "dark";

  useE(() => { localStorage.setItem("ul.view", view); }, [view]);
  useE(() => { localStorage.setItem("ul.surah", String(surah)); }, [surah]);

  useE(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setView("search"); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const openSurah = (n) => { setSurah(n); setView("reader"); };
  const go = (target) => { setView(target); };

  if (view === "onboarding") return <Onboarding onDone={() => { try { localStorage.setItem("ul.onboarded", "1"); } catch (e) {} setView("landing"); }} />;
  if (view === "landing") return <Landing onEnter={(t) => setView(t || "hub")} theme={theme} toggleTheme={toggleTheme} />;
  if (view === "reader") return <Reader surah={surah} onBack={() => setView("hub")} onNav={openSurah} />;

  const Screen = (window.SCREENS || {})[view];
  // which sidebar item is highlighted
  const active = view;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: N.bg }}>
      <Sidebar active={active} go={go} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar query={query} setQuery={setQuery} searchRef={searchRef} go={go} mode={curMode} toggleTheme={toggleTheme} />
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === "hub" && <Hub onOpen={openSurah} query={query} setQuery={setQuery} go={go} />}
          {view === "tools" && <Tools onOpen={openSurah} go={go} />}
          {Screen && <Screen go={go} openSurah={openSurah} theme={theme} setAppTheme={setAppTheme} toggleTheme={toggleTheme} query={query} setQuery={setQuery} />}
        </div>
        <TabBar view={view} go={go} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
