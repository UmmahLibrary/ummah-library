/* Ummah Library — Tools (interactive): Tasbih, Zakat, Adhkar, Prayer Times, Qibla.
   Shared ToolFrame. Registers screens on window.SCREENS. */
const { useState: uS, useRef: uR, useEffect: uE } = React;

// Shared framed scroll surface with a back row + title.
function ToolFrame({ title, sub, glyph, onBack, actions, children, maxW = 920 }) {
  return (
    <div className="ul-scroll" style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
      <div className="ul-rise" style={{ maxWidth: maxW, margin: "0 auto", padding: "clamp(18px,3.5vw,30px) clamp(16px,4vw,36px) 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <button className="ul-link ul-press" onClick={onBack} style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, border: `1px solid ${N.border}`, background: N.card, color: N.muted, display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Icon name="arrowL" size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {glyph && <span style={{ fontSize: 22, lineHeight: 1, display: "grid", placeItems: "center", flexShrink: 0 }}>{glyph}</span>}
                <h2 style={{ fontSize: "clamp(21px,3.4vw,26px)", fontWeight: 800, letterSpacing: -0.5, margin: 0, lineHeight: 1.15 }}>{title}</h2>
              </div>
              {sub && <div style={{ fontSize: 13.5, color: N.muted, marginTop: 2 }}>{sub}</div>}
            </div>
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}

const card = { background: "var(--ul-card)", border: "1px solid var(--ul-border)", borderRadius: 16 };

/* ───────── TASBIH ───────── */
function Tasbih({ go }) {
  const [idx, setIdx] = uS(0);
  const [count, setCount] = uS(0);
  const [cycles, setCycles] = uS(0);
  const [pulse, setPulse] = uS(0);
  const presets = UL2.tasbih;
  const p = presets[idx];
  const bump = () => {
    setPulse((v) => v + 1);
    setCount((c) => {
      const n = c + 1;
      if (n >= p.target) { setCycles((y) => y + 1); return 0; }
      return n;
    });
  };
  const reset = () => { setCount(0); setCycles(0); };
  const pct = count / p.target;
  const R = 130, C = 2 * Math.PI * R;
  return (
    <ToolFrame title="Tasbih Counter" sub="Tap anywhere on the dial to count" glyph="◍" onBack={() => go("tools")} maxW={560}
      actions={<button className="ul-link ul-press" onClick={reset} style={{ ...card, padding: "9px 16px", color: N.muted, fontFamily: N.ui, fontSize: 13.5, cursor: "pointer" }}>Reset</button>}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {presets.map((x, i) => (
          <button key={i} className="ul-link ul-press" onClick={() => { setIdx(i); setCount(0); }} style={{ padding: "9px 16px", borderRadius: 999, border: `1px solid ${i === idx ? N.gold : N.border}`, background: i === idx ? N.goldSoft : N.card, color: i === idx ? N.gold : N.muted, fontFamily: N.ui, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>{x.tr}</button>
        ))}
      </div>
      <div onClick={bump} className="ul-link" style={{ position: "relative", width: 300, height: 300, margin: "0 auto", display: "grid", placeItems: "center", userSelect: "none" }}>
        <svg width="300" height="300" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx="150" cy="150" r={R} fill="none" stroke={N.border} strokeWidth="10" />
          <circle cx="150" cy="150" r={R} fill="none" stroke={N.gold} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset .3s ease" }} />
        </svg>
        <div key={pulse} className="ul-press" style={{ position: "absolute", width: 224, height: 224, borderRadius: "50%", background: `radial-gradient(circle at 50% 35%, ${N.cardHi}, ${N.card})`, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", animation: "ulTap .18s ease" }}>
          <div className="ul-ar" style={{ fontSize: 26, color: N.goldHi, marginBottom: 6 }}>{p.ar}</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: N.fg, lineHeight: 1, letterSpacing: -2 }}>{count}</div>
          <div style={{ fontSize: 13, color: N.faint, marginTop: 6 }}>of {p.target}</div>
        </div>
      </div>
      <style>{`@keyframes ulTap{0%{transform:scale(1)}50%{transform:scale(.96)}100%{transform:scale(1)}}`}</style>
      <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 26 }}>
        <Stat big={cycles} label="Cycles complete" />
        <Stat big={cycles * p.target + count} label="Total today" />
      </div>
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: N.muted }}>{p.en}</div>
    </ToolFrame>
  );
}
function Stat({ big, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>{big}</div>
      <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ───────── ZAKAT ───────── */
function Field({ label, value, onChange, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: N.muted, marginBottom: 6 }}><span>{label}</span>{hint && <span style={{ color: N.faint, fontSize: 12 }}>{hint}</span>}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...card, padding: "0 14px", height: 46 }}>
        <span style={{ color: N.faint, fontSize: 15 }}>£</span>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 16, width: "100%" }} />
      </div>
    </div>
  );
}
function Zakat({ go }) {
  const [v, setV] = uS({ cash: "", bank: "", gold: "", business: "", receivable: "", liabilities: "" });
  const num = (k) => parseFloat(v[k]) || 0;
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }));
  const assets = num("cash") + num("bank") + num("gold") + num("business") + num("receivable");
  const net = Math.max(0, assets - num("liabilities"));
  const nisab = 5670; // approx gold nisab £
  const due = net >= nisab ? net * 0.025 : 0;
  const eligible = net >= nisab;
  const money = (x) => "£" + x.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return (
    <ToolFrame title="Zakat Calculator" sub="2.5% on wealth held above niṣāb for one lunar year" glyph="⊜" onBack={() => go("tools")}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 14 }}>Your assets</div>
          <Field label="Cash in hand" value={v.cash} onChange={set("cash")} />
          <Field label="Bank balances" value={v.bank} onChange={set("bank")} />
          <Field label="Gold & silver (value)" value={v.gold} onChange={set("gold")} />
          <Field label="Business assets & stock" value={v.business} onChange={set("business")} />
          <Field label="Money owed to you" value={v.receivable} onChange={set("receivable")} />
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, margin: "20px 0 14px" }}>Deductions</div>
          <Field label="Debts & liabilities due" value={v.liabilities} onChange={set("liabilities")} />
        </div>
        <div style={{ position: "sticky", top: 0 }}>
          <div style={{ ...card, padding: 26, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden" }}>
            <Khatam size={150} color={N.gold} opacity={0.08} sw={1.1} style={{ position: "absolute", right: -34, bottom: -40 }} />
            <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Zakat due</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: N.gold, letterSpacing: -1.5, margin: "8px 0 4px" }}>{money(due)}</div>
            <div style={{ fontSize: 13.5, color: eligible ? N.muted : N.faint }}>{eligible ? "Payable on your net zakatable wealth" : "Net wealth is below niṣāb — no zakat due"}</div>
            <div style={{ height: 1, background: N.borderSoft, margin: "20px 0" }} />
            <Row k="Total assets" val={money(assets)} />
            <Row k="Less liabilities" val={"– " + money(num("liabilities"))} />
            <Row k="Net zakatable" val={money(net)} strong />
            <Row k="Niṣāb threshold" val={money(nisab)} faint />
            <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 11, background: N.bg, border: `1px solid ${N.borderSoft}`, fontSize: 12.5, color: N.faint, lineHeight: 1.5 }}>
              Niṣāb shown uses an approximate gold value. Verify the current rate and consult a scholar for your situation.
            </div>
          </div>
        </div>
      </div>
    </ToolFrame>
  );
}
function Row({ k, val, strong, faint }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: strong ? 16 : 14, color: faint ? N.faint : N.muted }}>
      <span>{k}</span><span style={{ fontWeight: strong ? 800 : 600, color: strong ? N.fg : faint ? N.faint : N.fg }}>{val}</span>
    </div>
  );
}

/* ───────── ADHKAR ───────── */
function Adhkar({ go }) {
  const [tab, setTab] = uS("morning");
  const list = UL2.adhkar[tab];
  const [done, setDone] = uS({});
  const key = (i) => tab + i;
  const tap = (i, target) => setDone((d) => ({ ...d, [key(i)]: Math.min(target, (d[key(i)] || 0) + 1) }));
  const completed = list.filter((d, i) => (done[key(i)] || 0) >= d.count).length;
  return (
    <ToolFrame title="Adhkār" sub={`${completed} of ${list.length} completed this ${tab === "morning" ? "morning" : "evening"}`} glyph="☼" onBack={() => go("tools")} maxW={760}
      actions={<Seg size="sm" value={tab} onChange={(t) => setTab(t)} options={[{ value: "morning", label: "Morning" }, { value: "evening", label: "Evening" }]} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map((d, i) => {
          const c = done[key(i)] || 0; const full = c >= d.count;
          return (
            <div key={i} className="ul-link ul-press" onClick={() => tap(i, d.count)} style={{ ...card, padding: 22, borderColor: full ? N.gold : N.border, background: full ? N.goldSoft : N.card }}>
              <div className="ul-ar" style={{ fontSize: 26, lineHeight: 2, color: N.fg, textAlign: "right", marginBottom: 12 }}>{d.ar}</div>
              <div style={{ fontSize: 14, fontStyle: "italic", color: N.gold, marginBottom: 6, opacity: 0.9 }}>{d.tr}</div>
              <div style={{ fontSize: 15, color: N.muted, lineHeight: 1.6 }}>{d.en}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 110, height: 6, borderRadius: 3, background: N.border, overflow: "hidden" }}><div style={{ width: `${(c / d.count) * 100}%`, height: "100%", background: N.goldGrad, transition: "width .2s" }} /></div>
                  <span style={{ fontSize: 13, color: N.faint }}>{c} / {d.count}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: full ? N.gold : N.faint, display: "inline-flex", alignItems: "center", gap: 6 }}>{full ? <><Icon name="check" size={15} /> Done</> : "Tap to count"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </ToolFrame>
  );
}

/* ───────── PRAYER TIMES ───────── */
function PrayerTimes({ go }) {
  const next = QURAN.prayers.find((p) => p.next);
  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [notif, setNotif] = uS({ Fajr: true, Dhuhr: true, "ʿAsr": true, Maghrib: true, "ʿIshāʾ": false });
  return (
    <ToolFrame title="Prayer Times" sub="London, United Kingdom · Muslim World League" glyph="🕌" onBack={() => go("tools")}
      actions={<button className="ul-link ul-press" style={{ ...card, padding: "9px 16px", color: N.muted, fontFamily: N.ui, fontSize: 13.5, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}><Icon name="settings" size={15} /> Method</button>}>
      <div style={{ ...card, padding: 26, background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`, position: "relative", overflow: "hidden", marginBottom: 18 }}>
        <Khatam size={170} color={N.gold} opacity={0.08} sw={1.1} style={{ position: "absolute", right: -40, top: -46 }} />
        <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Next prayer</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "6px 0 2px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: N.gold }}>{next.name}</span>
          <span style={{ fontSize: 26, fontWeight: 700 }}>{next.time} PM</span>
        </div>
        <div style={{ fontSize: 14, color: N.muted }}>begins in 1 hour 12 minutes</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        {QURAN.prayers.map((p) => (
          <div key={p.name} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: p.next ? N.gold : N.border, background: p.next ? N.goldSoft : N.card }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: p.next ? N.goldHi : N.fg }}>{p.name}</div>
              <div style={{ fontSize: 12, color: N.faint }}>{p.name === "Sunrise" ? "Shurūq" : "Adhān"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: p.next ? N.goldHi : N.fg }}>{p.time}</span>
              {p.name !== "Sunrise" && (
                <button className="ul-link ul-press" onClick={() => setNotif((n) => ({ ...n, [p.name]: !n[p.name] }))} style={{ background: "none", border: "none", cursor: "pointer", color: notif[p.name] ? N.gold : N.faint, padding: 0 }}>
                  <Icon name={notif[p.name] ? "check" : "plus"} size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>This week</div>
      <div style={{ ...card, padding: "6px 6px", overflowX: "auto" }} className="ul-scroll">
        <div style={{ display: "flex", minWidth: 520 }}>
          {week.map((d, i) => (
            <div key={d} style={{ flex: 1, textAlign: "center", padding: "12px 6px", borderRadius: 11, background: i === 1 ? N.goldSoft : "transparent" }}>
              <div style={{ fontSize: 12, color: i === 1 ? N.gold : N.faint, fontWeight: 700, marginBottom: 10 }}>{d}</div>
              {["4:14", "1:08", "4:52", "8:34", "10:01"].map((t, j) => (
                <div key={j} style={{ fontSize: 12, color: N.muted, padding: "3px 0" }}>{t}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ToolFrame>
  );
}

/* ───────── QIBLA ───────── */
function Qibla({ go }) {
  const [heading, setHeading] = uS(0);
  const qibla = 118;
  const rel = qibla - heading;
  return (
    <ToolFrame title="Qibla Finder" sub="118° SE · 4,821 km to the Kaʿbah" glyph="🧭" onBack={() => go("tools")} maxW={560}>
      <div style={{ ...card, padding: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 300, height: 300, marginBottom: 8 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${N.border}`, transform: `rotate(${-heading}deg)`, transition: "transform .1s" }}>
            {[..."NESW"].map((d, i) => (
              <span key={d} style={{ position: "absolute", fontSize: 14, fontWeight: 700, color: d === "N" ? N.gold : N.faint, top: i === 0 ? 12 : i === 2 ? "auto" : "50%", bottom: i === 2 ? 12 : "auto", left: i === 3 ? 14 : i === 1 ? "auto" : "50%", right: i === 1 ? 14 : "auto", transform: (i === 0 || i === 2) ? "translateX(-50%)" : "translateY(-50%)" }}>{d}</span>
            ))}
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 1, height: i % 6 === 0 ? 12 : 6, background: N.border, transformOrigin: "center 138px", transform: `translate(-50%,-138px) rotate(${i * 15}deg)` }} />
            ))}
            {/* qibla pointer (fixed to compass ring) */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transformOrigin: "center bottom", transform: `translate(-50%,-100%) rotate(${qibla}deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 40, height: 40, marginBottom: -6, display: "grid", placeItems: "center" }}>
                <div style={{ width: 28, height: 28, background: N.goldGrad, borderRadius: 6, display: "grid", placeItems: "center", color: N.ink, fontSize: 16, transform: `rotate(${-qibla + heading}deg)` }}>🕋</div>
              </div>
              <div style={{ width: 4, height: 118, background: N.goldGrad, borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 14, height: 14, borderRadius: 7, background: N.gold, border: `3px solid ${N.bg}`, transform: "translate(-50%,-50%)" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: N.gold, letterSpacing: -1 }}>{((rel % 360) + 360) % 360}°</div>
          <div style={{ fontSize: 13.5, color: N.muted }}>Turn until the Kaʿbah points straight up</div>
        </div>
        <div style={{ width: "100%", marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: N.faint, marginBottom: 6 }}><span>Simulate your facing</span><span>{heading}°</span></div>
          <input type="range" min="0" max="359" value={heading} onChange={(e) => setHeading(+e.target.value)} style={{ width: "100%", accentColor: N.gold }} />
        </div>
      </div>
    </ToolFrame>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, { tasbih: Tasbih, zakat: Zakat, adhkar: Adhkar, prayer: PrayerTimes, qibla: Qibla });
Object.assign(window, { ToolFrame, ToolStat: Stat });
