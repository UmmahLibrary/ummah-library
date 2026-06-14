/* Ummah Library — mobile spec document. Header + Noor foundations strip +
   all 24 app screens grouped by information architecture, each frame paired with
   a redline (route · tokens · type · icons · dp). Data-driven for brevity. */

const PALETTE = ["bg", "bg2", "card", "cardHi", "border", "borderSoft", "fg", "muted", "faint", "gold", "goldHi", "goldDim", "goldSoft", "ink"];
const ALL_ICONS = ["search", "book", "home", "settings", "grid", "star", "heart", "globe", "tafsir", "compass", "moon", "sun", "repeat", "layers", "check", "plus", "minus", "close", "menu", "chevL", "chevR", "chevD", "arrowL", "arrowR", "play", "pause", "bookmark", "bell", "hands", "type", "share", "headphones", "route", "cal", "user", "fire", "download", "eye"];

function Swatch({ name }) {
  const v = N[name]; const grad = typeof v === "string" && v.startsWith("linear");
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${N.border}`, background: N.card }}>
      <div style={{ height: 64, background: grad ? v : v }} />
      <div style={{ padding: "9px 11px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: N.fg, fontFamily: "ui-monospace, Menlo, monospace" }}>{name}</div>
        <div style={{ fontSize: 11, color: N.faint, marginTop: 2 }}>{TOK_DESC[name]}</div>
        <div style={{ fontSize: 11, color: N.muted, marginTop: 4, fontFamily: "ui-monospace, Menlo, monospace", textTransform: "uppercase" }}>{typeof v === "string" && v.length < 9 ? v : "wash"}</div>
      </div>
    </div>
  );
}
function FoundBlock({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function Foundations() {
  return (
    <div style={{ padding: "48px 0 8px", display: "flex", flexDirection: "column", gap: 48 }}>
      <FoundBlock title="Palette · Obsidian (default dark)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          {PALETTE.map((p) => <Swatch key={p} name={p} />)}
        </div>
      </FoundBlock>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 48 }}>
        <FoundBlock title="Typography">
          <div style={{ ...card, padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <div style={{ fontSize: 11, color: N.faint, marginBottom: 8, fontFamily: "ui-monospace, Menlo, monospace" }}>Hanken Grotesk · UI / Latin</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1 }}>Read, listen, reflect</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 400, color: N.muted }}>Regular 400</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: N.muted }}>Semibold 600</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: N.fg }}>Extrabold 800</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: N.faint, marginTop: 12 }}>Uppercase label · 11 / +1.4</div>
            </div>
            <div style={{ height: 1, background: N.borderSoft }} />
            <div>
              <div style={{ fontSize: 11, color: N.faint, marginBottom: 10, fontFamily: "ui-monospace, Menlo, monospace" }}>IBM Plex Sans Arabic · RTL</div>
              <div className="ul-ar" style={{ fontSize: 34, lineHeight: 1.8, textAlign: "right", color: N.fg }}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
            </div>
          </div>
        </FoundBlock>

        <FoundBlock title="Khatam motif & scale">
          <div style={{ ...card, padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                <Khatam size={96} color={N.gold} sw={1.2} />
                <div style={{ position: "absolute" }}><Khatam size={52} color={N.goldHi} sw={1.6} opacity={0.6} /></div>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: N.muted }}>8-point star — two overlapped squares + a centre circle. Ayah badges, empty states and faint background watermarks.</div>
            </div>
            <div style={{ height: 1, background: N.borderSoft }} />
            <div style={{ fontSize: 12.5, color: N.muted, lineHeight: 1.7 }}>
              {[["Type scale", "11 · 13 · 15 · 17 · 22 · 30"], ["Radii", "9 · 12 · 14 · 16 · 999"], ["Screen padding", "20 dp"], ["Min hit target", "44 dp"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginTop: k === "Type scale" ? 0 : 6 }}><span>{k}</span><span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: N.fg }}>{v}</span></div>
              ))}
            </div>
          </div>
        </FoundBlock>
      </div>

      <FoundBlock title="Line icons · 1.7–1.8 stroke, monochrome">
        <div style={{ ...card, padding: "20px 16px", display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: "20px 8px" }}>
          {ALL_ICONS.map((n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <Icon name={n} size={21} color={N.muted} />
              <span style={{ fontSize: 9.5, color: N.faint, fontFamily: "ui-monospace, Menlo, monospace" }}>{n}</span>
            </div>
          ))}
        </div>
      </FoundBlock>

      <FoundBlock title="Bottom tab bar · Home · Read · Search · Du'ās · More">
        <div style={{ ...card, padding: 0, overflow: "hidden", maxWidth: 430 }}>
          <div style={{ display: "flex", padding: "10px 8px 12px", background: N.bg2 }}>
            {[["home", "Home", true], ["book", "Read"], ["search", "Search"], ["hands", "Du'ās"], ["grid", "More"]].map(([ic, l, on]) => (
              <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <Icon name={ic} size={22} sw={on ? 2 : 1.7} color={on ? N.gold : N.faint} />
                <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? N.gold : N.faint }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </FoundBlock>
    </div>
  );
}

// ── compact spec from data ────────────────────────────────────────────────────
function SpecD({ d }) {
  return (
    <Spec route={d.route} blurb={d.blurb}>
      {d.layout && <SGroup title="Layout">{d.layout.map(([k, v]) => <Note key={k} k={k} v={v} />)}</SGroup>}
      {d.tokens && <SGroup title="Tokens"><Tokens names={d.tokens} /></SGroup>}
      {d.type && <SGroup title="Type">{d.type.map(([k, v]) => <Note key={k} k={k} v={v} />)}</SGroup>}
      {d.icons && <SGroup title="Icons"><IconRefs names={d.icons} /></SGroup>}
      {d.extra}
    </Spec>
  );
}

function SectionDivider({ kicker, title, blurb }) {
  return (
    <div style={{ paddingTop: 78, paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <Khatam size={30} color={N.gold} sw={1.6} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: N.gold }}>{kicker}</span>
        <div style={{ flex: 1, height: 1, background: N.borderSoft }} />
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 15.5, lineHeight: 1.6, color: N.muted, margin: 0, maxWidth: 640 }}>{blurb}</p>
    </div>
  );
}

// ── all 24 screens, grouped by IA ─────────────────────────────────────────────
const GROUPS = [
  {
    kicker: "Get started", title: "Onboarding", blurb: "First run, outside the tab navigator.",
    screens: [
      { title: "Onboarding", frameLabel: "Welcome · step 1 of 3", frameSub: "app/(onboarding)/index.tsx", render: () => ScrOnboarding(),
        route: "app/(onboarding)/index.tsx", blurb: "Full-bleed welcome — centred Khatam lockup, extrabold headline, paged dots, single gold CTA. No tab bar.",
        layout: [["Container", "flex:1 · pad 0 30"], ["CTA", "h 54 · radius 14"], ["Dots", "active 22×7 · rest 7"]], tokens: ["bg", "fg", "muted", "gold", "goldHi", "ink", "border"], type: [["Headline", "30 / 800 / -0.6"], ["Body", "16 / 400"]], icons: ["star"] },
    ],
  },
  {
    kicker: "Read", title: "Reading & library", blurb: "The core loop — the Quran, the reader, search and saved verses. Home, Read and Search are tab roots; the reader and tafsīr sheet are pushed routes.",
    screens: [
      { title: "Home · Today", frameLabel: "Home tab", frameSub: "app/(tabs)/index.tsx", render: () => ScrHome(),
        route: "app/(tabs)/index.tsx", blurb: "Daily landing — continue-reading card with progress, next-prayer strip, verse of the day, quick actions.",
        layout: [["Header", "greeting + bell 42"], ["Cards gap", "14 dp"], ["Progress", "h 6 · radius 3"], ["Quick tiles", "flex:1 ×3 · gap 12"]], tokens: ["bg", "card", "cardHi", "gold", "goldSoft", "muted", "faint", "border"], type: [["‘Today’", "26 / 800"], ["Card title", "17 / 700"], ["Arabic", "24 · Plex AR"]], icons: ["bell", "moon", "bookmark", "book", "headphones", "compass"] },
      { title: "Surah Index", frameLabel: "Read tab", frameSub: "app/(tabs)/read.tsx", render: () => ScrIndex(),
        route: "app/(tabs)/read.tsx", blurb: "Browse 114 surahs. Large title, search, Surah / Juzʾ / Revelation segmented control, divided list with Khatam badges.",
        layout: [["Search", "h 44 · radius 12"], ["Segmented", "Seg · size sm"], ["List row", "13 dp · divider"], ["Badge", "Khatam 40"]], tokens: ["bg", "card", "border", "borderSoft", "fg", "faint", "goldHi", "goldDim"], type: [["Title", "30 / 800"], ["Row name", "16 / 700"], ["Meta", "13 · faint"]], icons: ["search"] },
      { title: "Reader", frameLabel: "Tajwīd colours ON", frameSub: "app/reader/[surah].tsx", render: () => ScrReader({ tajwid: true }),
        route: "app/reader/[surah].tsx", blurb: "Reading surface — pushed route, no tab bar. Centred reader bar, Khatam surah header + basmala, ayah blocks, docked audio bar. Tajwīd tints recitation rules.",
        layout: [["Reader bar", "back · title · type"], ["Ayah block", "18 dp · divider"], ["Arabic", "27 · line 2.1"], ["Audio bar", "play 42 · scrub"]], tokens: ["bg", "bg2", "fg", "muted", "gold", "goldDim", "goldHi", "borderSoft"], type: [["Arabic", "27 · Plex AR"], ["Translation", "14.5 / 1.6"]], icons: ["chevL", "type", "play", "pause", "bookmark", "share", "repeat"],
        extra: <SGroup title="Tajwīd legend"><div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>{[["Qalqalah", TJ.qalqalah], ["Ghunnah", TJ.ghunnah], ["Madd", TJ.madd], ["Idghām", TJ.idgham]].map(([l, c]) => (<span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: N.muted }}><span style={{ width: 13, height: 13, borderRadius: 4, background: c }} />{l}</span>))}</div></SGroup> },
      { title: "Tafsīr sheet", frameLabel: "Bottom sheet · 71%", frameSub: "components/TafsirSheet.tsx", render: () => ScrTafsir(),
        route: "components/TafsirSheet.tsx", blurb: "Draggable bottom sheet over the dimmed reader — grab handle, ayah header, ayah card, gold theme pill, scrollable tafsīr prose.",
        layout: [["Sheet", "600/844 ≈ 71%"], ["Top radius", "26 dp"], ["Handle", "40 × 5"], ["Backdrop", "opacity .32"]], tokens: ["cardHi", "card", "border", "borderSoft", "fg", "muted", "gold", "goldSoft"], type: [["Tafsīr", "15 / 1.75"], ["Pill", "12 / 700"]], icons: ["close"] },
      { title: "Bookmarks", frameLabel: "Verses tab", frameSub: "app/bookmarks/index.tsx", render: () => ScrBookmarks(),
        route: "app/bookmarks/index.tsx", blurb: "Saved verses, collections and reflections. Segmented tabs with counts, colour-coded collection chips, verse cards with provenance.",
        layout: [["Tab control", "3-up · radius 12"], ["Collection chip", "dot + label"], ["Card", "radius 16 · pad 18"]], tokens: ["bg", "bg2", "card", "border", "borderSoft", "fg", "muted", "gold"], type: [["Ref", "13 / 700 · gold"], ["Arabic", "23 · Plex AR"]], icons: ["plus", "arrowR", "layers"] },
      { title: "Search", frameLabel: "Search tab · active", frameSub: "app/(tabs)/search.tsx", render: () => ScrSearch(),
        route: "app/(tabs)/search.tsx", blurb: "Focused field (gold border + caret), recent chips, results grouped by Surahs and Verses with goldSoft match highlights.",
        layout: [["Field focus", "border → gold"], ["Chips", "pill 999"], ["Result", "13 dp · divider"]], tokens: ["bg", "card", "border", "gold", "goldSoft", "fg", "muted", "faint"], type: [["Title", "30 / 800"], ["Snippet", "14.5 / 1.55"]], icons: ["search", "chevR"] },
    ],
  },
  {
    kicker: "Worship", title: "Worship & daily practice", blurb: "Reached through the More tab — prayer, qibla, tracking, supplications and the Ramaḍān hub. Each is a pushed route with a back header.",
    screens: [
      { title: "More", frameLabel: "More tab", frameSub: "app/(tabs)/more.tsx", render: () => ScrMore(),
        route: "app/(tabs)/more.tsx", blurb: "The mobile nav hub for everything beyond the four primary tabs — profile row, then grouped Worship / Learn / Memorize lists.",
        layout: [["Profile row", "avatar 50 + chevron"], ["Group card", "rows · divider"], ["Row icon", "34 tile · goldSoft"]], tokens: ["bg", "card", "border", "borderSoft", "fg", "muted", "faint", "gold", "goldSoft"], type: [["‘More’", "30 / 800"], ["Row", "15.5 / 600"]], icons: ["moon", "compass", "check", "repeat", "globe", "grid", "cal", "layers", "star", "route", "settings"] },
      { title: "Prayer Times", frameLabel: "Pushed from More", frameSub: "app/prayer/index.tsx", render: () => ScrPrayer(),
        route: "app/prayer/index.tsx", blurb: "Location row, hero countdown card with Khatam watermark and tabular timer, then the six daily times. Past dims to faint; next is washed goldSoft.",
        layout: [["Hero", "radius 16 · pad 26"], ["Timer", "52 / 800 · tabular"], ["List row", "15 dp · divider"]], tokens: ["bg", "card", "cardHi", "gold", "goldHi", "goldSoft", "muted", "faint"], type: [["Timer", "52 / 800 / -2"], ["Prayer", "16 / 600"]], icons: ["compass", "sun", "moon", "settings"] },
      { title: "Qibla Finder", frameLabel: "Pushed from More", frameSub: "app/qibla/index.tsx", render: () => ScrQibla(),
        route: "app/qibla/index.tsx", blurb: "Rotating compass dial with cardinal marks and 24 ticks, a gold Kaʿbah pointer fixed to the qibla bearing, large degree readout.",
        layout: [["Dial", "300 · ring 1px"], ["Ticks", "24 · 15° apart"], ["Pointer", "gold · 118°"]], tokens: ["bg", "card", "border", "gold", "goldGrad", "muted", "faint"], type: [["Degrees", "30 / 800 · gold"]], icons: ["compass"] },
      { title: "Prayer Tracker", frameLabel: "Pushed from More", frameSub: "app/tracker/index.tsx", render: () => ScrTracker(),
        route: "app/tracker/index.tsx", blurb: "Consistency tracker — stat tiles, today's five as tappable tri-state chips (on-time / late / not yet), and a 7-day prayer heatmap.",
        layout: [["Stat grid", "2×2 tiles"], ["Today", "5-up chips"], ["Heatmap", "5 rows × 7"]], tokens: ["bg", "card", "border", "gold", "goldSoft", "fg", "muted", "faint"], type: [["Stat", "21 / 800 · gold"], ["Chip", "11.5 / 700"]], icons: ["check"], extra: <SGroup title="States"><div style={{ display: "flex", gap: 14, fontSize: 12.5, color: N.muted }}><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 4, background: N.gold }} />On time</span><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 4, background: "#C98A57" }} />Late</span></div></SGroup> },
      { title: "Duʿās", frameLabel: "Pushed from More", frameSub: "app/duas/index.tsx", render: () => ScrDuas(),
        route: "app/duas/index.tsx", blurb: "Du'ā of the day hero card, then category rows by moment (morning, protection, forgiveness…) with glyph tiles and counts.",
        layout: [["Hero", "gradient · Khatam"], ["Category row", "tile 46 + chevron"]], tokens: ["bg", "card", "cardHi", "gold", "goldSoft", "fg", "muted", "faint"], type: [["Arabic", "25 · Plex AR"], ["Row", "15 / 700"]], icons: ["chevR"] },
      { title: "Adhkār", frameLabel: "Morning / Evening", frameSub: "app/adhkar/index.tsx", render: () => ScrAdhkar(),
        route: "app/adhkar/index.tsx", blurb: "Morning/evening segmented header; tap-to-count dhikr cards with Arabic, transliteration, meaning and a progress bar to the target count.",
        layout: [["Header seg", "Morning/Evening"], ["Card", "tap to count"], ["Progress", "90 × 6 bar"]], tokens: ["bg", "card", "border", "gold", "goldSoft", "fg", "muted", "faint"], type: [["Arabic", "24 · Plex AR"], ["Translit", "13.5 italic"]], icons: ["check"] },
      { title: "Tasbih", frameLabel: "Pushed from More", frameSub: "app/tasbih/index.tsx", render: () => ScrTasbih(),
        route: "app/tasbih/index.tsx", blurb: "Tap-anywhere dhikr dial — preset chips, a ring that fills to the target, big tabular count, cycle and daily totals.",
        layout: [["Dial", "280 · ring 10"], ["Inner", "210 disc"], ["Count", "62 / 800"]], tokens: ["bg", "card", "cardHi", "gold", "goldHi", "border", "fg", "faint"], type: [["Count", "62 / 800 / -2"], ["Arabic", "25 · Plex AR"]], icons: [] },
      { title: "Ramadan", frameLabel: "Pushed from More", frameSub: "app/ramadan/index.tsx", render: () => ScrRamadan(),
        route: "app/ramadan/index.tsx", blurb: "Seasonal hub — live ifṭār countdown, fast-day progress, stat tiles, the 30-day fasting calendar (last-ten ✦ marks) and a daily worship checklist.",
        layout: [["Hero", "countdown + bar"], ["Stat grid", "2×2"], ["Calendar", "10-col days"], ["Checklist", "2-up"]], tokens: ["bg", "card", "cardHi", "gold", "goldGrad", "goldSoft", "muted", "faint"], type: [["Countdown", "48 / 800 · tabular"], ["Day", "11.5 / 700"]], icons: ["sun", "moon", "book", "check"] },
    ],
  },
  {
    kicker: "Learn", title: "Learn & reference", blurb: "Knowledge surfaces — the divine names, the hadith corpus, the Hijri calendar and the zakat calculator.",
    screens: [
      { title: "The 99 Names", frameLabel: "Pushed from More", frameSub: "app/names/index.tsx", render: () => ScrNames(),
        route: "app/names/index.tsx", blurb: "Featured name card with glowing Arabic, then a 2-up grid of the Asmāʾ al-Ḥusnā — number, Arabic, transliteration, meaning.",
        layout: [["Featured", "centred · Khatam"], ["Grid", "2-up cards"]], tokens: ["bg", "card", "cardHi", "gold", "goldHi", "goldSoft", "fg", "muted", "faint"], type: [["Arabic XL", "52 · Plex AR"], ["Name", "14.5 / 700"]], icons: [] },
      { title: "Hadith", frameLabel: "Pushed from More", frameSub: "app/hadith/index.tsx", render: () => ScrHadith(),
        route: "app/hadith/index.tsx", blurb: "Search the prophetic tradition — search field, collection filter chips, and hadith cards with grade badge, narrator, text, reference and topic tags.",
        layout: [["Search", "h 48"], ["Filter chips", "collection scope"], ["Card", "grade badge"]], tokens: ["bg", "card", "border", "borderSoft", "gold", "fg", "muted", "faint"], type: [["Arabic", "22 · Plex AR"], ["Body", "14.5 / 1.6"]], icons: ["search", "book"], extra: <SGroup title="Grade colours"><div style={{ display: "flex", gap: 14, fontSize: 12.5, color: N.muted }}><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#5BBF8A" }} />Ṣaḥīḥ</span><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: N.gold }} />Ḥasan</span></div></SGroup> },
      { title: "Hijri Calendar", frameLabel: "Pushed from More", frameSub: "app/calendar/index.tsx", render: () => ScrCalendar(),
        route: "app/calendar/index.tsx", blurb: "Month grid with today on a gold fill and event days marked with a dot, plus a list of the sacred dates that month.",
        layout: [["Month grid", "7-col · aspect 1"], ["Today", "goldGrad fill"], ["Events", "list · 44 badge"]], tokens: ["bg", "card", "border", "borderSoft", "gold", "goldGrad", "goldSoft", "ink", "fg"], type: [["Day", "14 / 500"], ["Event", "14.5 / 700"]], icons: [] },
      { title: "Zakat Calculator", frameLabel: "Pushed from More", frameSub: "app/zakat/index.tsx", render: () => ScrZakat(),
        route: "app/zakat/index.tsx", blurb: "Live 2.5% calculation — a gold result card breaking down assets, liabilities, net zakatable wealth and niṣāb, above the asset input rows.",
        layout: [["Result card", "gradient · Khatam"], ["Breakdown", "k/v rows"], ["Input", "£ field · h 44"]], tokens: ["bg", "bg2", "card", "cardHi", "gold", "borderSoft", "fg", "muted", "faint"], type: [["Due", "44 / 800 · gold"], ["Row", "14 / 600"]], icons: [] },
    ],
  },
  {
    kicker: "Memorize & you", title: "Memorization & account", blurb: "Habit and progress — spaced-repetition ḥifẓ, reading goals and plans, the profile, and the settings that re-theme the whole app.",
    screens: [
      { title: "Hifz Review", frameLabel: "Pushed from More", frameSub: "app/hifz/index.tsx", render: () => ScrHifz(),
        route: "app/hifz/index.tsx", blurb: "Spaced-repetition memorization — stat tiles, a start-session card, and a review queue with per-surah recall-strength bars and due labels.",
        layout: [["Stat grid", "2×2"], ["Session card", "gradient + CTA"], ["Queue row", "badge + recall bar"]], tokens: ["bg", "card", "cardHi", "gold", "goldGrad", "border", "fg", "muted", "faint"], type: [["Stat", "21 / 800"], ["Recall", "11.5 · faint"]], icons: ["play"], extra: <SGroup title="Recall scale"><div style={{ display: "flex", gap: 12, fontSize: 12.5, color: N.muted }}><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: N.gold }} />Strong</span><span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#8A6B2E" }} />Weak</span></div></SGroup> },
      { title: "Reading Goals", frameLabel: "Pushed from More", frameSub: "app/goals/index.tsx", render: () => ScrGoals(),
        route: "app/goals/index.tsx", blurb: "Daily habit — a large progress ring against the minute target, a 7-bar weekly chart, and a streak + khatm-pace card.",
        layout: [["Ring", "180 · sw 14"], ["Bar chart", "7 bars · today gold"], ["Streak card", "split row"]], tokens: ["bg", "card", "border", "gold", "goldGrad", "fg", "muted", "faint"], type: [["Ring value", "38 / 800"], ["Streak", "28 / 800"]], icons: [] },
      { title: "Reading Plans", frameLabel: "Pushed from More", frameSub: "app/plans/index.tsx", render: () => ScrPlans(),
        route: "app/plans/index.tsx", blurb: "Structured journeys — active-plan card with progress ring and CTA, a 7-day completion strip, then a browseable plan library with progress or start states.",
        layout: [["Active card", "ring + Read CTA"], ["Week strip", "7-up · checks"], ["Library", "tag + progress"]], tokens: ["bg", "card", "cardHi", "gold", "goldGrad", "goldSoft", "border", "fg", "muted"], type: [["Plan name", "19 / 800"], ["Tag", "11 / 700"]], icons: ["book", "check", "plus"] },
      { title: "Profile", frameLabel: "Pushed from More", frameSub: "app/profile/index.tsx", render: () => ScrProfile(),
        route: "app/profile/index.tsx", blurb: "Identity + lifetime stats — gradient header with avatar, a 3-up stat grid, and an achievements grid where locked badges desaturate.",
        layout: [["Header", "avatar 64 + name"], ["Stat grid", "3-up tiles"], ["Badges", "3-up · locked .5"]], tokens: ["bg", "card", "cardHi", "gold", "goldGrad", "goldSoft", "border", "fg", "muted"], type: [["Name", "21 / 800"], ["Stat", "21 / 800 · gold"]], icons: ["settings"] },
      { title: "Settings", frameLabel: "Pushed from More", frameSub: "app/settings/index.tsx", render: () => ScrSettings(),
        route: "app/settings/index.tsx", blurb: "Grouped list. Appearance shows all eight Noor themes as tappable swatches (Obsidian selected). Reading holds toggles; Data exposes restart and a destructive reset in error red.",
        layout: [["Group card", "rows divided"], ["Toggle", "44 × 27"], ["Theme swatch", "34 · ring 2px"]], tokens: ["bg", "card", "border", "borderSoft", "fg", "muted", "faint", "gold", "ink"], type: [["Section", "12 / 700 · +1.2"], ["Row", "15.5 / 600"]], icons: ["chevL", "repeat", "close", "chevR"], extra: <div style={{ fontSize: 12.5, color: N.faint, marginTop: -8 }}>Destructive uses <code style={{ color: "#FF8A7E" }}>error #FF8A7E</code></div> },
    ],
  },
];

function Doc() {
  let n = 0;
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px 110px" }}>
      <header style={{ paddingTop: 56, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, borderBottom: `1px solid ${N.borderSoft}`, paddingBottom: 32 }}>
        <div>
          <Logo scale={1.15} />
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, margin: "22px 0 10px", lineHeight: 1.05 }}>Mobile screens</h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: N.muted, margin: 0, maxWidth: 640 }}>The complete React Native (Expo) app — <span style={{ color: N.gold, fontWeight: 600 }}>24 screens</span> across every section of the product, drawn 1:1 against the <span style={{ color: N.gold, fontWeight: 600 }}>Noor</span> design system. Each frame is paired with a redline ready for <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: N.fg }}>StyleSheet</span>.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: N.muted, textAlign: "right" }}>
          {[["Framework", "Expo SDK 54 · TS"], ["Frame", "iPhone · 390 × 844"], ["Layout", "Flexbox only"], ["Theme", "Obsidian (dark)"], ["Screens", "24"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
              <span style={{ color: N.faint }}>{k}</span>
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: N.fg, width: 150, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      </header>

      <Foundations />

      {GROUPS.map((g) => (
        <div key={g.kicker}>
          <SectionDivider kicker={g.kicker} title={g.title} blurb={g.blurb} />
          {g.screens.map((s) => {
            n += 1;
            const num = String(n).padStart(2, "0");
            return (
              <Screen key={s.title} n={num} title={s.title} frameLabel={s.frameLabel} frameSub={s.frameSub} render={s.render}>
                <SpecD d={s} />
              </Screen>
            );
          })}
        </div>
      ))}

      <footer style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${N.borderSoft}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Khatam size={30} color={N.gold} sw={1.6} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13.5, color: N.muted, lineHeight: 1.7, maxWidth: 780 }}>
          All colours reference the shared Noor token set (<span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: N.fg }}>bg, card, border, fg, muted, faint, gold, goldSoft, ink…</span>) — map them to a <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: N.fg }}>StyleSheet</span> theme object, not raw hex. Sizes are unitless dp. Switching the active theme (one of eight) recolours every screen, reader accents included.
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Doc />);
