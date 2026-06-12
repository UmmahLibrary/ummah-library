/* Ummah Library — research-driven screens: Du'ās, Reading Plans, Prayer Tracker,
   Profile. Uses ToolFrame + N tokens (theme-reactive). Registers on window.SCREENS. */
const { useState: mS } = React;
const mcard = { background: "var(--ul-card)", border: "1px solid var(--ul-border)", borderRadius: 16 };

/* ───────── DUʿĀS ───────── */
function Duas({ go }) {
  const [cat, setCat] = mS(null);
  const [done, setDone] = mS({});
  if (cat) {
    const list = UL2.duas[cat.key] || [];
    return (
      <ToolFrame title={cat.label} sub={`${cat.count} authentic supplications`} glyph={cat.glyph} onBack={() => setCat(null)} maxW={760}>
        {list.length === 0 && <div style={{ textAlign: "center", color: N.faint, padding: 40 }}>Supplications for this section sync from your library.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((d, i) => (
            <div key={i} style={{ ...mcard, padding: 24 }}>
              <div className="ul-ar" style={{ fontSize: 26, lineHeight: 2.05, textAlign: "right", color: N.fg, marginBottom: 14 }}>{d.ar}</div>
              <div style={{ fontSize: 14, fontStyle: "italic", color: N.gold, marginBottom: 8, opacity: 0.9 }}>{d.tr}</div>
              <div style={{ fontSize: 15.5, lineHeight: 1.65, color: N.muted }}>{d.en}</div>
              {d.virtue && <div style={{ fontSize: 13, color: N.muted, marginTop: 12, padding: "10px 14px", borderRadius: 10, background: N.goldSoft, border: `1px solid ${N.border}` }}><span style={{ color: N.gold, fontWeight: 700 }}>Virtue · </span>{d.virtue}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${N.borderSoft}` }}>
                <span style={{ fontSize: 13, color: N.gold, fontWeight: 600 }}>{d.ref}</span>
                <div style={{ display: "flex", gap: 16 }}>
                  <button className="ul-link ul-press" style={{ background: "none", border: "none", color: N.faint, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center", fontFamily: N.ui, fontSize: 12.5, fontWeight: 600 }}><Icon name="layers" size={15} /> Copy</button>
                  <button className="ul-link ul-press" onClick={() => setDone((o) => ({ ...o, [cat.key + i]: !o[cat.key + i] }))} style={{ background: "none", border: "none", color: done[cat.key + i] ? N.gold : N.faint, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center", fontFamily: N.ui, fontSize: 12.5, fontWeight: 600 }}><Icon name={done[cat.key + i] ? "check" : "repeat"} size={15} /> {done[cat.key + i] ? "Recited" : "Mark recited"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ToolFrame>
    );
  }
  return (
    <ToolFrame title="Duʿās" sub="A fortress of authentic supplication for every moment" glyph="🤲" onBack={() => go("tools")} maxW={900}>
      <div style={{ ...mcard, padding: 22, marginBottom: 20, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div className="ul-ar" style={{ flex: "1 1 240px", fontSize: 24, lineHeight: 2, color: N.fg }}>رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً</div>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 6 }}>Duʿā of the day</div>
          <div style={{ fontSize: 14.5, color: N.muted, lineHeight: 1.6 }}>“Our Lord, give us good in this world and good in the Hereafter…”</div>
          <div style={{ fontSize: 13, color: N.gold, marginTop: 8, fontWeight: 600 }}>Al-Baqarah 2:201</div>
        </div>
      </div>
      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>By moment</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
        {UL2.duaCategories.map((c) => (
          <div key={c.key} className="ul-link ul-press" onClick={() => setCat(c)} style={{ ...mcard, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{c.glyph}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>{c.count} duʿās</div>
            </div>
            <Icon name="chevR" size={17} color={N.faint} />
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────── READING PLANS ───────── */
function Plans({ go, openSurah }) {
  const p = UL2.plans;
  const R = 34, C = 2 * Math.PI * R;
  return (
    <ToolFrame title="Reading Plans" sub="Structured journeys through the Book of Allah" glyph="🗺" onBack={() => go("tools")}>
      {/* active plan */}
      <div style={{ ...mcard, padding: 26, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <Khatam size={170} color={N.gold} opacity={0.07} sw={1.1} style={{ position: "absolute", right: -40, top: -46 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
            <svg width="92" height="92" style={{ transform: "rotate(-90deg)" }}><circle cx="46" cy="46" r={R} fill="none" stroke={N.border} strokeWidth="8" /><circle cx="46" cy="46" r={R} fill="none" stroke={N.gold} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p.active.pct / 100)} /></svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800, color: N.gold }}>{p.active.pct}%</div>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Active plan · Day {p.active.dayN} of {p.active.totalDays}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: "4px 0 6px" }}>{p.active.name}</div>
            <div style={{ fontSize: 14, color: N.muted }}>Today: <span style={{ color: N.fg, fontWeight: 600 }}>{p.active.todayRef}</span> · ~{p.active.todayMin} min</div>
          </div>
          <Btn onClick={() => openSurah(24)} icon="book" style={{ flexShrink: 0 }}>Read today</Btn>
        </div>
      </div>

      {/* this week */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>This week</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 28 }}>
        {p.week.map((d, i) => (
          <div key={i} className="ul-link ul-press" onClick={() => openSurah(24)} title={d.ref} style={{ ...mcard, padding: "12px 6px", textAlign: "center", borderColor: d.today ? N.gold : "var(--ul-border)", background: d.today ? N.goldSoft : "var(--ul-card)" }}>
            <div style={{ fontSize: 11.5, color: d.today ? N.gold : N.faint, fontWeight: 700, marginBottom: 8 }}>{d.d}</div>
            <div style={{ width: 26, height: 26, margin: "0 auto", borderRadius: 13, display: "grid", placeItems: "center", background: d.done ? N.goldGrad : "transparent", border: d.done ? "none" : `1px solid ${N.border}` }}>
              {d.done ? <Icon name="check" size={15} color={N.ink} /> : <span style={{ fontSize: 12, color: N.faint }}>{i + 1}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* plan library */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Browse plans</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 14 }}>
        {p.library.map((pl) => (
          <div key={pl.key} className="ul-link ul-press" style={{ ...mcard, padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: N.gold, background: N.goldSoft, border: `1px solid ${N.border}`, borderRadius: 999, padding: "3px 10px" }}>{pl.tag}</span>
              <span style={{ fontSize: 12, color: N.faint }}>{pl.len}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{pl.name}</div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 5, lineHeight: 1.55, flex: 1 }}>{pl.desc}</div>
            <div style={{ marginTop: 14 }}>
              {pl.pct > 0 ? (
                <>
                  <div style={{ height: 5, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${pl.pct}%`, height: "100%", background: N.goldGrad }} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 12, color: N.faint }}><span>{pl.pct === 100 ? "Completed" : "In progress"}</span><span style={{ color: N.gold, fontWeight: 600 }}>{pl.pct === 100 ? "Restart" : "Continue →"}</span></div>
                </>
              ) : (
                <span style={{ fontSize: 13, color: N.gold, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={15} /> Start plan</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────── PRAYER TRACKER ───────── */
function Tracker({ go }) {
  const t = UL2.tracker;
  const [today, setToday] = mS(t.today);
  const states = ["none", "late", "ontime"];
  const cycle = (p) => setToday((o) => ({ ...o, [p]: states[(states.indexOf(o[p]) + 1) % 3] }));
  const color = (st) => st === "ontime" ? N.gold : st === "late" ? "#C98A57" : N.border;
  const label = (st) => st === "ontime" ? "On time" : st === "late" ? "Late" : "Not yet";
  const prayed = t.prayers.filter((p) => today[p] !== "none").length;
  const dayCell = (v) => v === 2 ? N.gold : v === 1 ? "#C98A57" : "transparent";
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <ToolFrame title="Prayer Tracker" sub="Build consistency, one ṣalāh at a time" glyph="📿" onBack={() => go("tools")} maxW={820}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        {[[`${prayed}/5`, "Prayed today"], [t.streak + " 🔥", "Day streak"], [t.onTimePct + "%", "On time (30d)"], [t.fasting.sunnahThisMonth, "Sunnah fasts"]].map(([a, b]) => (
          <div key={b} style={{ ...mcard, padding: "18px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>{a}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3 }}>{b}</div>
          </div>
        ))}
      </div>

      {/* today's five */}
      <div style={{ ...mcard, padding: 24, marginBottom: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 16 }}>Today · tap to log</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {t.prayers.map((p) => {
            const st = today[p];
            return (
              <button key={p} className="ul-link ul-press" onClick={() => cycle(p)} style={{ padding: "16px 6px", borderRadius: 13, border: `1px solid ${st === "none" ? N.border : color(st)}`, background: st === "none" ? "transparent" : N.goldSoft, cursor: "pointer", fontFamily: N.ui, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, display: "grid", placeItems: "center", background: st === "ontime" ? N.goldGrad : "transparent", border: st === "ontime" ? "none" : `1.5px solid ${color(st)}` }}>
                  {st === "ontime" ? <Icon name="check" size={18} color={N.ink} /> : st === "late" ? <Icon name="check" size={16} color="#C98A57" /> : <span style={{ width: 8, height: 8, borderRadius: 4, background: N.border }} />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: N.fg }}>{p}</div>
                <div style={{ fontSize: 11, color: st === "none" ? N.faint : N.gold, fontWeight: 600 }}>{label(st)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7-day grid */}
      <div style={{ ...mcard, padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Last 7 days</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: N.faint }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: N.gold }} /> On time</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#C98A57" }} /> Late</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, border: `1px solid ${N.border}` }} /> Missed</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: 8, alignItems: "center" }}>
          <div />
          {days.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11.5, color: N.faint, fontWeight: 700 }}>{d}</div>)}
          {t.prayers.map((p, pi) => (
            <React.Fragment key={p}>
              <div style={{ fontSize: 12.5, color: N.muted, fontWeight: 600, paddingRight: 8 }}>{p}</div>
              {t.history.map((day, di) => (
                <div key={di} style={{ aspectRatio: "1", borderRadius: 7, background: dayCell(day[pi]) === "transparent" ? "transparent" : dayCell(day[pi]), border: day[pi] === 0 ? `1px solid ${N.border}` : "none", maxWidth: 30, margin: "0 auto", width: "100%" }} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* fasting */}
      <div style={{ ...mcard, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Fasting · {t.fasting.month}</div>
          <div style={{ fontSize: 13, color: N.muted, marginTop: 3 }}>Track Ramaḍān and Sunnah fasts, and make up missed days.</div>
        </div>
        <Btn variant="ghost" icon="plus">Log a fast</Btn>
      </div>
    </ToolFrame>
  );
}

/* ───────── PROFILE ───────── */
function Profile({ go }) {
  const p = UL2.profile;
  const st = p.stats;
  return (
    <ToolFrame title="Profile" sub={p.joined} glyph="👤" onBack={() => go("hub")} maxW={820}>
      <div style={{ ...mcard, padding: 26, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <Khatam size={150} color={N.gold} opacity={0.08} sw={1.1} style={{ position: "absolute", right: -34, bottom: -38 }} />
        <div style={{ width: 76, height: 76, borderRadius: 38, background: N.goldGrad, display: "grid", placeItems: "center", color: N.ink, fontSize: 30, fontWeight: 800, flexShrink: 0 }}>A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{p.name}</div>
          <div style={{ fontSize: 13.5, color: N.muted, marginTop: 2 }}>{p.location} · {p.joined}</div>
        </div>
        <Btn variant="ghost" icon="settings" onClick={() => go("settings")} style={{ flexShrink: 0 }}>Edit</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 22 }}>
        {[[st.dayStreak + " 🔥", "Day streak"], [st.ayahsRead.toLocaleString(), "Ayahs read"], [Math.round(st.minutes / 60) + "h", "Time in Quran"], [st.surahsMemoH, "Surahs memorized"], [st.khatm + "×", "Khatm complete"], [st.longest, "Longest streak"]].map(([a, b]) => (
          <div key={b} style={{ ...mcard, padding: "18px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>{a}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Achievements</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
        {p.badges.map((b) => (
          <div key={b.name} style={{ ...mcard, padding: "20px 16px", textAlign: "center", opacity: b.got ? 1 : 0.5 }}>
            <div style={{ width: 52, height: 52, margin: "0 auto 10px", borderRadius: 26, display: "grid", placeItems: "center", fontSize: 24, background: b.got ? N.goldSoft : "transparent", border: `1px solid ${b.got ? N.gold : N.border}`, filter: b.got ? "none" : "grayscale(1)" }}>{b.glyph}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{b.name}</div>
            <div style={{ fontSize: 11.5, color: b.got ? N.gold : N.faint, marginTop: 3, fontWeight: 600 }}>{b.got ? "Unlocked" : "Locked"}</div>
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

/* ───────── RAMADAN HUB ───────── */
function Ramadan({ go, openSurah }) {
  const r = UL2.ramadan;
  const [daily, setDaily] = mS(r.daily.map((d) => d.done));
  const [tick, setTick] = mS(r.countdown.h * 3600 + r.countdown.m * 60);
  React.useEffect(() => { const id = setInterval(() => setTick((t) => (t > 0 ? t - 1 : 0)), 1000); return () => clearInterval(id); }, []);
  const hh = Math.floor(tick / 3600), mm = Math.floor((tick % 3600) / 60), ss = tick % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const doneCount = daily.filter(Boolean).length;
  const R = 36, Circ = 2 * Math.PI * R;

  return (
    <ToolFrame title="Ramadan" sub={`${r.weekday} · ${r.dayN} Ramaḍān ${r.year}`} glyph="🌙" onBack={() => go("tools")}>
      {/* hero — countdown to iftar */}
      <div style={{ ...mcard, padding: "30px 26px", background: `linear-gradient(150deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 16, textAlign: "center" }}>
        <Khatam size={260} color={N.gold} opacity={0.06} sw={0.9} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700 }}>Time until Ifṭār</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "12px 0 6px", fontVariantNumeric: "tabular-nums" }}>
            {[[pad(hh), "hrs"], [pad(mm), "min"], [pad(ss), "sec"]].map(([v, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <span style={{ fontSize: 38, fontWeight: 300, color: N.faint, marginTop: -8 }}>:</span>}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1, color: N.fg, lineHeight: 1 }}>{v}</span>
                  <span style={{ fontSize: 11, color: N.faint, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{l}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          {/* fasting-day progress */}
          <div style={{ maxWidth: 420, margin: "20px auto 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: N.muted, marginBottom: 7 }}>
              <span><Icon name="sun" size={13} color={N.gold} style={{ verticalAlign: "-2px", marginRight: 5 }} />Suhūr {r.suhoorEnd} {r.fajrLabel}</span>
              <span>Ifṭār {r.iftar} {r.iftarLabel}<Icon name="moon" size={13} color={N.gold} style={{ verticalAlign: "-2px", marginLeft: 5 }} /></span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: N.border, overflow: "hidden" }}><div style={{ width: `${r.dayProgressPct}%`, height: "100%", background: N.goldGrad }} /></div>
            <div style={{ fontSize: 12, color: N.faint, marginTop: 7 }}>{r.dayProgressPct}% of today’s fast complete — may Allah accept it</div>
          </div>
        </div>
      </div>

      {/* stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 18 }}>
        {[[`${r.fasting.kept}/${r.totalDays}`, "Fasts kept"], [r.taraweeh.nights, "Tarāwīḥ nights"], [`${r.khatm.pct}%`, "Khatm progress"], [r.fasting.makeup, "To make up"]].map(([a, b]) => (
          <div key={b} style={{ ...mcard, padding: "18px 20px" }}>
            <div style={{ fontSize: 23, fontWeight: 800, color: N.gold, letterSpacing: -0.5 }}>{a}</div>
            <div style={{ fontSize: 12.5, color: N.faint, marginTop: 3 }}>{b}</div>
          </div>
        ))}
      </div>

      {/* two-up: khatm + taraweeh */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 14, marginBottom: 18 }}>
        <div style={{ ...mcard, padding: 22, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
            <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}><circle cx="42" cy="42" r={R} fill="none" stroke={N.border} strokeWidth="7" /><circle cx="42" cy="42" r={R} fill="none" stroke={N.gold} strokeWidth="7" strokeLinecap="round" strokeDasharray={Circ} strokeDashoffset={Circ * (1 - r.khatm.pct / 100)} /></svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 800, color: N.gold }}>{r.khatm.pct}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>Ramadan Khatm</div>
            <div style={{ fontSize: 13, color: N.faint, marginTop: 2 }}>{r.khatm.juzDone} of 30 juzʾ · {r.khatm.perDay}</div>
            <button className="ul-link ul-press" onClick={() => openSurah(12)} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: "none", background: N.goldGrad, color: N.ink, fontFamily: N.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Icon name="book" size={15} /> Read {r.khatm.todayRef}</button>
          </div>
        </div>
        <div style={{ ...mcard, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>Tarāwīḥ tonight</div>
            <span style={{ fontSize: 12, color: N.gold, fontWeight: 700, background: N.goldSoft, border: `1px solid ${N.border}`, borderRadius: 999, padding: "3px 10px" }}>Juzʾ {r.taraweeh.juzTonight}</span>
          </div>
          <div style={{ fontSize: 13.5, color: N.muted, lineHeight: 1.5, marginBottom: 14 }}>{r.taraweeh.rakahsTarget} rakʿahs · {r.taraweeh.masjid}</div>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 26, borderRadius: 5, background: i < (r.taraweeh.nights % 10 || 10) ? N.goldGrad : N.border, opacity: i < (r.taraweeh.nights % 10 || 10) ? 1 : 0.5 }} title={`Night ${i + 1}`} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: N.faint, marginTop: 8 }}>{r.taraweeh.nights} nights prayed so far</div>
        </div>
      </div>

      {/* fasting calendar */}
      <div style={{ ...mcard, padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Fasting · Ramaḍān {r.year}</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: N.faint }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: N.gold }} /> Kept</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, border: `1px solid ${N.gold}` }} /> Today</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, border: `1px solid ${N.border}` }} /> Upcoming</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 7 }}>
          {r.fastDays.map((st, i) => {
            const last10 = i >= 20;
            return (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 9, display: "grid", placeItems: "center", position: "relative", fontSize: 13, fontWeight: 700, background: st === 2 ? N.goldGrad : st === 3 ? N.goldSoft : "transparent", border: st === 3 ? `1.5px solid ${N.gold}` : st === 2 ? "none" : `1px solid ${N.borderSoft}`, color: st === 2 ? N.ink : st === 3 ? N.gold : last10 ? N.gold : N.faint }}>
                {i + 1}
                {last10 && (i + 1) % 2 === 1 && st !== 2 && <span style={{ position: "absolute", top: 3, right: 4, fontSize: 8, color: N.gold }}>✦</span>}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: N.faint, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: N.gold }}>✦</span> Odd nights of the last ten — seek Laylat al-Qadr</div>
      </div>

      {/* daily checklist */}
      <div style={{ ...mcard, padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Today’s acts of worship</div>
          <span style={{ fontSize: 13, color: N.gold, fontWeight: 700 }}>{doneCount}/{daily.length}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 8 }}>
          {r.daily.map((d, i) => (
            <button key={i} className="ul-link ul-press" onClick={() => setDaily((o) => o.map((v, j) => (j === i ? !v : v)))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, border: `1px solid ${daily[i] ? N.gold : N.border}`, background: daily[i] ? N.goldSoft : "transparent", cursor: "pointer", fontFamily: N.ui, textAlign: "left" }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, display: "grid", placeItems: "center", flexShrink: 0, background: daily[i] ? N.goldGrad : "transparent", border: daily[i] ? "none" : `1.5px solid ${N.border}` }}>
                {daily[i] ? <Icon name="check" size={15} color={N.ink} /> : <Icon name={d.icon} size={14} color={N.faint} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: daily[i] ? N.fg : N.muted, textDecoration: daily[i] ? "none" : "none" }}>{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* suhoor & iftar duʿās */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 14 }}>
        {[["At Suhūr", r.suhoorDua, "sun"], ["At Ifṭār", r.iftarDua, "moon"]].map(([t, d, ic]) => (
          <div key={t} style={{ ...mcard, padding: 22 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 12 }}><Icon name={ic} size={15} /> {t}</div>
            <div className="ul-ar" style={{ fontSize: 22, lineHeight: 2, textAlign: "right", color: N.fg, marginBottom: 10 }}>{d.ar}</div>
            <div style={{ fontSize: 14, color: N.muted, lineHeight: 1.6 }}>{d.en}</div>
            {d.ref && <div style={{ fontSize: 12.5, color: N.gold, marginTop: 8, fontWeight: 600 }}>{d.ref}</div>}
          </div>
        ))}
      </div>
    </ToolFrame>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, { duas: Duas, plans: Plans, tracker: Tracker, profile: Profile, ramadan: Ramadan });
