/* Ummah Library — mobile screens, part 2: Bookmarks, More menu, and the Worship
   tools (Qibla, Prayer Tracker, Duʿās, Adhkār, Tasbih, Ramadan). Faithful ports of
   the web app screens into the 390×844 frame. Shared helpers come from ui.jsx +
   screens.jsx via window. */

// little row helpers
function RowChevron() { return <Icon name="chevR" size={17} color={N.faint} />; }

// ══ BOOKMARKS ═════════════════════════════════════════════════════════════════
function ScrBookmarks() {
  const cols = [["Reflection", "#E6B855"], ["Du'ā", "#5FA8D9"], ["Comfort", "#56AE6C"]];
  const items = [
    { label: "Al-Baqarah 2:286", col: "Comfort", colc: "#56AE6C", ar: "لَا يُكَلِّفُ ٱللَّٰهُ نَفْسًا إِلَّا وُسْعَهَا", en: "Allah does not burden a soul beyond that it can bear.", date: "2 days ago" },
    { label: "Ar-Raʿd 13:28", col: "Reflection", colc: "#E6B855", ar: "أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ", en: "Unquestionably, by the remembrance of Allah hearts are assured.", date: "Last week" },
  ];
  return (
    <>
      <StatusBar />
      <ToolHead title="Bookmarks" sub="Saved verses, collections & reflections" right={<Icon name="plus" size={21} color={N.gold} />} />
      <Body pad={20} style={{ paddingTop: 2 }}>
        <div style={{ display: "flex", gap: 4, padding: 4, background: N.bg2, border: `1px solid ${N.borderSoft}`, borderRadius: 12, marginBottom: 18 }}>
          {[["Verses", 24], ["Collections", 5], ["Reflections", 8]].map(([l, n], i) => (
            <div key={l} style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 9, background: i === 0 ? N.card : "transparent", color: i === 0 ? N.fg : N.muted, fontSize: 13.5, fontWeight: i === 0 ? 700 : 500 }}>
              {l} <span style={{ color: i === 0 ? N.gold : N.faint, fontWeight: 700 }}>{n}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Chip on>All <span style={{ opacity: 0.7 }}>24</span></Chip>
          {cols.map(([n, c]) => <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: N.muted, background: N.card, border: `1px solid ${N.border}`, borderRadius: 999, padding: "7px 13px" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{n}</span>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((b, i) => (
            <div key={i} style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: N.gold }}>{b.label}</span>
                <span style={{ fontSize: 11.5, color: b.colc, border: `1px solid ${b.colc}55`, background: `${b.colc}1f`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>{b.col}</span>
              </div>
              <div className="ul-ar" style={{ fontSize: 23, lineHeight: 1.95, textAlign: "right", color: N.fg, marginBottom: 10 }}>{b.ar}</div>
              <div style={{ fontSize: 14, color: N.muted, lineHeight: 1.6 }}>{b.en}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${N.borderSoft}` }}>
                <span style={{ fontSize: 12.5, color: N.faint }}>{b.date}</span>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12.5, color: N.faint, fontWeight: 600 }}><Icon name="arrowR" size={14} /> Open</span>
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12.5, color: N.faint, fontWeight: 600 }}><Icon name="layers" size={14} /> Move</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ MORE (mobile nav hub) ═════════════════════════════════════════════════════
const MORE_GROUPS = [
  ["Worship", [["Prayer Times", "moon"], ["Qibla", "compass"], ["Prayer Tracker", "check"], ["Adhkār", "repeat"], ["Tasbih", "more"], ["Ramadan", "moon"]]],
  ["Learn", [["Hadith", "globe"], ["99 Names", "grid"], ["Hijri Calendar", "cal"], ["Zakat", "layers"], ["Tafsīr", "tafsir"]]],
  ["Memorize", [["Hifz Review", "star"], ["Reading Goals", "check"], ["Reading Plans", "route"]]],
];
function ScrMore() {
  return (
    <>
      <StatusBar />
      <div style={{ flexShrink: 0, padding: "2px 20px 14px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>More</div>
      </div>
      <Body pad={20} style={{ paddingTop: 2 }}>
        {/* profile row */}
        <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 50, height: 50, borderRadius: 25, background: N.goldGrad, display: "grid", placeItems: "center", color: N.ink, fontSize: 21, fontWeight: 800, flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700 }}>Abdullah</div>
            <div style={{ fontSize: 12.5, color: N.faint }}>London, UK · 🔥 23-day streak</div>
          </div>
          <RowChevron />
        </div>
        {MORE_GROUPS.map(([group, items]) => (
          <div key={group} style={{ marginBottom: 22 }}>
            <SectionLabel>{group}</SectionLabel>
            <div style={{ ...card, overflow: "hidden" }}>
              {items.map(([label, icon], i, a) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < a.length - 1 ? `1px solid ${N.borderSoft}` : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: N.goldSoft, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={17} color={N.gold} /></div>
                  <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600 }}>{label}</div>
                  <RowChevron />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="settings" size={17} color={N.muted} /></div>
          <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600 }}>Settings</div>
          <RowChevron />
        </div>
      </Body>
      <TabBar active="more" />
    </>
  );
}

// ══ QIBLA ═════════════════════════════════════════════════════════════════════
function ScrQibla() {
  const heading = 92, qibla = 118;
  return (
    <>
      <StatusBar />
      <ToolHead title="Qibla Finder" sub="118° SE · 4,821 km to the Kaʿbah" glyph="🧭" />
      <Body pad={20}>
        <div style={{ ...card, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: 300, height: 300, marginBottom: 8 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${N.border}`, transform: `rotate(${-heading}deg)` }}>
              {[..."NESW"].map((d, i) => (
                <span key={d} style={{ position: "absolute", fontSize: 14, fontWeight: 700, color: d === "N" ? N.gold : N.faint, top: i === 0 ? 12 : i === 2 ? "auto" : "50%", bottom: i === 2 ? 12 : "auto", left: i === 3 ? 14 : i === 1 ? "auto" : "50%", right: i === 1 ? 14 : "auto", transform: (i === 0 || i === 2) ? "translateX(-50%)" : "translateY(-50%)" }}>{d}</span>
              ))}
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 1, height: i % 6 === 0 ? 12 : 6, background: N.border, transformOrigin: "center 138px", transform: `translate(-50%,-138px) rotate(${i * 15}deg)` }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: "50%", transformOrigin: "center bottom", transform: `translate(-50%,-100%) rotate(${qibla}deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 30, height: 30, marginBottom: -4, borderRadius: 7, background: N.goldGrad, display: "grid", placeItems: "center", fontSize: 16, transform: `rotate(${-qibla + heading}deg)` }}>🕋</div>
                <div style={{ width: 4, height: 118, background: N.goldGrad, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 14, height: 14, borderRadius: 7, background: N.gold, border: `3px solid ${N.bg}`, transform: "translate(-50%,-50%)" }} />
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>{((qibla - heading) % 360 + 360) % 360}°</div>
            <div style={{ fontSize: 13.5, color: N.muted }}>Turn until the Kaʿbah points straight up</div>
          </div>
        </div>
        <div style={{ ...card, padding: "14px 18px", marginTop: 14, display: "flex", alignItems: "center", gap: 10, color: N.muted, fontSize: 13.5 }}>
          <Icon name="compass" size={18} color={N.gold} /> Compass calibrated · accuracy ±3°
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ PRAYER TRACKER ════════════════════════════════════════════════════════════
function ScrTracker() {
  const prayers = ["Fajr", "Dhuhr", "ʿAṣr", "Maghrib", "ʿIshāʾ"];
  const today = ["ontime", "ontime", "late", "none", "none"];
  const col = (s) => s === "ontime" ? N.gold : s === "late" ? "#C98A57" : N.border;
  const lab = (s) => s === "ontime" ? "On time" : s === "late" ? "Late" : "Not yet";
  const hist = [[2, 2, 2, 1, 2], [2, 1, 2, 2, 0], [2, 2, 1, 2, 2], [1, 2, 2, 2, 1], [2, 2, 2, 0, 2], [2, 1, 2, 2, 2], [2, 2, 1, 0, 0]];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const cell = (v) => v === 2 ? N.gold : v === 1 ? "#C98A57" : "transparent";
  return (
    <>
      <StatusBar />
      <ToolHead title="Prayer Tracker" sub="One ṣalāh at a time" glyph="📿" />
      <Body pad={20}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <MStat big="3/5" label="Prayed today" />
          <MStat big="17 🔥" label="Day streak" />
          <MStat big="86%" label="On time (30d)" />
          <MStat big="4" label="Sunnah fasts" />
        </div>
        <div style={{ ...card, padding: 18, marginBottom: 16 }}>
          <SectionLabel>Today · tap to log</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {prayers.map((p, i) => {
              const st = today[i];
              return (
                <div key={p} style={{ padding: "13px 2px", borderRadius: 12, border: `1px solid ${st === "none" ? N.border : col(st)}`, background: st === "none" ? "transparent" : N.goldSoft, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 15, display: "grid", placeItems: "center", background: st === "ontime" ? N.goldGrad : "transparent", border: st === "ontime" ? "none" : `1.5px solid ${col(st)}` }}>
                    {st === "ontime" ? <Icon name="check" size={16} color={N.ink} /> : st === "late" ? <Icon name="check" size={14} color="#C98A57" /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: N.border }} />}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{p}</div>
                  <div style={{ fontSize: 9.5, color: st === "none" ? N.faint : N.gold, fontWeight: 600 }}>{lab(st)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint }}>Last 7 days</span>
            <div style={{ display: "flex", gap: 10, fontSize: 10.5, color: N.faint }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: N.gold }} />On time</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#C98A57" }} />Late</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: 6, alignItems: "center" }}>
            <div />
            {days.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10.5, color: N.faint, fontWeight: 700 }}>{d}</div>)}
            {prayers.map((p, pi) => (
              <React.Fragment key={p}>
                <div style={{ fontSize: 11, color: N.muted, fontWeight: 600, paddingRight: 4 }}>{p}</div>
                {hist.map((day, di) => (
                  <div key={di} style={{ aspectRatio: "1", borderRadius: 5, background: cell(day[pi]), border: day[pi] === 0 ? `1px solid ${N.border}` : "none", maxWidth: 26, width: "100%", margin: "0 auto" }} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ DUʿĀS ═════════════════════════════════════════════════════════════════════
const DUA_CATS = [["🌅", "Morning & Evening", 28], ["🛡", "Protection", 19], ["🤲", "Forgiveness", 14], ["🍽", "Food & Drink", 9], ["🏠", "Home & Travel", 16], ["💚", "Distress & Relief", 12]];
function ScrDuas() {
  return (
    <>
      <StatusBar />
      <ToolHead title="Duʿās" sub="A fortress of authentic supplication" glyph="🤲" />
      <Body pad={20}>
        <div style={{ ...card, padding: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, marginBottom: 22, position: "relative", overflow: "hidden" }}>
          <Khatam size={140} color={N.gold} opacity={0.06} sw={1.1} style={{ position: "absolute", right: -36, top: -40 }} />
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 12 }}>Duʿā of the day</div>
          <div className="ul-ar" style={{ fontSize: 25, lineHeight: 2, textAlign: "right", color: N.fg, marginBottom: 12 }}>رَبَّنَا آتِنَا فِي ٱلدُّنْيَا حَسَنَةً</div>
          <div style={{ fontSize: 14, color: N.muted, lineHeight: 1.6 }}>“Our Lord, give us good in this world and good in the Hereafter…”</div>
          <div style={{ fontSize: 12.5, color: N.gold, marginTop: 10, fontWeight: 600 }}>Al-Baqarah 2:201</div>
        </div>
        <SectionLabel>By moment</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DUA_CATS.map(([g, label, n]) => (
            <div key={label} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{g}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>{n} duʿās</div>
              </div>
              <RowChevron />
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ ADHKĀR ════════════════════════════════════════════════════════════════════
function ScrAdhkar() {
  const list = [
    { ar: "أَصْبَحْنَا وَأَصْبَحَ ٱلْمُلْكُ لِلَّٰهِ", tr: "Aṣbaḥnā wa aṣbaḥa l-mulku lillāh", en: "We have entered the morning and the dominion belongs to Allah.", c: 3, count: 1 },
    { ar: "سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ", tr: "Subḥāna llāhi wa bi-ḥamdih", en: "Glory be to Allah and His is the praise.", c: 100, count: 100 },
    { ar: "ٱللَّٰهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ", tr: "Allāhumma anta rabbī…", en: "O Allah, You are my Lord, there is no god but You — the Master of seeking forgiveness.", c: 0, count: 1 },
  ];
  return (
    <>
      <StatusBar />
      <ToolHead title="Adhkār" sub="2 of 12 completed this morning" glyph="☼" right={<div style={{ display: "flex", borderRadius: 9, border: `1px solid ${N.border}`, overflow: "hidden" }}><span style={{ padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: N.ink, background: N.gold }}>Morning</span><span style={{ padding: "6px 11px", fontSize: 12.5, color: N.muted }}>Evening</span></div>} />
      <Body pad={20}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((d, i) => {
            const full = d.c >= d.count;
            return (
              <div key={i} style={{ ...card, padding: 18, borderColor: full ? N.gold : N.border, background: full ? N.goldSoft : N.card }}>
                <div className="ul-ar" style={{ fontSize: 24, lineHeight: 2, color: N.fg, textAlign: "right", marginBottom: 12 }}>{d.ar}</div>
                <div style={{ fontSize: 13.5, fontStyle: "italic", color: N.gold, marginBottom: 6, opacity: 0.9 }}>{d.tr}</div>
                <div style={{ fontSize: 14, color: N.muted, lineHeight: 1.6 }}>{d.en}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 90, height: 6, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${(d.c / d.count) * 100}%`, height: "100%", background: N.goldGrad }} /></div>
                    <span style={{ fontSize: 12.5, color: N.faint }}>{d.c} / {d.count}</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: full ? N.gold : N.faint, display: "inline-flex", alignItems: "center", gap: 5 }}>{full ? <><Icon name="check" size={14} /> Done</> : "Tap to count"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ TASBIH ════════════════════════════════════════════════════════════════════
function ScrTasbih() {
  const count = 33, target = 33, pct = count / target;
  const R = 130, C = 2 * Math.PI * R;
  return (
    <>
      <StatusBar />
      <ToolHead title="Tasbih Counter" sub="Tap the dial to count" glyph="◍" right={<span style={{ ...card, padding: "7px 13px", fontSize: 12.5, color: N.muted }}>Reset</span>} />
      <Body pad={20} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 22 }}>
          {["SubḥānAllāh", "Alḥamdulillāh", "Allāhu akbar"].map((x, i) => <Chip key={x} on={i === 0}>{x}</Chip>)}
        </div>
        <div style={{ position: "relative", width: 280, height: 280, margin: "8px auto 0", display: "grid", placeItems: "center" }}>
          <svg width="280" height="280" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx="140" cy="140" r={R} fill="none" stroke={N.border} strokeWidth="10" />
            <circle cx="140" cy="140" r={R} fill="none" stroke={N.gold} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
          </svg>
          <div style={{ width: 210, height: 210, borderRadius: "50%", background: `radial-gradient(circle at 50% 35%, ${N.cardHi}, ${N.card})`, border: `1px solid ${N.border}`, display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div className="ul-ar" style={{ fontSize: 25, color: N.goldHi, marginBottom: 4 }}>سُبْحَانَ ٱللَّٰه</div>
              <div style={{ fontSize: 62, fontWeight: 800, color: N.fg, lineHeight: 1, letterSpacing: -2 }}>{count}</div>
              <div style={{ fontSize: 13, color: N.faint, marginTop: 6 }}>of {target}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 24 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>2</div><div style={{ fontSize: 12, color: N.faint, marginTop: 2 }}>Cycles complete</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>99</div><div style={{ fontSize: 12, color: N.faint, marginTop: 2 }}>Total today</div></div>
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ RAMADAN ═══════════════════════════════════════════════════════════════════
function ScrRamadan() {
  const fastDays = Array.from({ length: 30 }, (_, i) => i < 13 ? 2 : i === 13 ? 3 : 0);
  const daily = [["Suhūr", "sun", true], ["Fajr in jamāʿah", "moon", true], ["Qurʾān juzʾ", "book", false], ["Tarāwīḥ", "moon", false]];
  return (
    <>
      <StatusBar />
      <ToolHead title="Ramadan" sub="Thursday · 14 Ramaḍān 1447" glyph="🌙" />
      <Body pad={20}>
        <div style={{ ...card, padding: "26px 20px", textAlign: "center", background: `linear-gradient(150deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <Khatam size={220} color={N.gold} opacity={0.06} sw={0.9} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700 }}>Time until Ifṭār</div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, margin: "12px 0 4px" }}>
              {[["03", "hrs"], ["41", "min"], ["18", "sec"]].map(([v, l], i) => (
                <React.Fragment key={l}>
                  {i > 0 && <span style={{ fontSize: 34, fontWeight: 300, color: N.faint }}>:</span>}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                    <span style={{ fontSize: 10, color: N.faint, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{l}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: N.muted, marginBottom: 6 }}><span>Suhūr 4:48</span><span>Ifṭār 7:21</span></div>
              <div style={{ height: 7, borderRadius: 4, background: N.border, overflow: "hidden" }}><div style={{ width: "62%", height: "100%", background: N.goldGrad }} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <MStat big="13/30" label="Fasts kept" />
          <MStat big="12" label="Tarāwīḥ nights" />
          <MStat big="43%" label="Khatm progress" />
          <MStat big="1" label="To make up" />
        </div>
        <div style={{ ...card, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint }}>Fasting · Ramaḍān</span>
            <span style={{ fontSize: 11, color: N.gold }}>✦ last ten</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
            {fastDays.map((st, i) => {
              const last10 = i >= 20;
              return (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 8, display: "grid", placeItems: "center", position: "relative", fontSize: 11.5, fontWeight: 700, background: st === 2 ? N.goldGrad : st === 3 ? N.goldSoft : "transparent", border: st === 3 ? `1.5px solid ${N.gold}` : st === 2 ? "none" : `1px solid ${N.borderSoft}`, color: st === 2 ? N.ink : st === 3 ? N.gold : last10 ? N.gold : N.faint }}>
                  {i + 1}
                  {last10 && (i + 1) % 2 === 1 && st !== 2 && <span style={{ position: "absolute", top: 2, right: 3, fontSize: 7, color: N.gold }}>✦</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint }}>Today's worship</span>
            <span style={{ fontSize: 12.5, color: N.gold, fontWeight: 700 }}>2/4</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {daily.map(([label, icon, on]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 11, border: `1px solid ${on ? N.gold : N.border}`, background: on ? N.goldSoft : "transparent" }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0, background: on ? N.goldGrad : "transparent", border: on ? "none" : `1.5px solid ${N.border}` }}>{on ? <Icon name="check" size={13} color={N.ink} /> : <Icon name={icon} size={12} color={N.faint} />}</div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? N.fg : N.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

Object.assign(window, {
  ScrBookmarks, ScrMore, ScrQibla, ScrTracker, ScrDuas, ScrAdhkar, ScrTasbih, ScrRamadan,
});
