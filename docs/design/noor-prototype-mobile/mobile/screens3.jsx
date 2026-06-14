/* Ummah Library — mobile screens, part 3: Learn (99 Names, Hadith, Hijri Calendar,
   Zakat), Memorize (Hifz, Reading Goals, Reading Plans) and You (Profile).
   Faithful ports into the 390×844 frame. */

// ══ 99 NAMES ══════════════════════════════════════════════════════════════════
const NAMES = [
  ["ٱلرَّحْمَٰن", "Ar-Raḥmān", "The Most Compassionate"],
  ["ٱلرَّحِيم", "Ar-Raḥīm", "The Most Merciful"],
  ["ٱلْمَلِك", "Al-Malik", "The King"],
  ["ٱلْقُدُّوس", "Al-Quddūs", "The Most Holy"],
  ["ٱلسَّلَام", "As-Salām", "The Peace"],
  ["ٱلْمُؤْمِن", "Al-Muʾmin", "The Faithful"],
];
function ScrNames() {
  return (
    <>
      <StatusBar />
      <ToolHead title="The 99 Names" sub="Al-Asmāʾ al-Ḥusnā" glyph="﷽" />
      <Body pad={20}>
        {/* featured */}
        <div style={{ ...card, padding: "26px 20px", textAlign: "center", background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 18 }}>
          <Khatam size={170} color={N.gold} opacity={0.07} sw={1} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11.5, color: N.faint, letterSpacing: 1 }}>1 OF 99</div>
            <div className="ul-ar" style={{ fontSize: 52, color: N.goldHi, margin: "8px 0", textShadow: "0 0 40px rgba(230,184,85,.25)" }}>ٱلرَّحْمَٰن</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Ar-Raḥmān</div>
            <div style={{ fontSize: 15, color: N.muted, marginTop: 4 }}>The Most Compassionate</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {NAMES.map(([ar, tr, en], i) => (
            <div key={tr} style={{ ...card, padding: "14px 16px", borderColor: i === 0 ? N.gold : N.border, background: i === 0 ? N.goldSoft : N.card }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, color: N.faint, fontWeight: 700 }}>{i + 1}</span>
                <span className="ul-ar" style={{ fontSize: 22, color: N.gold }}>{ar}</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>{tr}</div>
              <div style={{ fontSize: 11.5, color: N.faint, marginTop: 2 }}>{en}</div>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ HADITH ════════════════════════════════════════════════════════════════════
function ScrHadith() {
  const cards = [
    { col: "Ṣaḥīḥ al-Bukhārī", book: "Belief", grade: "Ṣaḥīḥ", gc: "#5BBF8A", narr: "ʿUmar ibn al-Khaṭṭāb", ar: "إِنَّمَا ٱلْأَعْمَالُ بِٱلنِّيَّاتِ", en: "Actions are but by intentions, and every person will have only what they intended.", ref: "Bukhārī 1", topics: ["Intention", "Sincerity"] },
    { col: "Ṣaḥīḥ Muslim", book: "Virtue", grade: "Ṣaḥīḥ", gc: "#5BBF8A", narr: "Abū Hurayrah", ar: "مَنْ كَانَ يُؤْمِنُ بِٱللَّٰهِ وَٱلْيَوْمِ ٱلْآخِرِ فَلْيَقُلْ خَيْرًا", en: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.", ref: "Muslim 47", topics: ["Speech", "Manners"] },
  ];
  return (
    <>
      <StatusBar />
      <ToolHead title="Hadith" sub="Search the prophetic tradition" glyph="📖" />
      <Body pad={20}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, ...card, padding: "0 14px", height: 48, marginBottom: 14 }}>
          <Icon name="search" size={18} color={N.muted} />
          <span style={{ flex: 1, fontSize: 14.5, color: N.faint }}>Word, topic, narrator…</span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
          <Chip on>All</Chip><Chip>Bukhārī</Chip><Chip>Muslim</Chip><Chip>Abū Dāwūd</Chip>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((h, i) => (
            <div key={i} style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: N.muted, fontWeight: 600 }}>{h.col} <span style={{ color: N.faint }}>· {h.book}</span></span>
                <span style={{ fontSize: 11, color: h.gc, border: `1px solid ${h.gc}66`, borderRadius: 6, padding: "3px 8px", fontWeight: 700, flexShrink: 0 }}>{h.grade}</span>
              </div>
              <div className="ul-ar" style={{ fontSize: 22, lineHeight: 2, textAlign: "right", color: N.fg, marginBottom: 12 }}>{h.ar}</div>
              <div style={{ fontSize: 11.5, color: N.faint, marginBottom: 5 }}>Narrated {h.narr}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: N.muted }}>{h.en}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${N.borderSoft}` }}>
                <span style={{ fontSize: 12.5, color: N.gold, fontWeight: 600 }}>{h.ref}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {h.topics.map((t) => <span key={t} style={{ fontSize: 11, color: N.faint, background: N.bg, border: `1px solid ${N.borderSoft}`, borderRadius: 999, padding: "3px 9px" }}>{t}</span>)}
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

// ══ HIJRI CALENDAR ════════════════════════════════════════════════════════════
function ScrCalendar() {
  const days = 30, firstWeekday = 4, today = 14;
  const events = { 1: "Start of Ramaḍān", 14: "Today", 27: "Laylat al-Qadr (likely)" };
  const wd = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <>
      <StatusBar />
      <ToolHead title="Hijri Calendar" sub="Ramaḍān 1447 · March 2026" glyph="☾" />
      <Body pad={20}>
        <div style={{ ...card, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {wd.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, color: N.faint, fontWeight: 700, padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const isToday = d === today, ev = events[d] && d !== today;
              return (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 9, display: "grid", placeItems: "center", position: "relative", background: isToday ? N.goldGrad : ev ? N.goldSoft : "transparent", border: `1px solid ${isToday ? "transparent" : ev ? N.gold : N.borderSoft}`, color: isToday ? N.ink : N.fg, fontWeight: isToday ? 800 : 500, fontSize: 14 }}>
                  {d}
                  {ev && <div style={{ position: "absolute", bottom: 4, width: 4, height: 4, borderRadius: 2, background: N.gold }} />}
                </div>
              );
            })}
          </div>
        </div>
        <SectionLabel>Sacred dates this month</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[[1, "Start of Ramaḍān", "The month of fasting begins"], [27, "Laylat al-Qadr", "Better than a thousand months"], [30, "ʿĪd al-Fiṭr (expected)", "The festival of breaking the fast"]].map(([d, name, note]) => (
            <div key={d} style={{ ...card, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", flexShrink: 0 }}><span style={{ fontSize: 16, fontWeight: 800, color: N.gold }}>{d}</span></div>
              <div><div style={{ fontSize: 14.5, fontWeight: 700 }}>{name}</div><div style={{ fontSize: 12, color: N.faint, marginTop: 1 }}>{note}</div></div>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ ZAKAT ═════════════════════════════════════════════════════════════════════
function ScrZakat() {
  const rows = [["Cash in hand", "1,200"], ["Bank balances", "8,400"], ["Gold & silver", "3,100"], ["Business assets", "0"]];
  return (
    <>
      <StatusBar />
      <ToolHead title="Zakat Calculator" sub="2.5% on wealth above niṣāb" glyph="⊜" />
      <Body pad={20}>
        <div style={{ ...card, padding: 22, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 18 }}>
          <Khatam size={150} color={N.gold} opacity={0.08} sw={1.1} style={{ position: "absolute", right: -34, bottom: -40 }} />
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Zakat due</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: N.gold, letterSpacing: -1.5, margin: "8px 0 4px" }}>£317.50</div>
          <div style={{ fontSize: 13.5, color: N.muted }}>Payable on your net zakatable wealth</div>
          <div style={{ height: 1, background: N.borderSoft, margin: "18px 0" }} />
          {[["Total assets", "£12,700"], ["Less liabilities", "– £0"], ["Net zakatable", "£12,700", true], ["Niṣāb threshold", "£5,670"]].map(([k, v, strong]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: strong ? 15.5 : 14, color: N.muted }}>
              <span>{k}</span><span style={{ fontWeight: strong ? 800 : 600, color: strong ? N.fg : N.fg }}>{v}</span>
            </div>
          ))}
        </div>
        <SectionLabel>Your assets</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(([label, val]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 13.5, color: N.muted, flexShrink: 0 }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, ...card, padding: "0 14px", height: 44, flex: 1, maxWidth: 180 }}>
                <span style={{ color: N.faint, fontSize: 15 }}>£</span>
                <span style={{ flex: 1, color: N.fg, fontSize: 15.5, fontWeight: 600, textAlign: "right" }}>{val}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 11, background: N.bg2, border: `1px solid ${N.borderSoft}`, fontSize: 12, color: N.faint, lineHeight: 1.5 }}>
          Niṣāb uses an approximate gold value. Verify the current rate and consult a scholar for your situation.
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ HIFZ REVIEW ═══════════════════════════════════════════════════════════════
function ScrHifz() {
  const queue = [
    { n: 112, tr: "Al-Ikhlāṣ", strength: 0.92, due: "Today" },
    { n: 36, tr: "Yā Sīn", strength: 0.54, due: "Today" },
    { n: 67, tr: "Al-Mulk", strength: 0.38, due: "Overdue" },
    { n: 18, tr: "Al-Kahf", strength: 0.71, due: "Tomorrow" },
  ];
  const sc = (s) => s > 0.6 ? N.gold : s > 0.4 ? "#C9A24B" : "#8A6B2E";
  return (
    <>
      <StatusBar />
      <ToolHead title="Hifz Review" sub="Spaced-repetition memorization" glyph="✦" />
      <Body pad={20}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <MStat big="38%" label="Quran memorized" />
          <MStat big="3" label="Due today" />
          <MStat big="46 🔥" label="Day streak" />
          <MStat big="29" label="Surahs complete" />
        </div>
        <div style={{ ...card, padding: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800 }}>3 surahs ready</div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 3 }}>A 9-minute session keeps your streak alive.</div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 11, background: N.goldGrad, color: N.ink, fontSize: 14, fontWeight: 700, flexShrink: 0 }}><Icon name="play" size={15} color={N.ink} /> Start</div>
        </div>
        <SectionLabel>Review queue</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.map((q) => (
            <div key={q.n} style={{ ...card, padding: "13px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <AyahBadge n={q.n} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{q.tr}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, maxWidth: 150, height: 5, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${q.strength * 100}%`, height: "100%", background: sc(q.strength) }} /></div>
                  <span style={{ fontSize: 11.5, color: N.faint }}>{Math.round(q.strength * 100)}%</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: q.due === "Overdue" ? "#FF8A7E" : q.due === "Today" ? N.gold : N.faint, fontWeight: 600, flexShrink: 0 }}>{q.due}</span>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ READING GOALS ═════════════════════════════════════════════════════════════
function ScrGoals() {
  const week = [12, 18, 9, 22, 15, 0, 14];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...week);
  return (
    <>
      <StatusBar />
      <ToolHead title="Reading Goals" sub="Build a daily habit" glyph="◎" />
      <Body pad={20}>
        <div style={{ ...card, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <Ring pct={70} size={180} sw={14}>
            <div><div style={{ fontSize: 38, fontWeight: 800, color: N.gold, letterSpacing: -1.5 }}>14</div><div style={{ fontSize: 12.5, color: N.faint }}>of 20 min today</div></div>
          </Ring>
          <div style={{ fontSize: 14, color: N.muted, marginTop: 16 }}>6 minutes to reach today's goal</div>
        </div>
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <SectionLabel>This week</SectionLabel>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
            {week.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", height: `${(m / max) * 84 || 2}px`, background: i === 6 ? N.goldGrad : N.border, borderRadius: 6 }} />
                <span style={{ fontSize: 11, color: N.faint }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...card, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 28, fontWeight: 800, color: N.gold }}>23 days</div><div style={{ fontSize: 12.5, color: N.faint }}>Current streak 🔥</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 17, fontWeight: 700 }}>54%</div><div style={{ fontSize: 12, color: N.faint }}>to khatm by Shaʿbān</div></div>
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ READING PLANS ═════════════════════════════════════════════════════════════
function ScrPlans() {
  const week = [{ d: "M", done: true }, { d: "T", done: true }, { d: "W", done: true }, { d: "T", today: true }, { d: "F" }, { d: "S" }, { d: "S" }];
  const library = [
    { tag: "30 days", len: "Juzʾ a day", name: "Ramaḍān Khatm", desc: "Complete the Quran in a month, one juzʾ each day.", pct: 43 },
    { tag: "7 days", len: "~12 min", name: "The Last Juzʾ", desc: "Memorize and reflect on Juzʾ ʿAmma.", pct: 0 },
  ];
  return (
    <>
      <StatusBar />
      <ToolHead title="Reading Plans" sub="Structured journeys through the Book" glyph="🗺" />
      <Body pad={20}>
        <div style={{ ...card, padding: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <Khatam size={150} color={N.gold} opacity={0.07} sw={1.1} style={{ position: "absolute", right: -36, top: -42 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring pct={43} size={78} sw={7}><span style={{ fontSize: 16, fontWeight: 800, color: N.gold }}>43%</span></Ring>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Active · Day 13 of 30</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, margin: "3px 0 5px" }}>Ramaḍān Khatm</div>
              <div style={{ fontSize: 13, color: N.muted }}>Today: <span style={{ color: N.fg, fontWeight: 600 }}>Juzʾ 13</span> · ~22 min</div>
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 16px", borderRadius: 10, background: N.goldGrad, color: N.ink, fontSize: 13.5, fontWeight: 700 }}><Icon name="book" size={15} color={N.ink} /> Read today</div>
        </div>
        <SectionLabel>This week</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7, marginBottom: 22 }}>
          {week.map((d, i) => (
            <div key={i} style={{ ...card, padding: "11px 4px", textAlign: "center", borderColor: d.today ? N.gold : N.border, background: d.today ? N.goldSoft : N.card }}>
              <div style={{ fontSize: 11, color: d.today ? N.gold : N.faint, fontWeight: 700, marginBottom: 7 }}>{d.d}</div>
              <div style={{ width: 24, height: 24, margin: "0 auto", borderRadius: 12, display: "grid", placeItems: "center", background: d.done ? N.goldGrad : "transparent", border: d.done ? "none" : `1px solid ${N.border}` }}>
                {d.done ? <Icon name="check" size={13} color={N.ink} /> : <span style={{ fontSize: 11, color: N.faint }}>{i + 1}</span>}
              </div>
            </div>
          ))}
        </div>
        <SectionLabel>Browse plans</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {library.map((pl) => (
            <div key={pl.name} style={{ ...card, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: N.gold, background: N.goldSoft, border: `1px solid ${N.border}`, borderRadius: 999, padding: "3px 10px" }}>{pl.tag}</span>
                <span style={{ fontSize: 12, color: N.faint }}>{pl.len}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{pl.name}</div>
              <div style={{ fontSize: 13, color: N.muted, marginTop: 5, lineHeight: 1.5 }}>{pl.desc}</div>
              <div style={{ marginTop: 14 }}>
                {pl.pct > 0 ? (
                  <>
                    <div style={{ height: 5, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${pl.pct}%`, height: "100%", background: N.goldGrad }} /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 12, color: N.faint }}><span>In progress</span><span style={{ color: N.gold, fontWeight: 600 }}>Continue →</span></div>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: N.gold, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={15} /> Start plan</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

// ══ PROFILE ═══════════════════════════════════════════════════════════════════
function ScrProfile() {
  const stats = [["46 🔥", "Day streak"], ["12,480", "Ayahs read"], ["38h", "Time in Quran"], ["29", "Surahs memorized"], ["2×", "Khatm complete"], ["61", "Longest streak"]];
  const badges = [["🌙", "Night Reader", true], ["📖", "First Khatm", true], ["✦", "30-day streak", true], ["🕌", "Always on time", false], ["🤲", "Du'ā devotee", false], ["🔥", "100 days", false]];
  return (
    <>
      <StatusBar />
      <ToolHead title="Profile" sub="Member since 2024" glyph="👤" right={<Icon name="settings" size={20} color={N.muted} />} />
      <Body pad={20}>
        <div style={{ ...card, padding: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <Khatam size={140} color={N.gold} opacity={0.08} sw={1.1} style={{ position: "absolute", right: -34, bottom: -38 }} />
          <div style={{ width: 64, height: 64, borderRadius: 32, background: N.goldGrad, display: "grid", placeItems: "center", color: N.ink, fontSize: 26, fontWeight: 800, flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5 }}>Abdullah</div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 2 }}>London, UK · Joined 2024</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
          {stats.map(([a, b]) => <MStat key={b} big={a} label={b} />)}
        </div>
        <SectionLabel>Achievements</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {badges.map(([g, name, got]) => (
            <div key={name} style={{ ...card, padding: "18px 10px", textAlign: "center", opacity: got ? 1 : 0.5 }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 9px", borderRadius: 24, display: "grid", placeItems: "center", fontSize: 22, background: got ? N.goldSoft : "transparent", border: `1px solid ${got ? N.gold : N.border}`, filter: got ? "none" : "grayscale(1)" }}>{g}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
              <div style={{ fontSize: 10.5, color: got ? N.gold : N.faint, marginTop: 3, fontWeight: 600 }}>{got ? "Unlocked" : "Locked"}</div>
            </div>
          ))}
        </div>
      </Body>
      <HomeIndicator />
    </>
  );
}

Object.assign(window, {
  ScrNames, ScrHadith, ScrCalendar, ScrZakat, ScrHifz, ScrGoals, ScrPlans, ScrProfile,
});
