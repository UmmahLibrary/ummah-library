/* Ummah Library — Global search across Quran, Hadith, Duʿās, Names & tools.
   Builds a unified in-memory index once, ranks matches, groups by source with
   type filters, recent searches, and rich result cards. Registers SCREENS.search. */
const { useState: gS, useMemo: gMemo, useEffect: gEff, useRef: gRef } = React;
const gcard = { background: "var(--ul-card)", border: "1px solid var(--ul-border)", borderRadius: 16 };

// fold accents + lowercase for forgiving matching (e.g. "rahman" matches "Raḥmān")
function gFold(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʿʾ]/g, "").toLowerCase();
}
function gHi(text, q) {
  if (!q) return text;
  const f = gFold(text), fq = gFold(q);
  const at = f.indexOf(fq);
  if (at < 0) return text;
  return [
    text.slice(0, at),
    <mark key="m" style={{ background: N.goldSoft, color: N.goldHi, borderRadius: 3, padding: "0 2px" }}>{text.slice(at, at + q.length)}</mark>,
    text.slice(at + q.length),
  ];
}

// ── unified index (built once)
let _gIndex = null;
function buildIndex() {
  if (_gIndex) return _gIndex;
  const idx = [];
  // surahs
  QURAN.surahs.forEach((s) => idx.push({
    type: "surah", title: s.tr, sub: `${s.en} · ${s.ayahs} ayahs · ${s.rev}`, ar: s.ar,
    ref: `Surah ${s.n}`, hay: gFold(`${s.tr} ${s.en} surah ${s.n}`), surah: s.n,
  }));
  // ayahs (bundled full text)
  Object.keys(QURAN.text).forEach((sn) => {
    const meta = QURAN.surahs[+sn - 1];
    QURAN.text[sn].forEach((a) => idx.push({
      type: "ayah", title: a.en, ar: a.ar, sub: `${meta.tr} ${meta.n}:${a.n}`,
      ref: `${meta.tr} ${meta.n}:${a.n}`, hay: gFold(`${a.en} ${a.tr} ${meta.tr}`), surah: +sn, ayah: a.n,
    }));
  });
  // hadith
  (UL2.hadith?.samples || []).forEach((h) => idx.push({
    type: "hadith", title: h.en, ar: h.ar, sub: `${h.colName} · ${h.grade}`,
    ref: h.ref, badge: h.grade, hay: gFold(`${h.en} ${h.narrator} ${h.topics.join(" ")} ${h.colName} ${h.ref}`),
  }));
  // duʿās
  Object.keys(UL2.duas || {}).forEach((catKey) => {
    const cat = (UL2.duaCategories || []).find((c) => c.key === catKey);
    (UL2.duas[catKey] || []).forEach((d) => idx.push({
      type: "dua", title: d.en, ar: d.ar, sub: cat ? cat.label : "Duʿā", tr: d.tr,
      ref: d.ref, hay: gFold(`${d.en} ${d.tr} ${d.ref} ${cat ? cat.label : ""}`),
    }));
  });
  // 99 names
  (UL2.names || []).forEach((n, i) => {
    const tr = Array.isArray(n) ? n[0] : n.tr, ar = Array.isArray(n) ? n[1] : n.ar, en = Array.isArray(n) ? n[2] : n.en;
    idx.push({ type: "name", title: tr, ar, sub: en, ref: `Name ${i + 1} of 99`, hay: gFold(`${tr} ${en}`) });
  });
  _gIndex = idx;
  return idx;
}

const G_TYPES = [
  { key: "all", label: "All" },
  { key: "ayah", label: "Quran" },
  { key: "hadith", label: "Hadith" },
  { key: "dua", label: "Duʿās" },
  { key: "name", label: "Names" },
];
const G_META = {
  surah: { label: "Surah", color: "#E6B855", icon: "book" },
  ayah: { label: "Verse", color: "#E6B855", icon: "book" },
  hadith: { label: "Hadith", color: "#5BBF8A", icon: "globe" },
  dua: { label: "Duʿā", color: "#B677EE", icon: "hands" },
  name: { label: "Name of Allah", color: "#4F90FF", icon: "star" },
};

function GResultCard({ r, q, onClick }) {
  const m = G_META[r.type] || G_META.ayah;
  return (
    <div className="ul-link ul-press" onClick={onClick} style={{ ...gcard, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: m.color, background: `color-mix(in srgb, ${m.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${m.color} 40%, transparent)`, borderRadius: 999, padding: "3px 10px" }}>
          <Icon name={m.icon} size={13} /> {m.label}
        </span>
        <span style={{ fontSize: 12.5, color: N.gold, fontWeight: 600, flexShrink: 0 }}>{r.ref}</span>
      </div>
      {r.ar && <div className="ul-ar" style={{ fontSize: r.type === "name" ? 26 : 21, lineHeight: 1.9, textAlign: "right", color: N.fg, marginBottom: r.type === "name" ? 4 : 10 }}>{r.ar}</div>}
      <div style={{ fontSize: 15, lineHeight: 1.6, color: r.type === "name" ? N.gold : N.muted, fontWeight: r.type === "name" ? 700 : 400 }}>{gHi(r.title, q)}</div>
      {r.tr && <div style={{ fontSize: 13, fontStyle: "italic", color: N.faint, marginTop: 4 }}>{r.tr}</div>}
      {r.sub && <div style={{ fontSize: 12.5, color: N.faint, marginTop: 6 }}>{gHi(r.sub, q)}</div>}
    </div>
  );
}

function GlobalSearch({ go, openSurah, query, setQuery }) {
  const controlled = typeof query === "string";
  const [local, setLocal] = gS("");
  const q = controlled ? query : local;
  const setQ = controlled ? setQuery : setLocal;
  const [type, setType] = gS("all");
  const [recent, setRecent] = gS(() => { try { return JSON.parse(localStorage.getItem("ul.recent") || "[]"); } catch (e) { return []; } });
  const inputRef = gRef(null);
  const t = q.trim();
  const ft = gFold(t);

  gEff(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const results = gMemo(() => {
    if (ft.length < 2) return [];
    const idx = buildIndex();
    const scored = [];
    for (const it of idx) {
      const at = it.hay.indexOf(ft);
      if (at < 0) continue;
      // rank: title-start > word-start > contains; shorter titles rank higher
      const titleFold = gFold(it.title);
      let score = at === 0 ? 0 : 50;
      if (titleFold.startsWith(ft)) score -= 40;
      else if (titleFold.indexOf(ft) >= 0) score -= 15;
      if (it.type === "surah" || it.type === "name") score -= 8;
      score += Math.min(it.title.length, 60) / 20;
      scored.push({ it, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.it);
  }, [ft]);

  const filtered = type === "all" ? results : results.filter((r) => r.type === type || (type === "ayah" && r.type === "surah"));
  const counts = gMemo(() => {
    const c = { all: results.length };
    results.forEach((r) => { const k = r.type === "surah" ? "ayah" : r.type; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [results]);

  const commit = (term) => {
    const v = (term ?? t).trim(); if (v.length < 2) return;
    const next = [v, ...recent.filter((x) => x !== v)].slice(0, 6);
    setRecent(next); try { localStorage.setItem("ul.recent", JSON.stringify(next)); } catch (e) {}
  };
  const openResult = (r) => {
    commit();
    if (r.type === "surah" || r.type === "ayah") openSurah(r.surah);
    else if (r.type === "hadith") go("hadith");
    else if (r.type === "dua") go("duas");
    else if (r.type === "name") go("names");
  };

  const topics = ["mercy", "patience", "Mulk", "forgiveness", "knowledge", "Raḥmān", "guidance", "Kursī"];

  return (
    <ToolFrame title="Search" sub="One search across the Quran, Hadith, duʿās and more" glyph="🔍" onBack={() => go("hub")} maxW={820}>
      {/* search field */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, ...gcard, padding: "0 18px", height: 56, marginBottom: 14 }}>
        <Icon name="search" size={22} color={N.muted} />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit()} placeholder="Search verses, hadith, duʿās, names…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: N.fg, fontFamily: N.ui, fontSize: 17 }} />
        {q && <Icon name="close" size={18} color={N.faint} style={{ cursor: "pointer" }} onClick={() => setQ("")} />}
      </div>

      {/* type filters */}
      {t.length >= 2 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {G_TYPES.map((tp) => {
            const c = counts[tp.key] || 0;
            const on = type === tp.key;
            if (tp.key !== "all" && !c) return null;
            return (
              <button key={tp.key} className="ul-link ul-press" onClick={() => setType(tp.key)} style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${on ? N.gold : N.border}`, background: on ? N.goldSoft : N.card, color: on ? N.gold : N.muted, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: N.ui }}>
                {tp.label} {tp.key === "all" ? counts.all || 0 : c ? <span style={{ opacity: 0.7 }}>{c}</span> : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* empty state */}
      {t.length < 2 ? (
        <div className="ul-fade">
          {recent.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700 }}>Recent</span>
                <button className="ul-link" onClick={() => { setRecent([]); try { localStorage.removeItem("ul.recent"); } catch (e) {} }} style={{ background: "none", border: "none", color: N.faint, fontFamily: N.ui, fontSize: 12.5, cursor: "pointer" }}>Clear</button>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {recent.map((r) => (
                  <button key={r} className="ul-link ul-press" onClick={() => setQ(r)} style={{ ...gcard, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 15px", color: N.fg, fontFamily: N.ui, fontSize: 14, cursor: "pointer" }}>
                    <Icon name="repeat" size={14} color={N.faint} /> {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Try a topic</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 28 }}>
            {topics.map((tp) => <button key={tp} className="ul-link ul-press" onClick={() => setQ(tp)} style={{ ...gcard, padding: "10px 17px", color: N.fg, fontFamily: N.ui, fontSize: 14, cursor: "pointer" }}>{tp}</button>)}
          </div>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: N.faint, fontWeight: 700, marginBottom: 12 }}>Search across</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
            {[["Quran", "book", "hub"], ["Hadith", "globe", "hadith"], ["Duʿās", "hands", "duas"], ["99 Names", "star", "names"]].map(([lb, ic, route]) => (
              <div key={lb} className="ul-link ul-press" onClick={() => go(route)} style={{ ...gcard, padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: N.goldSoft, border: `1px solid ${N.gold}`, display: "grid", placeItems: "center", color: N.gold }}><Icon name={ic} size={19} /></div>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{lb}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ul-fade">
          <div style={{ fontSize: 13.5, color: N.muted, marginBottom: 14 }}>
            <span style={{ color: N.fg, fontWeight: 700 }}>{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""} for “<span style={{ color: N.gold }}>{t}</span>”
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {filtered.slice(0, 40).map((r, i) => <GResultCard key={i} r={r} q={t} onClick={() => openResult(r)} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 14, opacity: 0.5 }}><Khatam size={54} color={N.goldDim} sw={1.2} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Nothing found</div>
              <div style={{ fontSize: 14, color: N.muted }}>Try another word, or search a topic like “mercy” or “patience”.</div>
            </div>
          )}
        </div>
      )}
    </ToolFrame>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, { search: GlobalSearch });
