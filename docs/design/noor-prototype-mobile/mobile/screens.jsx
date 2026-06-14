/* Ummah Library — the eight mobile screens, rendered inside the Phone frame.
   Flexbox-only layouts, Noor tokens, line-icons + Khatam. Each export returns the
   full 390×844 screen content (status bar → content → tab bar / home indicator). */

// ── shared mini-components ────────────────────────────────────────────────────
function Field({ placeholder, focused }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 44, padding: "0 14px", borderRadius: 12, background: N.card, border: `1px solid ${focused ? N.gold : N.border}` }}>
      <Icon name="search" size={18} color={focused ? N.gold : N.faint} />
      <span style={{ fontSize: 15, color: focused ? N.fg : N.faint, flex: 1 }}>{placeholder}</span>
      {focused && <div style={{ width: 1.5, height: 18, background: N.gold }} />}
    </div>
  );
}
function AyahBadge({ n, size = 34 }) {
  return (
    <span style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <Khatam size={size} color={N.goldDim} sw={1.2} />
      <span style={{ position: "absolute", fontSize: size * 0.32, fontWeight: 700, color: N.gold }}>{n}</span>
    </span>
  );
}
function Toggle({ on }) {
  return (
    <div style={{ width: 44, height: 27, borderRadius: 14, background: on ? N.gold : N.border, padding: 3, display: "flex", justifyContent: on ? "flex-end" : "flex-start", flexShrink: 0 }}>
      <div style={{ width: 21, height: 21, borderRadius: 11, background: on ? N.ink : N.faint }} />
    </div>
  );
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, margin: "22px 2px 11px" }}>{children}</div>;
}

// ══ 1 · ONBOARDING ════════════════════════════════════════════════════════════
function ScrOnboarding() {
  return (
    <>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 30px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ position: "relative", display: "grid", placeItems: "center", marginBottom: 40 }}>
            <Khatam size={172} color={N.gold} sw={1.1} opacity={0.9} />
            <div style={{ position: "absolute" }}><Khatam size={96} color={N.goldHi} sw={1.4} opacity={0.5} /></div>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, margin: "0 0 14px", lineHeight: 1.15 }}>The Qur'ān,<br />beautifully open</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: N.muted, margin: 0, maxWidth: 300 }}>Read, listen and reflect — with translation, tafsīr and word-by-word, free and ad-free forever.</p>
        </div>
        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 28 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: i === 0 ? 22 : 7, height: 7, borderRadius: 4, background: i === 0 ? N.gold : N.border }} />
          ))}
        </div>
        <button style={{ height: 54, borderRadius: 14, border: "none", background: N.goldGrad, color: N.ink, fontSize: 16.5, fontWeight: 700, fontFamily: N.ui, marginBottom: 12 }}>Get started</button>
        <div style={{ textAlign: "center", fontSize: 14.5, color: N.muted, paddingBottom: 6 }}>I already have an account</div>
      </div>
      <HomeIndicator />
    </>
  );
}

// ══ 2 · HOME / TODAY ══════════════════════════════════════════════════════════
function ScrHome() {
  return (
    <>
      <StatusBar />
      <div style={{ flexShrink: 0, padding: "2px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: N.muted, marginBottom: 2 }}>Assalāmu ʿalaykum</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Today</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 21, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center" }}>
          <Icon name="bell" size={20} color={N.muted} />
        </div>
      </div>
      <Body style={{ paddingBottom: 16 }}>
        {/* continue reading */}
        <div style={{ ...card, padding: 18, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 14 }}>
          <Khatam size={150} color={N.gold} opacity={0.07} sw={1.1} style={{ position: "absolute", right: -36, top: -42 }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.gold, marginBottom: 12 }}>Continue reading</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AyahBadge n="2" size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Al-Baqarah</div>
              <div style={{ fontSize: 13.5, color: N.muted, marginTop: 2 }}>Ayah 255 · Āyat al-Kursī</div>
            </div>
            <div className="ul-ar" style={{ fontSize: 24, color: N.goldHi }}>البقرة</div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: N.bg, marginTop: 16, overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", background: N.goldGrad }} />
          </div>
        </div>
        {/* next prayer strip */}
        <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
          <Icon name="moon" size={22} color={N.gold} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: N.muted }}>Next prayer · ʿAṣr</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 1 }}>in 1h 24m</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: N.gold, fontVariantNumeric: "tabular-nums" }}>4:38</div>
        </div>
        {/* verse of the day */}
        <div style={{ ...card, padding: 20, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint }}>Verse of the day</span>
            <Icon name="bookmark" size={17} color={N.faint} />
          </div>
          <div className="ul-ar" style={{ fontSize: 24, lineHeight: 2, textAlign: "right", color: N.fg, marginBottom: 14 }}>أَلَا بِذِكْرِ ٱللَّٰهِ تَطْمَئِنُّ ٱلْقُلُوبُ</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: N.muted }}>“…Unquestionably, by the remembrance of Allah hearts are assured.”</div>
          <div style={{ fontSize: 13, color: N.gold, fontWeight: 600, marginTop: 12 }}>Ar-Raʿd · 13:28</div>
        </div>
        {/* quick actions */}
        <div style={{ display: "flex", gap: 12 }}>
          {[{ i: "book", t: "Read" }, { i: "headphones", t: "Listen" }, { i: "compass", t: "Qibla" }].map((a) => (
            <div key={a.t} style={{ flex: 1, ...card, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <Icon name={a.i} size={22} color={N.gold} />
              <span style={{ fontSize: 13, fontWeight: 600, color: N.fg }}>{a.t}</span>
            </div>
          ))}
        </div>
      </Body>
      <TabBar active="home" />
    </>
  );
}

// ══ 3 · SURAH INDEX (READ) ════════════════════════════════════════════════════
const SURAHS = [
  { n: 1, en: "Al-Fātiḥah", tr: "The Opening", ar: "الفاتحة", v: 7, rev: "Meccan" },
  { n: 2, en: "Al-Baqarah", tr: "The Cow", ar: "البقرة", v: 286, rev: "Medinan" },
  { n: 3, en: "Āl ʿImrān", tr: "Family of Imran", ar: "آل عمران", v: 200, rev: "Medinan" },
  { n: 4, en: "An-Nisāʾ", tr: "The Women", ar: "النساء", v: 176, rev: "Medinan" },
  { n: 5, en: "Al-Māʾidah", tr: "The Table Spread", ar: "المائدة", v: 120, rev: "Medinan" },
  { n: 6, en: "Al-Anʿām", tr: "The Cattle", ar: "الأنعام", v: 165, rev: "Meccan" },
];
function ScrIndex() {
  return (
    <>
      <StatusBar />
      <div style={{ flexShrink: 0, padding: "2px 20px 12px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, marginBottom: 14 }}>Qur'ān</div>
        <Field placeholder="Search surah, juz or verse" />
        <div style={{ marginTop: 14 }}><Seg options={["Surah", "Juzʾ", "Revelation"]} value="Surah" onChange={() => {}} size="sm" /></div>
      </div>
      <Body pad={20} style={{ paddingTop: 4 }}>
        {SURAHS.map((s) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 4px", borderBottom: `1px solid ${N.borderSoft}` }}>
            <AyahBadge n={s.n} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.en}</div>
              <div style={{ fontSize: 13, color: N.faint, marginTop: 2 }}>{s.rev} · {s.v} verses</div>
            </div>
            <div className="ul-ar" style={{ fontSize: 22, color: N.goldHi }}>{s.ar}</div>
          </div>
        ))}
      </Body>
      <TabBar active="read" />
    </>
  );
}

// ══ 4 · READER ════════════════════════════════════════════════════════════════
const TJ = { idgham: "#5FA8D9", ghunnah: "#56AE6C", qalqalah: "#E0A33E", madd: "#C77BD8" };
function ScrReader({ tajwid }) {
  const A = (txt, color) => <span style={{ color: tajwid && color ? color : "inherit" }}>{txt}</span>;
  return (
    <>
      <StatusBar />
      {/* reader bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 8px 12px", borderBottom: `1px solid ${N.borderSoft}` }}>
        <div style={{ width: 44, height: 44, display: "grid", placeItems: "center" }}><Icon name="chevL" size={24} color={N.fg} /></div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Al-Fātiḥah</div>
          <div style={{ fontSize: 12, color: N.faint }}>The Opening · 7 verses</div>
        </div>
        <div style={{ width: 44, height: 44, display: "grid", placeItems: "center" }}><Icon name="type" size={21} color={N.muted} /></div>
      </div>
      <Body pad={22} style={{ paddingTop: 18 }}>
        {/* surah header */}
        <div style={{ textAlign: "center", paddingBottom: 18, borderBottom: `1px solid ${N.borderSoft}`, marginBottom: 8 }}>
          <div style={{ position: "relative", display: "grid", placeItems: "center", marginBottom: 6 }}>
            <Khatam size={90} color={N.goldDim} sw={1} opacity={0.55} />
            <div className="ul-ar" style={{ position: "absolute", fontSize: 30, color: N.goldHi }}>الفاتحة</div>
          </div>
          <div className="ul-ar" style={{ fontSize: 22, color: N.muted }}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
        </div>
        {/* ayahs */}
        {[
          { n: 1, ar: <>{A("ٱلْحَمْدُ", TJ.qalqalah)} لِلَّٰهِ رَبِّ {A("ٱلْعَٰلَمِينَ", TJ.madd)}</>, en: "All praise is due to Allah, Lord of the worlds —" },
          { n: 2, ar: <>{A("ٱلرَّحْمَٰنِ", TJ.ghunnah)} {A("ٱلرَّحِيمِ", TJ.madd)}</>, en: "the Entirely Merciful, the Especially Merciful," },
          { n: 3, ar: <>مَٰلِكِ يَوْمِ {A("ٱلدِّينِ", TJ.idgham)}</>, en: "Sovereign of the Day of Recompense." },
        ].map((a) => (
          <div key={a.n} style={{ padding: "18px 0", borderBottom: `1px solid ${N.borderSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <AyahBadge n={a.n} size={30} />
              <div style={{ display: "flex", gap: 18 }}>
                <Icon name="play" size={17} color={N.faint} />
                <Icon name="bookmark" size={17} color={N.faint} />
                <Icon name="share" size={17} color={N.faint} />
              </div>
            </div>
            <div className="ul-ar" style={{ fontSize: 27, lineHeight: 2.1, textAlign: "right", color: N.fg, marginBottom: 12 }}>{a.ar}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: N.muted }}>{a.en}</div>
          </div>
        ))}
      </Body>
      {/* audio bar */}
      <div style={{ flexShrink: 0, background: N.bg2, borderTop: `1px solid ${N.borderSoft}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 21, background: N.goldGrad, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="pause" size={18} color={N.ink} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Mishary Rāshid al-ʿAfāsy</div>
          <div style={{ height: 4, borderRadius: 2, background: N.border, marginTop: 7, overflow: "hidden" }}><div style={{ width: "34%", height: "100%", background: N.gold }} /></div>
        </div>
        <Icon name="repeat" size={20} color={N.muted} />
      </div>
      <HomeIndicator />
    </>
  );
}

// ══ 5 · TAFSĪR SHEET ══════════════════════════════════════════════════════════
function ScrTafsir() {
  return (
    <>
      <StatusBar />
      {/* dimmed reader behind */}
      <div style={{ flex: 1, padding: "0 22px", opacity: 0.32 }}>
        <div className="ul-ar" style={{ fontSize: 26, lineHeight: 2.1, textAlign: "right", color: N.fg, marginTop: 10 }}>ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ</div>
        <div style={{ fontSize: 14.5, color: N.muted, marginTop: 10 }}>Guide us to the straight path —</div>
      </div>
      {/* sheet */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 600, background: N.cardHi, borderTopLeftRadius: 26, borderTopRightRadius: 26, border: `1px solid ${N.border}`, borderBottom: "none", display: "flex", flexDirection: "column", boxShadow: "0 -24px 60px -20px rgba(0,0,0,.6)" }}>
        <div style={{ display: "grid", placeItems: "center", padding: "12px 0 4px" }}><div style={{ width: 40, height: 5, borderRadius: 3, background: N.border }} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px 16px", borderBottom: `1px solid ${N.borderSoft}` }}>
          <AyahBadge n="6" size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Al-Fātiḥah 1:6</div>
            <div style={{ fontSize: 12.5, color: N.faint }}>Tafsīr · al-Saʿdī</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: N.card, border: `1px solid ${N.border}`, display: "grid", placeItems: "center" }}><Icon name="close" size={17} color={N.muted} /></div>
        </div>
        <div className="ul-scroll" style={{ flex: 1, overflowY: "auto", padding: "18px 22px 24px" }}>
          <div style={{ background: N.card, border: `1px solid ${N.borderSoft}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div className="ul-ar" style={{ fontSize: 23, lineHeight: 1.9, textAlign: "right", color: N.fg, marginBottom: 10 }}>ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: N.muted }}>Guide us to the straight path.</div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: N.gold, background: N.goldSoft, border: `1px solid ${N.border}`, borderRadius: 999, padding: "6px 13px", marginBottom: 16 }}>
            <Khatam size={14} color={N.gold} sw={1.4} /> Guidance
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: N.fg, margin: "0 0 14px" }}>Having praised Allah, the servant now asks for the greatest of needs: guidance to the straight path — the clear way that leads to Him and to the Garden.</p>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: N.muted, margin: 0 }}>It is knowledge of the truth and acting upon it; the path walked by the Prophets, the truthful and the righteous.</p>
        </div>
      </div>
    </>
  );
}

// ══ 6 · SEARCH ════════════════════════════════════════════════════════════════
function ScrSearch() {
  return (
    <>
      <StatusBar />
      <div style={{ flexShrink: 0, padding: "2px 20px 14px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, marginBottom: 14 }}>Search</div>
        <Field placeholder="mercy" focused />
      </div>
      <Body pad={20} style={{ paddingTop: 4 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          {["patience", "Āyat al-Kursī", "97", "forgiveness"].map((c) => (
            <span key={c} style={{ fontSize: 13, color: N.muted, background: N.card, border: `1px solid ${N.border}`, borderRadius: 999, padding: "7px 13px" }}>{c}</span>
          ))}
        </div>
        <SectionLabel>Surahs · 1 match</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", borderBottom: `1px solid ${N.borderSoft}` }}>
          <AyahBadge n="55" size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Ar-Raḥmān</div>
            <div style={{ fontSize: 13, color: N.faint, marginTop: 2 }}>The Most <span style={{ color: N.gold, fontWeight: 600 }}>Merciful</span> · 78 verses</div>
          </div>
          <Icon name="chevR" size={18} color={N.faint} />
        </div>
        <SectionLabel>Verses · 312 matches</SectionLabel>
        {[
          { ref: "Al-Fātiḥah 1:3", pre: "The Entirely ", hit: "Merciful", post: ", the Especially Merciful," },
          { ref: "Az-Zumar 39:53", pre: "Indeed, Allah forgives all sins. He is the Forgiving, the ", hit: "Merciful", post: "." },
        ].map((r, i) => (
          <div key={i} style={{ padding: "13px 4px", borderBottom: `1px solid ${N.borderSoft}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: N.gold, marginBottom: 6 }}>{r.ref}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: N.muted }}>{r.pre}<span style={{ color: N.fg, fontWeight: 700, background: N.goldSoft, borderRadius: 4, padding: "0 3px" }}>{r.hit}</span>{r.post}</div>
          </div>
        ))}
      </Body>
      <TabBar active="search" />
    </>
  );
}

// ══ 7 · PRAYER TIMES ══════════════════════════════════════════════════════════
const PRAYERS = [
  { n: "Fajr", ar: "الفجر", t: "5:12", i: "moon", st: "done" },
  { n: "Sunrise", ar: "الشروق", t: "6:38", i: "sun", st: "done" },
  { n: "Dhuhr", ar: "الظهر", t: "1:04", i: "sun", st: "done" },
  { n: "ʿAṣr", ar: "العصر", t: "4:38", i: "sun", st: "next" },
  { n: "Maghrib", ar: "المغرب", t: "7:21", i: "moon", st: "" },
  { n: "ʿIshāʾ", ar: "العشاء", t: "8:47", i: "moon", st: "" },
];
function ScrPrayer() {
  return (
    <>
      <StatusBar />
      <NavHeader title="Prayer Times" right={<Icon name="settings" size={21} color={N.muted} />} />
      <Body pad={20}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: N.muted, fontSize: 13.5, marginBottom: 14 }}>
          <Icon name="compass" size={16} color={N.gold} /> Birmingham, UK · 14 Ramaḍān
        </div>
        {/* hero countdown */}
        <div style={{ ...card, padding: "26px 22px", textAlign: "center", background: `linear-gradient(150deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 18 }}>
          <Khatam size={230} color={N.gold} opacity={0.06} sw={0.9} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700 }}>Next · ʿAṣr</div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, margin: "10px 0 2px", fontVariantNumeric: "tabular-nums" }}>1:24<span style={{ fontSize: 24, color: N.muted, fontWeight: 600 }}>:09</span></div>
            <div style={{ fontSize: 14, color: N.muted }}>until ʿAṣr at 4:38 PM</div>
          </div>
        </div>
        {/* prayer list */}
        <div style={{ ...card, overflow: "hidden" }}>
          {PRAYERS.map((p, i) => {
            const next = p.st === "next";
            return (
              <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderBottom: i < PRAYERS.length - 1 ? `1px solid ${N.borderSoft}` : "none", background: next ? N.goldSoft : "transparent" }}>
                <Icon name={p.i} size={20} color={next ? N.gold : p.st === "done" ? N.faint : N.muted} />
                <div style={{ flex: 1, fontSize: 16, fontWeight: next ? 700 : 600, color: next ? N.fg : p.st === "done" ? N.faint : N.fg }}>{p.n}</div>
                <div className="ul-ar" style={{ fontSize: 18, color: next ? N.goldHi : N.faint, marginRight: 4 }}>{p.ar}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: next ? N.gold : N.muted, fontVariantNumeric: "tabular-nums", width: 52, textAlign: "right" }}>{p.t}</div>
              </div>
            );
          })}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ 8 · SETTINGS ══════════════════════════════════════════════════════════════
const SWATCHES = ["obsidian", "midnight", "emerald", "ocean", "ivory", "sepia", "mint", "rose"];
function ScrSettings() {
  return (
    <>
      <StatusBar />
      <NavHeader title="Settings" />
      <Body pad={20} style={{ paddingTop: 2 }}>
        <SectionLabel>Appearance</SectionLabel>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 13 }}>Theme</div>
          <div style={{ display: "flex", gap: 10 }}>
            {SWATCHES.map((k) => {
              const t = AppThemes[k]; const on = k === "obsidian";
              return (
                <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: t.bg, border: `2px solid ${on ? N.gold : N.border}`, display: "grid", placeItems: "center" }}>
                    <div style={{ width: 13, height: 13, borderRadius: 7, background: t.goldGrad }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <SectionLabel>Reading</SectionLabel>
        <div style={{ ...card, overflow: "hidden" }}>
          {[
            { k: "Translation", s: "Show English meaning", on: true },
            { k: "Transliteration", s: "Romanized pronunciation", on: false },
            { k: "Tajwīd colours", s: "Colour the rules of recitation", on: true },
          ].map((r, i, a) => (
            <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < a.length - 1 ? `1px solid ${N.borderSoft}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600 }}>{r.k}</div>
                <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>{r.s}</div>
              </div>
              <Toggle on={r.on} />
            </div>
          ))}
        </div>
        <SectionLabel>Data</SectionLabel>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderBottom: `1px solid ${N.borderSoft}` }}>
            <Icon name="repeat" size={19} color={N.muted} />
            <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600 }}>Restart welcome tour</div>
            <Icon name="chevR" size={17} color={N.faint} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px" }}>
            <Icon name="close" size={19} color="#FF8A7E" />
            <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: "#FF8A7E" }}>Reset all app data</div>
          </div>
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

Object.assign(window, {
  ScrOnboarding, ScrHome, ScrIndex, ScrReader, ScrTafsir, ScrSearch, ScrPrayer, ScrSettings,
  Field, AyahBadge, Toggle, SectionLabel, SWATCHES, TJ,
});
