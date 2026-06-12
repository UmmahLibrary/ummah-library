/* Ummah Library — Learn & track screens: Names99, Hadith, Tafsir, Hifz,
   Calendar, Goals, Settings, Bookmarks, Search. Registers on window.SCREENS. */
const { useState: lS } = React;
const lcard = { background: "var(--ul-card)", border: "1px solid var(--ul-border)", borderRadius: 16 };

/* ───────── 99 NAMES ───────── */
function Names99({ go }) {
  const [sel, setSel] = lS(null);
  return (
    <ToolFrame title="The 99 Names" sub="Al-Asmāʾ al-Ḥusnā · the Most Beautiful Names of Allah" glyph="﷽" onBack={() => go("tools")} maxW={1000}>
      {sel != null && (
        <div className="ul-fade" style={{ ...lcard, padding: 30, marginBottom: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", textAlign: "center" }}>
          <Khatam size={180} color={N.gold} opacity={0.07} sw={1} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: N.faint, letterSpacing: 1 }}>{UL2.names[sel].n} OF 99</div>
            <div className="ul-ar" style={{ fontSize: 56, color: N.goldHi, margin: "10px 0", textShadow: "0 0 40px rgba(230,184,85,.25)" }}>{UL2.names[sel].ar}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{UL2.names[sel].tr}</div>
            <div style={{ fontSize: 16, color: N.muted, marginTop: 4 }}>{UL2.names[sel].en}</div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
        {UL2.names.map((nm, i) => (
          <div key={nm.n} className="ul-link ul-press" onClick={() => setSel(i)} style={{ ...lcard, padding: "16px 18px", borderColor: sel === i ? N.gold : N.border, background: sel === i ? N.goldSoft : N.card }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: N.faint, fontWeight: 700 }}>{nm.n}</span>
              <span className="ul-ar" style={{ fontSize: 24, color: N.gold }}>{nm.ar}</span>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.2 }}>{nm.tr}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>{nm.en}</div>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────── HADITH ───────── */
// highlight matched query terms in a string
function mark(text, q) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} style={{ background: N.goldSoft, color: N.goldHi, borderRadius: 3, padding: "0 2px" }}>{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function gradeColor(g) {
  if (/Ṣaḥīḥ/.test(g)) return { c: "#5BBF8A", b: "rgba(91,191,138,.4)" };
  if (/Ḥasan/.test(g)) return { c: N.gold, b: N.gold };
  return { c: "#C98A57", b: "rgba(201,138,87,.4)" };
}

function HadithCard({ h, q, onOpen }) {
  const g = gradeColor(h.grade);
  return (
    <div className="ul-link ul-press" onClick={onOpen} style={{ ...lcard, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: N.muted, fontWeight: 600 }}>{h.colName} <span style={{ color: N.faint }}>· {h.book}</span></span>
        <span style={{ fontSize: 11.5, color: g.c, border: `1px solid ${g.b}`, borderRadius: 6, padding: "3px 9px", fontWeight: 700, flexShrink: 0 }}>{h.grade}</span>
      </div>
      <div className="ul-ar" style={{ fontSize: 23, lineHeight: 2, textAlign: "right", color: N.fg, marginBottom: 14 }}>{h.ar}</div>
      <div style={{ fontSize: 12, color: N.faint, marginBottom: 6 }}>Narrated {h.narrator}</div>
      <div style={{ fontSize: 16, lineHeight: 1.65, color: N.muted }}>{mark(h.en, q)}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${N.borderSoft}`, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: N.gold, fontWeight: 600 }}>{h.ref}</span>
        <div style={{ display: "flex", gap: 7 }}>
          {h.topics.slice(0, 3).map((t) => <span key={t} style={{ fontSize: 11.5, color: N.faint, background: N.bg, border: `1px solid ${N.borderSoft}`, borderRadius: 999, padding: "3px 10px" }}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

function Hadith({ go }) {
  const [q, setQ] = lS("");
  const [scope, setScope] = lS("all");       // collection key or "all"
  const [grade, setGrade] = lS("all");        // "all" | "Ṣaḥīḥ" | "Ḥasan"
  const [browse, setBrowse] = lS(false);      // viewing a collection's listing
  const H = UL2.hadith;
  const t = q.trim().toLowerCase();
  const searching = t.length > 0 || scope !== "all" || grade !== "all" || browse;

  const results = H.samples.filter((h) => {
    if (scope !== "all" && h.col !== scope) return false;
    if (grade !== "all" && !h.grade.includes(grade)) return false;
    if (!t) return true;
    const hay = (h.en + " " + h.narrator + " " + h.ref + " " + h.book + " " + h.topics.join(" ") + " " + h.ar).toLowerCase();
    return hay.includes(t);
  });

  const scopeName = scope === "all" ? "all collections" : H.collections.find((c) => c.key === scope)?.name;

  return (
    <ToolFrame title="Hadith" sub="Search the prophetic tradition across the major collections" glyph="📖" onBack={() => go("tools")} maxW={900}>
      {/* search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, ...lcard, padding: "0 18px", height: 56, marginBottom: 14 }}>
        <Icon name="search" size={22} color={N.muted} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hadith — a word, phrase, topic, narrator, or reference…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 16 }} />
        {q && <Icon name="close" size={18} color={N.faint} style={{ cursor: "pointer" }} onClick={() => setQ("")} />}
      </div>

      {/* filters: collection scope + grade */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: N.faint, fontWeight: 700, marginRight: 2 }}>BOOK</span>
        <Chip on={scope === "all"} onClick={() => { setScope("all"); setBrowse(false); }}>All</Chip>
        {H.collections.map((c) => (
          <Chip key={c.key} on={scope === c.key} onClick={() => { setScope(c.key); setBrowse(false); }}>{c.short}</Chip>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: N.faint, fontWeight: 700, marginRight: 2 }}>GRADE</span>
        <Chip on={grade === "all"} onClick={() => setGrade("all")}>All grades</Chip>
        <Chip on={grade === "Ṣaḥīḥ"} onClick={() => setGrade("Ṣaḥīḥ")}>Ṣaḥīḥ</Chip>
        <Chip on={grade === "Ḥasan"} onClick={() => setGrade("Ḥasan")}>Ḥasan</Chip>
      </div>

      {!searching ? (
        <>
          {/* topic chips */}
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Browse by topic</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 26 }}>
            {H.topics.map((tp) => (
              <button key={tp} className="ul-link ul-press" onClick={() => setQ(tp)} style={{ ...lcard, padding: "9px 16px", color: N.fg, fontFamily: N.ui, fontSize: 14, cursor: "pointer" }}>{tp}</button>
            ))}
          </div>
          {/* collections grid */}
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Collections</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
            {H.collections.map((c) => (
              <div key={c.key} className="ul-link ul-press" onClick={() => { setScope(c.key); setBrowse(true); }} style={{ ...lcard, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", color: N.gold }}><Icon name="book" size={20} /></div>
                  <Icon name="arrowR" size={18} color={N.faint} />
                </div>
                <div style={{ fontSize: 16.5, fontWeight: 700, marginTop: 16 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: N.faint, marginTop: 3 }}>{c.by}</div>
                <div style={{ fontSize: 13, color: N.gold, marginTop: 10, fontWeight: 600 }}>{c.count} hadith</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13.5, color: N.muted }}>
              <span style={{ color: N.fg, fontWeight: 700 }}>{results.length}</span> result{results.length !== 1 ? "s" : ""}{t && <> for “<span style={{ color: N.gold }}>{q}</span>”</>} in {scopeName}
            </div>
            {(q || scope !== "all" || grade !== "all") && (
              <button className="ul-link ul-press" onClick={() => { setQ(""); setScope("all"); setGrade("all"); setBrowse(false); }} style={{ background: "none", border: "none", color: N.gold, fontFamily: N.ui, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="close" size={15} /> Clear search
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {results.map((h, i) => <HadithCard key={i} h={h} q={t} onOpen={() => {}} />)}
          </div>
          {results.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 14, opacity: 0.5 }}><Khatam size={54} color={N.goldDim} sw={1.2} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>No hadith found</div>
              <div style={{ fontSize: 14, color: N.muted }}>Try a different word, topic, or remove a filter.</div>
            </div>
          )}
        </>
      )}
    </ToolFrame>
  );
}
function Chip({ on, onClick, children }) {
  return (
    <button className="ul-link ul-press" onClick={onClick} style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${on ? N.gold : N.border}`, background: on ? N.goldSoft : N.card, color: on ? N.gold : N.muted, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: N.ui, whiteSpace: "nowrap" }}>{children}</button>
  );
}

/* ───────── TAFSIR ───────── */
function Tafsir({ go }) {
  const t = UL2.tafsir;
  return (
    <ToolFrame title="Tafsir" sub="Classical commentary on the meanings of the Quran" glyph="✷" onBack={() => go("tools")} maxW={760}>
      <div style={{ ...lcard, padding: 28 }}>
        <div style={{ textAlign: "center", paddingBottom: 20, borderBottom: `1px solid ${N.borderSoft}`, marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, color: N.faint, letterSpacing: 1 }}>AL-FĀTIḤAH · AYAH 1</div>
          <div className="ul-ar" style={{ fontSize: 34, color: N.goldHi, margin: "14px 0", lineHeight: 1.9 }}>{t.ar}</div>
          <div style={{ fontSize: 15.5, color: N.muted }}>{t.en}</div>
        </div>
        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 10 }}>{t.by}</div>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: N.fg, margin: 0 }}>{t.body}</p>
      </div>
      <button className="ul-link ul-press" onClick={() => go("hub")} style={{ ...lcard, marginTop: 16, width: "100%", padding: 16, color: N.gold, fontFamily: N.ui, fontWeight: 600, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        Open the full Quran reader <Icon name="arrowR" size={17} />
      </button>
    </ToolFrame>
  );
}

/* ───────── HIFZ ───────── */
function Hifz({ go, openSurah }) {
  const h = UL2.hifz;
  return (
    <ToolFrame title="Hifz Review" sub="Spaced-repetition memorization, tuned to your recall" glyph="✦" onBack={() => go("tools")}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        {[[h.memorizedPct + "%", "Quran memorized"], [h.dueToday, "Due today"], [h.streak + " 🔥", "Day streak"], [h.surahsDone, "Surahs complete"]].map(([a, b]) => (
          <div key={b} style={{ ...lcard, padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>{a}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3 }}>{b}</div>
          </div>
        ))}
      </div>
      <div style={{ ...lcard, padding: 24, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{h.dueToday} surahs ready for review</div>
          <div style={{ fontSize: 13.5, color: N.muted, marginTop: 3 }}>A 9-minute session keeps your streak alive.</div>
        </div>
        <Btn onClick={() => openSurah(h.queue[0].n)} icon="play">Start review</Btn>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Review queue</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {h.queue.map((q) => (
          <div key={q.n} className="ul-link ul-press" onClick={() => openSurah(q.n)} style={{ ...lcard, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Khatam size={38} color={N.goldDim} sw={1.2} /><span style={{ position: "absolute", fontSize: 12, fontWeight: 700, color: N.gold }}>{q.n}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{q.tr}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, maxWidth: 160, height: 5, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${q.strength * 100}%`, height: "100%", background: q.strength > 0.6 ? N.gold : q.strength > 0.4 ? "#C9A24B" : "#8A6B2E" }} /></div>
                <span style={{ fontSize: 12, color: N.faint }}>{Math.round(q.strength * 100)}% recall</span>
              </div>
            </div>
            <span style={{ fontSize: 12.5, color: q.due === "Today" ? N.gold : N.faint, fontWeight: 600, flexShrink: 0 }}>{q.due}</span>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────── GOALS ───────── */
function Goals({ go }) {
  const g = UL2.goals;
  const pct = Math.min(1, g.todayRead / g.dailyTarget);
  const R = 80, C = 2 * Math.PI * R;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...g.weekMinutes);
  return (
    <ToolFrame title="Reading Goals" sub="Build a daily habit with the Book of Allah" glyph="◎" onBack={() => go("tools")} maxW={820}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
        <div style={{ ...lcard, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r={R} fill="none" stroke={N.border} strokeWidth="14" />
              <circle cx="100" cy="100" r={R} fill="none" stroke={N.gold} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
              <div><div style={{ fontSize: 40, fontWeight: 800, color: N.gold, letterSpacing: -1.5 }}>{g.todayRead}</div><div style={{ fontSize: 13, color: N.faint }}>of {g.dailyTarget} min today</div></div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: N.muted, marginTop: 16, textAlign: "center" }}>{g.dailyTarget - g.todayRead} minutes to reach today’s goal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...lcard, padding: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 16 }}>This week</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
              {g.weekMinutes.map((m, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: "100%", height: `${(m / max) * 84}px`, background: i === 6 ? N.goldGrad : N.border, borderRadius: 6 }} />
                  <span style={{ fontSize: 11.5, color: N.faint }}>{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...lcard, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 30, fontWeight: 800, color: N.gold }}>{g.streak} days</div><div style={{ fontSize: 13, color: N.faint }}>Current streak 🔥</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 700 }}>{g.khatmPct}%</div><div style={{ fontSize: 12.5, color: N.faint }}>to khatm by {g.khatmTarget}</div></div>
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}

/* ───────── BOOKMARKS ───────── */
function Bookmarks({ go, openSurah }) {
  const [tab, setTab] = lS("verses");
  const [col, setCol] = lS("all");
  const C = UL2.collections || [];
  const colMeta = (name) => C.find((c) => c.name === name) || { color: N.gold, glyph: "❑" };
  const verses = col === "all" ? UL2.bookmarks : UL2.bookmarks.filter((b) => b.col === col);
  const countFor = (name) => UL2.bookmarks.filter((b) => b.col === name).length;

  const Tabs = () => (
    <div style={{ display: "flex", gap: 4, padding: 4, background: N.bg2, border: `1px solid ${N.borderSoft}`, borderRadius: 12, marginBottom: 20, width: "fit-content" }}>
      {[["verses", "Verses", UL2.bookmarks.length], ["collections", "Collections", C.length], ["notes", "Reflections", (UL2.notes || []).length]].map(([k, lb, n]) => (
        <button key={k} className="ul-link ul-press" onClick={() => setTab(k)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", background: tab === k ? N.card : "transparent", color: tab === k ? N.fg : N.muted, fontFamily: N.ui, fontSize: 14, fontWeight: tab === k ? 700 : 500, cursor: "pointer", boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,.2)" : "none" }}>
          {lb} <span style={{ fontSize: 12, color: tab === k ? N.gold : N.faint, fontWeight: 700 }}>{n}</span>
        </button>
      ))}
    </div>
  );

  return (
    <ToolFrame title="Bookmarks" sub="Your saved verses, collections and reflections" glyph="❑" onBack={() => go("hub")} maxW={860}>
      <Tabs />

      {/* VERSES */}
      {tab === "verses" && (
        <div className="ul-fade">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
            <button className="ul-link ul-press" onClick={() => setCol("all")} style={chipS(col === "all")}>All <span style={{ opacity: 0.7, marginLeft: 4 }}>{UL2.bookmarks.length}</span></button>
            {C.map((c) => (
              <button key={c.name} className="ul-link ul-press" onClick={() => setCol(c.name)} style={chipS(col === c.name)}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block", marginRight: 7 }} />{c.name} <span style={{ opacity: 0.7, marginLeft: 4 }}>{countFor(c.name)}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {verses.map((b, i) => {
              const cm = colMeta(b.col);
              return (
                <div key={i} className="ul-link ul-press" onClick={() => openSurah(b.surah)} style={{ ...lcard, padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: N.gold }}>{b.label}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: cm.color, border: `1px solid color-mix(in srgb, ${cm.color} 40%, transparent)`, background: `color-mix(in srgb, ${cm.color} 13%, transparent)`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>{b.col}</span>
                  </div>
                  <div className="ul-ar" style={{ fontSize: 24, lineHeight: 1.95, textAlign: "right", color: N.fg, marginBottom: 10 }}>{b.ar}</div>
                  <div style={{ fontSize: 15, color: N.muted, lineHeight: 1.6 }}>{b.en}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 13, borderTop: `1px solid ${N.borderSoft}` }}>
                    <span style={{ fontSize: 12.5, color: N.faint }}>{b.date || "Saved"}</span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span className="ul-link" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12.5, color: N.faint, fontWeight: 600 }}><Icon name="arrowR" size={14} /> Open</span>
                      <span className="ul-link" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12.5, color: N.faint, fontWeight: 600 }}><Icon name="layers" size={14} /> Move</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COLLECTIONS */}
      {tab === "collections" && (
        <div className="ul-fade">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
            {C.map((c) => (
              <div key={c.name} className="ul-link ul-press" onClick={() => { setCol(c.name); setTab("verses"); }} style={{ ...lcard, padding: 22, position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 21, background: `color-mix(in srgb, ${c.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${c.color} 45%, transparent)` }}>{c.glyph}</div>
                  <span style={{ fontSize: 13, color: c.color, fontWeight: 700 }}>{countFor(c.name)} verses</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 15 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: N.faint, marginTop: 3, lineHeight: 1.5 }}>{c.note}</div>
              </div>
            ))}
            <button className="ul-link ul-press" style={{ ...lcard, padding: 22, border: `1.5px dashed ${N.border}`, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: N.muted, cursor: "pointer", fontFamily: N.ui, minHeight: 150 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, border: `1px solid ${N.border}`, display: "grid", placeItems: "center" }}><Icon name="plus" size={20} color={N.gold} /></div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>New collection</span>
            </button>
          </div>
        </div>
      )}

      {/* NOTES */}
      {tab === "notes" && (
        <div className="ul-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(UL2.notes || []).map((nt, i) => {
            const cm = colMeta(nt.col);
            return (
              <div key={i} className="ul-link ul-press" onClick={() => openSurah(nt.surah)} style={{ ...lcard, padding: 22, borderLeft: `3px solid ${cm.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: N.gold }}>{nt.label}</span>
                  <span style={{ fontSize: 12, color: N.faint, flexShrink: 0 }}>{nt.date}</span>
                </div>
                <div className="ul-ar" style={{ fontSize: 21, lineHeight: 1.9, textAlign: "right", color: N.muted, marginBottom: 14, opacity: 0.85 }}>{nt.ar}</div>
                <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <Icon name="tafsir" size={17} color={cm.color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 15.5, color: N.fg, lineHeight: 1.65, fontStyle: "italic" }}>{nt.note}</div>
                </div>
              </div>
            );
          })}
          <button className="ul-link ul-press" onClick={() => openSurah(2)} style={{ ...lcard, padding: "16px 20px", border: `1.5px dashed ${N.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: N.muted, cursor: "pointer", fontFamily: N.ui, fontSize: 14, fontWeight: 600 }}>
            <Icon name="plus" size={17} color={N.gold} /> Write a reflection while reading
          </button>
        </div>
      )}
    </ToolFrame>
  );
}
function chipS(on) {
  return { display: "inline-flex", alignItems: "center", padding: "7px 14px", borderRadius: 999, border: `1px solid ${on ? N.gold : N.border}`, background: on ? N.goldSoft : N.card, color: on ? N.gold : N.muted, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: N.ui };
}

/* ───────── SETTINGS ───────── */
// mini live preview of a theme + selectable card
function ThemeSwatch({ tk, active, onClick }) {
  const p = (window.AppThemes || {})[tk.key] || {};
  return (
    <button className="ul-link ul-press" onClick={onClick} style={{ textAlign: "left", padding: 0, border: `1.5px solid ${active ? N.gold : N.border}`, background: N.card, borderRadius: 14, overflow: "hidden", cursor: "pointer", fontFamily: N.ui }}>
      <div style={{ height: 78, background: p.bg, padding: 11, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: p.goldGrad, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 5, borderRadius: 3, background: p.fg, opacity: 0.9, width: "70%", marginBottom: 4 }} />
            <div style={{ height: 4, borderRadius: 3, background: p.muted, width: "45%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{ flex: 1, height: 16, borderRadius: 5, background: p.card, border: `1px solid ${p.border}` }} />
          <span style={{ width: 30, height: 16, borderRadius: 5, background: p.goldSoft, border: `1px solid ${p.gold}` }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderTop: `1px solid ${N.borderSoft}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? N.gold : N.fg }}>{tk.label}</div>
          <div style={{ fontSize: 11, color: N.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tk.desc}</div>
        </div>
        {active && <div style={{ width: 20, height: 20, borderRadius: 10, background: N.goldGrad, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={13} color={N.ink} /></div>}
      </div>
    </button>
  );
}
function ThemeGallery({ theme, setAppTheme }) {
  const list = window.THEME_LIST || [];
  const dark = list.filter((t) => t.mode === "dark");
  const light = list.filter((t) => t.mode === "light");
  const Row = ({ label, icon, items }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 10 }}><Icon name={icon} size={14} /> {label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 11 }}>
        {items.map((tk) => <ThemeSwatch key={tk.key} tk={tk} active={theme === tk.key} onClick={() => setAppTheme && setAppTheme(tk.key)} />)}
      </div>
    </div>
  );
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Theme</div>
        <div style={{ fontSize: 12, color: N.faint }}>Applies across the whole app</div>
      </div>
      <Row label="Dark" icon="moon" items={dark} />
      <Row label="Light" icon="sun" items={light} />
    </div>
  );
}

function SettingsView({ go, theme, setAppTheme }) {
  const [s, setS] = lS({ notif: true, tajweed: true, transliteration: false });
  const [confirm, setConfirm] = lS(false);
  const DANGER = "#C56A52";
  const wipe = (all) => {
    try {
      const keys = all
        ? Object.keys(localStorage).filter((k) => k.startsWith("ul."))
        : ["ul.view", "ul.surah", "ul.onboarded"];
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    location.reload();
  };
  const Group = ({ title, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <div style={{ ...lcard, overflow: "hidden" }}>{children}</div>
    </div>
  );
  const Item = ({ label, value, onClick, last }) => (
    <div className="ul-link ul-press" onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: last ? "none" : `1px solid ${N.borderSoft}` }}>
      <span style={{ fontSize: 14.5, color: N.fg }}>{label}</span>
      <span style={{ fontSize: 14, color: N.muted, display: "inline-flex", alignItems: "center", gap: 8 }}>{value} <Icon name="chevR" size={15} color={N.faint} /></span>
    </div>
  );
  const Toggle = ({ label, on, onClick, last }) => (
    <div className="ul-link ul-press" onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: last ? "none" : `1px solid ${N.borderSoft}` }}>
      <span style={{ fontSize: 14.5, color: N.fg }}>{label}</span>
      <div style={{ width: 42, height: 24, borderRadius: 12, background: on ? N.gold : N.border, position: "relative" }}><div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: on ? N.ink : N.faint, transition: "left .18s" }} /></div>
    </div>
  );
  return (
    <ToolFrame title="Settings" sub="Tailor the app to your practice" glyph="⚙" onBack={() => go("hub")} maxW={620}>
      <ThemeGallery theme={theme} setAppTheme={setAppTheme} />
      <Group title="Appearance">
        <Item label="Arabic font" value="IBM Plex Sans Arabic" />
        <Toggle label="Tajwīd colour-coding" on={s.tajweed} onClick={() => setS((o) => ({ ...o, tajweed: !o.tajweed }))} last />
      </Group>
      <Group title="Reading">
        <Item label="Translation" value="Saheeh International" />
        <Item label="Reciter" value={QURAN.reciter} />
        <Toggle label="Show transliteration" on={s.transliteration} onClick={() => setS((o) => ({ ...o, transliteration: !o.transliteration }))} last />
      </Group>
      <Group title="Worship">
        <Item label="Calculation method" value="Muslim World League" />
        <Item label="Location" value="London, UK" />
        <Toggle label="Prayer notifications" on={s.notif} onClick={() => setS((o) => ({ ...o, notif: !o.notif }))} last />
      </Group>
      <Group title="Account">
        <Item label="Profile & stats" value="Abdullah" onClick={() => go("profile")} />
        <Item label="Sync & backup" value="On" />
        <Item label="About Ummah Library" value="" last />
      </Group>
      <Group title="Data">
        <Item label="Restart welcome tour" value="" onClick={() => wipe(false)} />
        <div className="ul-link ul-press" onClick={() => setConfirm(true)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px" }}>
          <span style={{ fontSize: 14.5, color: DANGER, fontWeight: 600 }}>Reset all app data</span>
          <Icon name="chevR" size={15} color={DANGER} />
        </div>
      </Group>
      {confirm && (
        <div onClick={() => setConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", padding: 24, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...lcard, padding: 26, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div style={{ width: 50, height: 50, borderRadius: 25, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "rgba(197,106,82,0.12)", border: `1px solid ${DANGER}` }}><Icon name="settings" size={22} color={DANGER} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Reset all app data?</div>
            <div style={{ fontSize: 14, color: N.muted, lineHeight: 1.6, marginTop: 8 }}>This clears your reading position, theme, and progress on this device, and returns you to the welcome screen. This can’t be undone.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="ul-press" onClick={() => setConfirm(false)} style={{ flex: 1, padding: "13px", borderRadius: 11, border: `1px solid ${N.border}`, background: "transparent", color: N.fg, fontFamily: N.ui, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button className="ul-press" onClick={() => wipe(true)} style={{ flex: 1, padding: "13px", borderRadius: 11, border: "none", background: DANGER, color: "#fff", fontFamily: N.ui, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>Reset</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", fontSize: 12.5, color: N.faint, marginTop: 8 }}>Ummah Library · v2.0 · Free & open source</div>
    </ToolFrame>
  );
}

/* ───────── SEARCH ───────── */
function SearchView({ go, openSurah }) {
  const [q, setQ] = lS("");
  const t = q.trim().toLowerCase();
  const res = t ? QURAN.surahs.filter((s) => s.tr.toLowerCase().includes(t) || s.en.toLowerCase().includes(t) || String(s.n) === t) : [];
  const suggest = ["Yā Sīn", "Al-Mulk", "Ar-Raḥmān", "Al-Kahf", "Āyat al-Kursī"];
  return (
    <ToolFrame title="Search" sub="Find any surah, verse, or topic" glyph="🔍" onBack={() => go("hub")} maxW={760}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, ...lcard, padding: "0 18px", height: 56, marginBottom: 22 }}>
        <Icon name="search" size={22} color={N.muted} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “Mulk”, “mercy”, or a surah number…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 17 }} />
        {q && <Icon name="close" size={18} color={N.faint} style={{ cursor: "pointer" }} onClick={() => setQ("")} />}
      </div>
      {!t && (
        <div>
          <div style={{ fontSize: 13, color: N.faint, marginBottom: 12 }}>Suggested</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {suggest.map((sg) => <button key={sg} className="ul-link ul-press" onClick={() => setQ(sg)} style={{ ...lcard, padding: "10px 18px", color: N.fg, fontFamily: N.ui, fontSize: 14, cursor: "pointer" }}>{sg}</button>)}
          </div>
        </div>
      )}
      {t && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: N.faint, marginBottom: 2 }}>{res.length} result{res.length !== 1 ? "s" : ""}</div>
          {res.map((s) => (
            <div key={s.n} className="ul-link ul-press" onClick={() => openSurah(s.n)} style={{ ...lcard, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, position: "relative", display: "grid", placeItems: "center", flexShrink: 0 }}><Khatam size={38} color={N.goldDim} sw={1.2} /><span style={{ position: "absolute", fontSize: 12, fontWeight: 700, color: N.gold }}>{s.n}</span></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{s.tr}</div><div style={{ fontSize: 12.5, color: N.faint }}>{s.en} · {s.ayahs} ayahs</div></div>
              <div className="ul-ar" style={{ fontSize: 22, color: N.muted }}>{s.ar}</div>
            </div>
          ))}
          {res.length === 0 && <div style={{ textAlign: "center", color: N.faint, padding: 40 }}>No matches for “{q}”.</div>}
        </div>
      )}
    </ToolFrame>
  );
}

/* ───────── HIJRI CALENDAR ───────── */
function CalendarView({ go }) {
  const c = UL2.calendar;
  const wd = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const cells = [];
  for (let i = 0; i < c.firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= c.days; d++) cells.push(d);
  const evMap = Object.fromEntries(c.events.map((e) => [e.d, e]));
  return (
    <ToolFrame title="Hijri Calendar" sub={`${c.hijriMonth} ${c.hijriYear} · ${c.greg}`} glyph="☾" onBack={() => go("tools")} maxW={820}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 18, alignItems: "start" }}>
        <div style={{ ...lcard, padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {wd.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11.5, color: N.faint, fontWeight: 700, padding: "4px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const today = d === c.today; const ev = evMap[d];
              return (
                <div key={i} className={ev || today ? "ul-link ul-press" : ""} style={{ aspectRatio: "1", borderRadius: 10, display: "grid", placeItems: "center", position: "relative", background: today ? N.goldGrad : ev ? N.goldSoft : "transparent", border: `1px solid ${today ? "transparent" : ev ? N.gold : N.borderSoft}`, color: today ? N.ink : N.fg, fontWeight: today ? 800 : 500, fontSize: 14.5 }}>
                  {d}
                  {ev && !today && <div style={{ position: "absolute", bottom: 5, width: 5, height: 5, borderRadius: 3, background: N.gold }} />}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Sacred dates this month</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.events.map((e) => (
              <div key={e.d} style={{ ...lcard, padding: "16px 18px", display: "flex", gap: 14, alignItems: "center", borderColor: e.d === c.today ? N.gold : N.border }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", flexShrink: 0 }}><span style={{ fontSize: 17, fontWeight: 800, color: N.gold }}>{e.d}</span></div>
                <div><div style={{ fontSize: 15, fontWeight: 700 }}>{e.name}</div><div style={{ fontSize: 12.5, color: N.faint, marginTop: 1 }}>{e.note}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  names: Names99, hadith: Hadith, tafsir: Tafsir, hifz: Hifz, calendar: CalendarView,
  goals: Goals, bookmarks: Bookmarks, settings: SettingsView, search: SearchView,
});
