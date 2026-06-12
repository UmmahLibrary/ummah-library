/* Ummah Library — Landing, Hub and Tools views (Noor).
   Exports: Landing, Hub, Tools. Depends on window.N, Icon, Khatam, Logo, Btn, QURAN. */

const noorField =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23E6B855' stroke-width='0.6' opacity='0.07'%3E%3Crect x='28' y='28' width='24' height='24'/%3E%3Crect x='28' y='28' width='24' height='24' transform='rotate(45 40 40)'/%3E%3C/g%3E%3C/svg%3E\")";

/* ───────────────────────── LANDING ───────────────────────── */
function Landing({ onEnter }) {
  return (
    <div className="ul-scroll" style={{ width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden", background: N.bg, color: N.fg, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: noorField, opacity: 0.6, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -260, left: "50%", transform: "translateX(-50%)", width: "min(900px, 120vw)", height: 700, background: "radial-gradient(ellipse at center, rgba(230,184,85,0.16), transparent 62%)", pointerEvents: "none" }} />

      {/* nav */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px clamp(20px, 5vw, 56px)", borderBottom: `1px solid ${N.borderSoft}` }}>
        <Logo />
        <div className="ul-hide-md" style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 14.5, color: N.muted }}>
          <span className="ul-link ul-press" onClick={() => onEnter("hub")}>Read</span><span className="ul-link ul-press" onClick={() => onEnter("hifz")}>Memorize</span><span className="ul-link ul-press" onClick={() => onEnter("prayer")}>Worship</span><span className="ul-link ul-press" onClick={() => onEnter("tools")}>Tools</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="ul-link ul-hide-sm" onClick={() => onEnter("hub")} style={{ fontSize: 14.5, color: N.muted }}>Sign in</span>
          <Btn size="sm" onClick={() => onEnter("hub")}>Open the app</Btn>
        </div>
      </div>

      {/* hero */}
      <div className="ul-rise" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "clamp(48px, 8vw, 76px) clamp(20px, 5vw, 56px) 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 16px", borderRadius: 999, border: `1px solid ${N.border}`, background: N.card, fontSize: 13, color: N.muted, marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: N.gold }} /> Free forever · Open source · No ads · Works offline
        </div>
        <div className="ul-ar" style={{ fontSize: "clamp(40px, 7vw, 58px)", color: N.goldHi, lineHeight: 1.15, marginBottom: 22, textShadow: "0 0 40px rgba(230,184,85,0.25)" }}>ٱقْرَأْ بِٱسْمِ رَبِّكَ</div>
        <h1 style={{ fontSize: "clamp(38px, 6.5vw, 62px)", lineHeight: 1.05, fontWeight: 800, letterSpacing: -1.5, margin: "0 0 22px", width: "100%", maxWidth: 860 }}>
          The Quran, beautifully within reach.
        </h1>
        <p style={{ fontSize: "clamp(16px, 2.4vw, 19px)", lineHeight: 1.6, color: N.muted, width: "100%", maxWidth: 580, margin: "0 0 32px" }}>
          Read, listen, memorize and reflect — with translations in 98 languages, recitations, tafsir and a complete suite of worship tools. All private, on your device.
        </p>
        <div style={{ display: "flex", gap: 13, flexWrap: "wrap", justifyContent: "center", marginBottom: 54 }}>
          <Btn size="lg" onClick={() => onEnter("hub")} icon="book">Start reading</Btn>
          <Btn size="lg" variant="ghost" icon="headphones" onClick={() => onEnter("reader")}>Listen to a recitation</Btn>
        </div>
      </div>

      {/* preview stat strip */}
      <div style={{ position: "relative", margin: "0 clamp(16px, 5vw, 56px)", borderRadius: "18px 18px 0 0", border: `1px solid ${N.border}`, borderBottom: "none", background: `linear-gradient(180deg, ${N.cardHi}, ${N.card})`, padding: "22px clamp(16px,3vw,30px) 0", boxShadow: "0 -10px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[["114", "Surahs"], ["98", "Languages"], ["480+", "Translations"], ["604", "Mushaf pages"], ["15", "Worship tools"]].map(([a, b]) => (
            <div key={b} style={{ flex: "1 1 110px", textAlign: "center", padding: "8px 0 26px" }}>
              <div style={{ fontSize: "clamp(26px,4vw,34px)", fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>{a}</div>
              <div style={{ fontSize: 13, color: N.muted, marginTop: 4 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, paddingBottom: 4 }}>
          <div style={{ background: N.bg, borderRadius: "12px 12px 0 0", border: `1px solid ${N.borderSoft}`, borderBottom: "none", padding: 22, textAlign: "right" }}>
            <div className="ul-ar" style={{ fontSize: 30, color: N.fg, lineHeight: 2 }}>{QURAN.basmala}</div>
          </div>
          <div style={{ background: N.bg, borderRadius: "12px 12px 0 0", border: `1px solid ${N.borderSoft}`, borderBottom: "none", padding: 22 }}>
            <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, marginBottom: 8 }}>Verse of the day</div>
            <div style={{ fontSize: 15.5, lineHeight: 1.6, color: N.muted }}>“…in the remembrance of Allah do hearts find rest.”</div>
            <div style={{ fontSize: 13, color: N.gold, marginTop: 10, fontWeight: 600 }}>{QURAN.votd.ref}</div>
          </div>
        </div>
        {/* fade — dissolves the preview into the page so it reads as an intentional peek, not a cut edge */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 130, background: `linear-gradient(180deg, transparent, ${N.bg})`, borderRadius: "0 0 18px 18px", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

/* ───────────────────────── HUB ───────────────────────── */
// Traditional names of the 30 ajzāʾ (by opening words).
const JUZ_NAMES = ["Alif Lām Mīm", "Sayaqūl", "Tilka r-Rusul", "Lan Tanālū", "Wa-l-Muḥṣanāt", "Lā Yuḥibbu llāh", "Wa-idhā Samiʿū", "Wa-law Annanā", "Qāla l-Malaʾ", "Wa-ʿlamū", "Yaʿtadhirūn", "Wa-mā min Dābbah", "Wa-mā Ubarriʾu", "Rubamā", "Subḥāna lladhī", "Qāla Alam", "Iqtaraba", "Qad Aflaḥa", "Wa-qāla lladhīna", "Aman Khalaqa", "Utlu Mā Ūḥiya", "Wa-man Yaqnut", "Wa-mā Liya", "Fa-man Aẓlam", "Ilayhi Yuraddu", "Ḥā Mīm", "Qāla Fa-mā Khaṭbukum", "Qad Samiʿa llāh", "Tabāraka lladhī", "ʿAmma"];

function GroupHeader({ kicker, title, ar, note }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 12px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        {kicker && <span style={{ fontSize: 12, fontWeight: 800, color: N.ink, background: N.goldGrad, borderRadius: 7, padding: "3px 9px", flexShrink: 0 }}>{kicker}</span>}
        <span style={{ fontSize: 16.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{title}</span>
        {ar && <span className="ul-ar" style={{ fontSize: 19, color: N.goldHi, flexShrink: 0 }}>{ar}</span>}
        {note && <span style={{ fontSize: 13, color: N.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{note}</span>}
      </div>
      <div style={{ flex: 1, height: 1, background: N.borderSoft, minWidth: 16 }} />
    </div>
  );
}

// Juzʾ view — all 30 parts; surahs grouped by the juzʾ they begin in,
// with a muted "continuation" row where a juzʾ opens mid-surah.
function JuzList({ onOpen }) {
  const lastBefore = (N) => { let r = null; for (const s of QURAN.surahs) { if (s.juz < N) r = s; else break; } return r; };
  return (
    <div>
      {Array.from({ length: 30 }, (_, i) => i + 1).map((N) => {
        const starters = QURAN.surahs.filter((s) => s.juz === N);
        const cont = starters.length === 0 ? lastBefore(N) : null;
        return (
          <div key={N}>
            <GroupHeader kicker={`Juzʾ ${N}`} title={JUZ_NAMES[N - 1]} note={starters.length ? `${starters.length} surah${starters.length > 1 ? "s" : ""} begin here` : null} />
            {cont ? (
              <div className="ul-link ul-press" onClick={() => onOpen(cont.n)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "transparent", border: `1px dashed ${N.border}`, color: N.faint }}>
                <Icon name="arrowR" size={16} color={N.goldDim} />
                <span style={{ fontSize: 14 }}>Continuation of <span style={{ color: N.muted, fontWeight: 600 }}>{cont.tr}</span> · {cont.en}</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {starters.map((s) => <SurahRow key={s.n} s={s} onOpen={onOpen} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Revelation view — split into Meccan & Medinan, each a counted section.
function RevList({ onOpen }) {
  const groups = [
    { key: "Meccan", ar: "مكية", desc: "Revealed in Mecca — themes of faith, tawḥīd and the hereafter" },
    { key: "Medinan", ar: "مدنية", desc: "Revealed in Medina — law, community and social life" },
  ];
  return (
    <div>
      {groups.map((g) => {
        const list = QURAN.surahs.filter((s) => s.rev === g.key);
        return (
          <div key={g.key}>
            <GroupHeader kicker={`${list.length}`} title={g.key} ar={g.ar} note={g.desc} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {list.map((s) => <SurahRow key={s.n} s={s} onOpen={onOpen} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SurahRow({ s, onOpen }) {
  return (
    <div className="ul-link ul-press" onClick={() => onOpen(s.n)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: N.card, border: `1px solid ${N.border}` }}>
      <div style={{ width: 40, height: 40, flexShrink: 0, position: "relative", display: "grid", placeItems: "center" }}>
        <Khatam size={40} color={N.goldDim} sw={1.2} />
        <span style={{ position: "absolute", fontSize: 12.5, fontWeight: 700, color: N.gold }}>{s.n}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.tr}</div>
        <div style={{ fontSize: 12.5, color: N.faint }}>{s.en} · {s.ayahs} ayahs · {s.rev}</div>
      </div>
      <div className="ul-ar" style={{ fontSize: 22, color: N.muted, flexShrink: 0 }}>{s.ar}</div>
    </div>
  );
}

function Hub({ onOpen, query, setQuery, go }) {
  const [tab, setTab] = React.useState("surah");
  const q = (query || "").trim().toLowerCase();
  const filtered = q
    ? QURAN.surahs.filter((s) => s.tr.toLowerCase().includes(q) || s.en.toLowerCase().includes(q) || String(s.n) === q || s.ar.includes(query))
    : QURAN.surahs;

  return (
    <div className="ul-scroll" style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: -160, right: -120, width: 520, height: 460, background: "radial-gradient(ellipse, rgba(230,184,85,0.10), transparent 65%)", pointerEvents: "none" }} />
      <div className="ul-rise" style={{ position: "relative", maxWidth: 1080, margin: "0 auto", padding: "clamp(20px, 4vw, 34px) clamp(16px, 4vw, 36px) 40px" }}>
        <div style={{ fontSize: 14, color: N.muted, marginBottom: 3 }}>As-salāmu ʿalaykum 🌙</div>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 28px)", fontWeight: 800, letterSpacing: -0.6, margin: "0 0 22px" }}>Welcome back.</h2>

        {/* prayer + streak hero row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
          <div className="ul-link ul-press" onClick={() => go("prayer")} style={{ borderRadius: 16, padding: "20px 22px", background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, border: `1px solid ${N.border}`, position: "relative", overflow: "hidden" }}>
            <Khatam size={120} color={N.gold} sw={1.1} opacity={0.08} style={{ position: "absolute", right: -26, bottom: -30 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Next prayer</span>
              <span style={{ fontSize: 18 }}>🕌</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 3, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: N.gold, lineHeight: 1.1 }}>ʿAsr</span>
              <span style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>4:52 PM</span>
            </div>
            <div style={{ fontSize: 12.5, color: N.muted }}>in 1h 12m · London, UK</div>
          </div>
          <div style={{ borderRadius: 16, padding: "20px 22px", background: N.card, border: `1px solid ${N.border}`, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
              <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}><circle cx="32" cy="32" r="27" fill="none" stroke={N.border} strokeWidth="6" /><circle cx="32" cy="32" r="27" fill="none" stroke={N.gold} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - 14 / 20)} /></svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 800, color: N.gold }}>70%</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Today’s reading</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>14 / 20 min</div>
              <div style={{ fontSize: 12.5, color: N.gold, marginTop: 2, fontWeight: 600 }}>🔥 23-day streak</div>
            </div>
          </div>
        </div>

        {/* continue + streak */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16 }}>
          <div className="ul-link ul-press" onClick={() => onOpen(2)} style={{ gridColumn: "1 / -1", borderRadius: 16, padding: 24, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, border: `1px solid ${N.border}`, position: "relative", overflow: "hidden" }}>
            <Khatam size={150} color={N.gold} sw={1.2} opacity={0.1} style={{ position: "absolute", right: -30, top: -30 }} />
            <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Continue reading</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div><div style={{ fontSize: "clamp(20px,3vw,25px)", fontWeight: 800, letterSpacing: -0.5 }}>Al-Baqarah</div><div style={{ fontSize: 14, color: N.muted, marginTop: 3 }}>Ayah 153 · The Cow · Juzʾ 2</div></div>
              <div className="ul-ar" style={{ fontSize: 40, color: N.goldHi }}>البقرة</div>
            </div>
            <div style={{ marginTop: 18, height: 6, borderRadius: 3, background: N.bg, overflow: "hidden" }}><div style={{ width: "54%", height: "100%", background: N.goldGrad }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: N.faint }}><span>54% through the surah</span><span style={{ color: N.gold, fontWeight: 600 }}>Resume →</span></div>
          </div>
        </div>

        {/* verse of the day */}
        <div style={{ borderRadius: 16, padding: "22px 26px", background: N.card, border: `1px solid ${N.border}`, marginBottom: 16, display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
          <div className="ul-ar" style={{ flex: "1 1 280px", fontSize: 28, lineHeight: 2.1, color: N.fg }}>{QURAN.votd.ar}</div>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 8 }}>Verse of the day</div>
            <div style={{ fontSize: 15.5, lineHeight: 1.65, color: N.muted }}>{QURAN.votd.en}</div>
            <div style={{ fontSize: 13.5, color: N.gold, marginTop: 10, fontWeight: 600 }}>{QURAN.votd.ref}</div>
          </div>
        </div>

        {/* quick tools strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 28 }}>
          {QURAN.tools.slice(0, 4).map((t) => (
            <div key={t.key} className="ul-link ul-press" onClick={() => go(t.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: N.card, border: `1px solid ${N.border}` }}>
              <div style={{ fontSize: 22, lineHeight: 1, width: 30, height: 30, display: "grid", placeItems: "center", flexShrink: 0 }}>{t.glyph}</div>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{t.label}</div><div style={{ fontSize: 12, color: N.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{t.note}</div></div>
            </div>
          ))}
        </div>

        {/* surah index */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>The Quran</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["surah", "Surah"], ["juz", "Juzʾ"], ["rev", "Revelation"]].map(([v, l]) => (
              <button key={v} className="ul-link ul-press" onClick={() => setTab(v)} style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${tab === v ? N.gold : N.border}`, background: tab === v ? N.goldSoft : "transparent", color: tab === v ? N.gold : N.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: N.ui }}>{l}</button>
            ))}
          </div>
        </div>

        {q ? (
          <>
            <div style={{ fontSize: 13, color: N.faint, marginBottom: 12 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for “{query}”</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {filtered.map((s) => <SurahRow key={s.n} s={s} onOpen={onOpen} />)}
            </div>
            {filtered.length === 0 && <div style={{ textAlign: "center", color: N.faint, padding: 40 }}>No surah matches “{query}”.</div>}
          </>
        ) : tab === "juz" ? (
          <JuzList onOpen={onOpen} />
        ) : tab === "rev" ? (
          <RevList onOpen={onOpen} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {QURAN.surahs.map((s) => <SurahRow key={s.n} s={s} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── TOOLS ───────────────────────── */
function Tools({ onOpen, go }) {
  const next = QURAN.prayers.find((p) => p.next);
  return (
    <div className="ul-scroll" style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
      <div className="ul-rise" style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(20px, 4vw, 34px) clamp(16px, 4vw, 36px) 40px" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 28px)", fontWeight: 800, letterSpacing: -0.6, margin: "0 0 4px" }}>Worship & Tools</h2>
        <div style={{ fontSize: 14, color: N.muted, marginBottom: 24 }}>Everything for your day, in one place.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
          {/* prayer times — featured */}
          <div className="ul-link ul-press" onClick={() => go("prayer")} style={{ borderRadius: 18, padding: 24, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, border: `1px solid ${N.border}`, position: "relative", overflow: "hidden" }}>
            <Khatam size={160} color={N.gold} sw={1.1} opacity={0.08} style={{ position: "absolute", right: -36, bottom: -40 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Next prayer</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap", margin: "5px 0 3px" }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: N.gold, lineHeight: 1.1 }}>{next.name}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{next.time} PM</span>
                </div>
                <div style={{ fontSize: 13.5, color: N.muted }}>in 1h 12m · London, UK</div>
              </div>
              <div style={{ fontSize: 30, flexShrink: 0 }}>🕌</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {QURAN.prayers.filter((p) => p.name !== "Sunrise").map((p) => (
                <div key={p.name} style={{ textAlign: "center", padding: "12px 6px", borderRadius: 11, background: p.next ? N.goldSoft : N.bg, border: `1px solid ${p.next ? N.gold : N.borderSoft}` }}>
                  <div style={{ fontSize: 12.5, color: p.next ? N.gold : N.muted, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, color: p.next ? N.goldHi : N.fg }}>{p.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* qibla */}
          <div className="ul-link ul-press" onClick={() => go("qibla")} style={{ borderRadius: 18, padding: 24, background: N.card, border: `1px solid ${N.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ position: "relative", width: 150, height: 150, marginBottom: 16 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${N.border}` }} />
              <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: `1px dashed ${N.borderSoft}` }} />
              {["N", "E", "S", "W"].map((d, i) => (
                <span key={d} style={{ position: "absolute", fontSize: 11, color: N.faint, top: i === 0 ? 6 : i === 2 ? "auto" : "50%", bottom: i === 2 ? 6 : "auto", left: i === 3 ? 8 : i === 1 ? "auto" : "50%", right: i === 1 ? 8 : "auto", transform: (i === 0 || i === 2) ? "translateX(-50%)" : "translateY(-50%)" }}>{d}</span>
              ))}
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 4, height: 56, background: N.goldGrad, borderRadius: 2, transformOrigin: "bottom center", transform: "translate(-50%, -100%) rotate(118deg)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 12, height: 12, borderRadius: 6, background: N.gold, transform: "translate(-50%, -50%)" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Qibla · 118° SE</div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 3 }}>4,821 km to Makkah</div>
          </div>
        </div>

        {/* tool grid */}
        <div style={{ fontSize: 16, fontWeight: 700, margin: "10px 0 14px" }}>All tools</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {QURAN.tools.map((t) => (
            <div key={t.key} className="ul-link ul-press" onClick={() => go(t.key)} style={{ padding: "18px 16px", borderRadius: 14, background: N.card, border: `1px solid ${N.border}` }}>
              <div style={{ fontSize: 24, lineHeight: 1, height: 28, display: "flex", alignItems: "center", marginBottom: 10 }}>{t.glyph}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{t.label}</div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, lineHeight: 1.35 }}>{t.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing, Hub, Tools });
