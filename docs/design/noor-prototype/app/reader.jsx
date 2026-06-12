/* Ummah Library — Interactive Surah Reader (Noor) · Pro edition.
   Reading themes (Dark/Sepia/Midnight), word-by-word, reciter picker, surah info,
   3 modes, live font scale, translation + transliteration, synced audio with active
   highlight + auto-scroll, per-ayah action sheet (copy/share/note/tafsir/memorize),
   toasts, surah navigation. Exports: Reader. */

const { useState, useRef, useEffect, useCallback } = React;

const READER_THEMES = {
  dark:     { key: "dark", label: "Dark", bg: "#0A0B0F", chrome: "#0E1017", surf: "#14171F", surfHi: "#191D27", border: "#242A38", borderSoft: "#1B2029", text: "#F4F1EA", muted: "#9AA0B2", faint: "#5C6273", soft: "rgba(230,184,85,0.12)", swatch: "#0A0B0F" },
  light:    { key: "light", label: "Light", bg: "#FBF8F1", chrome: "#F4EDDF", surf: "#FFFFFF", surfHi: "#FBF6EC", border: "#E7DECB", borderSoft: "#F0E9DA", text: "#211C12", muted: "#6E6757", faint: "#A99E86", soft: "rgba(176,132,40,0.14)", swatch: "#FFFFFF" },
  sepia:    { key: "sepia", label: "Sepia", bg: "#F3EAD8", chrome: "#EFE3CC", surf: "#EADFC6", surfHi: "#E3D5B6", border: "#D8C7A2", borderSoft: "#E2D4B4", text: "#3A2E1B", muted: "#6E5C3F", faint: "#A08A63", soft: "rgba(166,124,40,0.18)", swatch: "#EADFC6" },
  midnight: { key: "midnight", label: "Midnight", bg: "#000000", chrome: "#060608", surf: "#0C0C0F", surfHi: "#121216", border: "#1E1E24", borderSoft: "#151519", text: "#ECECEC", muted: "#8A8A92", faint: "#52525A", soft: "rgba(230,184,85,0.14)", swatch: "#000000" },
};

/* ── popover (themed) */
function Popover({ open, onClose, children, anchorStyle, T }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="ul-fade" style={{ position: "absolute", zIndex: 60, top: "calc(100% + 10px)", background: T.surfHi, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, width: 280, boxShadow: "0 20px 60px rgba(0,0,0,.5)", ...anchorStyle }}>
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, on, onClick, T }) {
  return (
    <div className="ul-link ul-press" onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.faint, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ width: 42, height: 24, borderRadius: 12, background: on ? N.gold : T.border, position: "relative", flexShrink: 0, transition: "background .18s" }}>
        <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: on ? N.ink : T.faint, transition: "left .18s" }} />
      </div>
    </div>
  );
}

/* ── ayah number badge */
function AyahNum({ n, size = 34 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <Khatam size={size} color={N.goldDim} sw={1.2} />
      <span style={{ position: "absolute", fontSize: size * 0.34, fontWeight: 700, color: N.gold }}>{n}</span>
    </div>
  );
}

/* ── per-ayah quick actions */
function AyahActions({ saved, onSave, playing, onPlay, onMore, onTafsir, T }) {
  const items = [
    { name: playing ? "pause" : "play", label: playing ? "Pause" : "Play", on: onPlay, active: playing },
    { name: "bookmark", label: saved ? "Saved" : "Save", on: onSave, active: saved },
    { name: "tafsir", label: "Tafsir", on: onTafsir },
    { name: "more", label: "More", on: onMore },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      {items.map((it) => (
        <button key={it.label} className="ul-link ul-press" onClick={it.on} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: it.active ? N.gold : T.faint, fontFamily: N.ui, fontSize: 12.5, fontWeight: 600 }}>
          <Icon name={it.name} size={15} sw={1.8} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── ayah action sheet (bottom) */
function ActionSheet({ ayah, meta, T, onClose, onToast, onSave, saved, onPlay, onTafsir }) {
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  if (!ayah) return null;
  const copy = () => {
    const txt = `${ayah.ar}\n\n“${ayah.en}”\n— ${meta.tr} ${meta.n}:${ayah.n}`;
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    onToast("Verse copied to clipboard"); onClose();
  };
  const acts = [
    { name: "play", label: "Play from here", on: () => { onPlay(ayah.n); onClose(); } },
    { name: saved ? "check" : "bookmark", label: saved ? "Saved to bookmarks" : "Bookmark", on: () => { onSave(ayah.n); onToast(saved ? "Removed bookmark" : "Saved to bookmarks"); } },
    { name: "share", label: "Share verse", on: () => { onToast("Share sheet opened"); onClose(); } },
    { name: "download", label: "Share as image", on: () => { onToast("Generating verse image…"); onClose(); } },
    { name: "star", label: "Add to memorization", on: () => { onToast("Added to Hifz queue"); onClose(); } },
    { name: "tafsir", label: "Read tafsir", on: () => onTafsir(ayah.n) },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }} className="ul-fade" />
      <div className="ul-sheet" style={{ position: "relative", width: "min(520px, 100%)", margin: 12, background: T.surfHi, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18, boxShadow: "0 -20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 14, marginBottom: 8, borderBottom: `1px solid ${T.borderSoft}` }}>
          <AyahNum n={ayah.n} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ul-ar" style={{ fontSize: 22, color: T.text, lineHeight: 1.9, textAlign: "right" }}>{ayah.ar}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{meta.tr} · {meta.n}:{ayah.n}</div>
          </div>
          <button className="ul-link ul-press" onClick={onClose} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={20} /></button>
        </div>
        {!noteOpen ? (
          <>
            <div onClick={copy} className="ul-link ul-press" style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 10px", borderRadius: 11, color: T.text }}>
              <Icon name="layers" size={18} color={N.gold} /> <span style={{ fontSize: 14.5, fontWeight: 600 }}>Copy verse</span>
            </div>
            {acts.map((a) => (
              <div key={a.label} onClick={a.on} className="ul-link ul-press" style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 10px", borderRadius: 11, color: T.text }}>
                <Icon name={a.name} size={18} color={N.gold} /> <span style={{ fontSize: 14.5, fontWeight: 600 }}>{a.label}</span>
              </div>
            ))}
            <div onClick={() => setNoteOpen(true)} className="ul-link ul-press" style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 10px", borderRadius: 11, color: T.text }}>
              <Icon name="tafsir" size={18} color={N.gold} /> <span style={{ fontSize: 14.5, fontWeight: 600 }}>Add a reflection</span>
            </div>
          </>
        ) : (
          <div className="ul-fade">
            <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write your reflection on this verse…" style={{ width: "100%", minHeight: 110, resize: "vertical", background: T.surf, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, color: T.text, fontFamily: N.ui, fontSize: 14.5, outline: "none", lineHeight: 1.6 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className="ul-link ul-press" onClick={() => setNoteOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surf, color: T.muted, fontFamily: N.ui, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button className="ul-link ul-press" onClick={() => { onToast("Reflection saved"); onClose(); }} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: N.goldGrad, color: N.ink, fontFamily: N.ui, fontWeight: 700, cursor: "pointer" }}>Save reflection</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── word-by-word block */
function WordGrid({ words, arSize, T, onWord }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", justifyContent: "flex-end", direction: "rtl" }}>
      {words.map((w, i) => (
        <div key={i} className="ul-link ul-press" onClick={() => onWord(w)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 10px", borderRadius: 10, border: `1px solid ${T.borderSoft}`, background: T.surf, minWidth: 54 }}>
          <span className="ul-ar" style={{ fontSize: arSize(26), color: T.text, lineHeight: 1.5 }}>{w.ar}</span>
          <span style={{ fontSize: 11.5, color: N.gold, fontStyle: "italic", direction: "ltr" }}>{w.tr}</span>
          <span style={{ fontSize: 12, color: T.muted, direction: "ltr", textAlign: "center" }}>{w.en}</span>
        </div>
      ))}
    </div>
  );
}

/* ── tafsīr sheet (bottom drawer, navigable verse-to-verse) */
function TafsirSheet({ surah, ayahN, ayahs, meta, T, translation, onClose, onChange }) {
  if (ayahN == null) return null;
  const idx = ayahs ? ayahs.findIndex((a) => a.n === ayahN) : -1;
  const ayah = idx >= 0 ? ayahs[idx] : null;
  const tf = window.getTafsir(meta.n, ayahN);
  const prev = idx > 0 ? ayahs[idx - 1] : null;
  const next = ayahs && idx < ayahs.length - 1 ? ayahs[idx + 1] : null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 86, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} className="ul-fade" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }} />
      <div className="ul-sheet ul-scroll" style={{ position: "relative", width: "min(600px, 100%)", maxHeight: "86%", overflowY: "auto", margin: 12, background: T.surfHi, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, boxShadow: "0 -20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Icon name="tafsir" size={20} color={N.gold} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: T.text }}>Tafsīr</div>
              <div style={{ fontSize: 12.5, color: T.faint }}>{meta.tr} · {meta.n}:{ayahN}</div>
            </div>
          </div>
          <button className="ul-link ul-press" onClick={onClose} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer" }}><Icon name="close" size={20} /></button>
        </div>

        {ayah && (
          <div style={{ background: T.surf, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: "18px 18px 16px", marginBottom: 16 }}>
            <div className="ul-ar" style={{ fontSize: 25, lineHeight: 2, textAlign: "right", color: T.text, marginBottom: 12 }}>{ayah.ar}</div>
            <div style={{ fontSize: 15, lineHeight: 1.65, color: T.muted }}>{ayah.en}</div>
          </div>
        )}

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: N.gold, background: N.goldSoft, border: `1px solid ${T.border}`, borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>
          <Khatam size={14} color={N.gold} sw={1.4} /> {tf.theme}
        </div>
        {tf.sabab && (
          <div style={{ marginBottom: 14, padding: "13px 15px", borderRadius: 12, background: T.surf, borderLeft: `3px solid ${N.gold}` }}>
            <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 5 }}>Sabab an-nuzūl · reason for revelation</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: T.muted }}>{tf.sabab}</div>
          </div>
        )}
        <p style={{ fontSize: 15.5, lineHeight: 1.75, color: T.text, margin: "0 0 18px" }}>{tf.text}</p>
        <div style={{ fontSize: 12, color: T.faint, marginBottom: 18 }}>{tf.fallback ? "Generated reflection — full classical tafsīr syncs from the library." : window.TAFSIR.source}</div>

        <div style={{ display: "flex", gap: 10, position: "sticky", bottom: -22, background: T.surfHi, paddingTop: 8, paddingBottom: 2 }}>
          <button className="ul-link ul-press" disabled={!prev} onClick={() => prev && onChange(prev.n)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surf, color: prev ? T.text : T.faint, opacity: prev ? 1 : 0.4, cursor: prev ? "pointer" : "default", fontFamily: N.ui, fontWeight: 600, fontSize: 13.5 }}><Icon name="chevL" size={16} /> Previous</button>
          <button className="ul-link ul-press" disabled={!next} onClick={() => next && onChange(next.n)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surf, color: next ? T.text : T.faint, opacity: next ? 1 : 0.4, cursor: next ? "pointer" : "default", fontFamily: N.ui, fontWeight: 600, fontSize: 13.5 }}>Next ayah <Icon name="chevR" size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ── Hifz (memorization) mode — focused verse looping with hide/peek + range */
function HifzMode({ ayahs, meta, T, reciter, arSize, onClose, onToast }) {
  const [from, setFrom] = useState(ayahs ? ayahs[0].n : 1);
  const [to, setTo] = useState(ayahs ? ayahs[Math.min(ayahs.length - 1, 4)].n : 1);
  const [cur, setCur] = useState(ayahs ? ayahs[0].n : 1);
  const [target, setTarget] = useState(5);          // reps per verse (0 = ∞)
  const [rep, setRep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [peek, setPeek] = useState(false);
  const [showTr, setShowTr] = useState(true);
  const tk = useRef(null);

  const inRange = (n) => n >= from && n <= to;
  useEffect(() => { if (!inRange(cur)) setCur(from); }, [from, to]); // eslint-disable-line
  const idx = ayahs ? ayahs.findIndex((a) => a.n === cur) : -1;
  const ayah = idx >= 0 ? ayahs[idx] : null;
  const rangeAyahs = ayahs ? ayahs.filter((a) => inRange(a.n)) : [];

  // loop engine: each ~2.6s "recitation" counts one rep; advance verse after target reps
  useEffect(() => {
    clearInterval(tk.current);
    if (playing && ayah) {
      tk.current = setInterval(() => {
        setRep((r) => {
          const nextRep = r + 1;
          if (target !== 0 && nextRep >= target) {
            // advance to next verse in range (or loop back to start)
            setCur((c) => {
              const list = rangeAyahs.map((a) => a.n);
              const at = list.indexOf(c);
              return list[(at + 1) % list.length];
            });
            return 0;
          }
          return nextRep;
        });
      }, 2600);
    }
    return () => clearInterval(tk.current);
  }, [playing, ayah, target, from, to]); // eslint-disable-line

  const reps = [3, 5, 7, 10, 0];
  const segBtn = (on) => ({ flex: 1, padding: "9px 4px", borderRadius: 9, border: `1px solid ${on ? N.gold : T.border}`, background: on ? N.goldSoft : T.surf, color: on ? N.gold : T.muted, fontFamily: N.ui, fontSize: 13.5, fontWeight: on ? 700 : 600, cursor: "pointer" });
  const reveal = hidden && !peek;

  return (
    <div className="ul-fade" style={{ position: "absolute", inset: 0, zIndex: 88, background: T.bg, color: T.text, display: "flex", flexDirection: "column" }}>
      {/* bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px clamp(16px,4vw,32px)", borderBottom: `1px solid ${T.borderSoft}`, background: T.chrome, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <Icon name="star" size={19} color={N.gold} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: -0.3, whiteSpace: "nowrap" }}>Memorize · Ḥifẓ</div>
            <div style={{ fontSize: 12, color: T.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.tr} · ayah {from}–{to}</div>
          </div>
        </div>
        <button className="ul-link ul-press" onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: T.muted, cursor: "pointer", fontFamily: N.ui, fontSize: 14 }}>Done <Icon name="close" size={18} /></button>
      </div>

      <div className="ul-scroll" style={{ flex: 1, overflowY: "auto", padding: "clamp(20px,4vw,34px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* range pickers */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            {[["From ayah", from, setFrom], ["To ayah", to, setTo]].map(([lb, val, set]) => (
              <div key={lb} style={{ flex: "1 1 140px" }}>
                <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 7 }}>{lb}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surf, border: `1px solid ${T.border}`, borderRadius: 11, padding: "6px 8px" }}>
                  <button className="ul-link ul-press" onClick={() => set((v) => Math.max(ayahs[0].n, v - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: T.surfHi, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="minus" size={15} /></button>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700 }}>{val}</span>
                  <button className="ul-link ul-press" onClick={() => set((v) => Math.min(ayahs[ayahs.length - 1].n, v + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: T.surfHi, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="plus" size={15} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* verse card */}
          <div style={{ background: T.surf, border: `1px solid ${N.gold}`, borderRadius: 18, padding: "30px 26px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: N.gold }}>Ayah {cur}</span>
              <span style={{ fontSize: 12.5, color: T.faint, fontVariantNumeric: "tabular-nums" }}>Rep {target === 0 ? rep + 1 : `${rep + (playing ? 1 : 0)} / ${target}`}</span>
            </div>
            <div onClick={() => hidden && setPeek((p) => !p)} className={hidden ? "ul-link" : ""} style={{ position: "relative", minHeight: arSize(31) * 2 }}>
              <div className="ul-ar" style={{ fontSize: arSize(32), lineHeight: 2.1, textAlign: "center", color: T.text, filter: reveal ? "blur(11px)" : "none", transition: "filter .25s", userSelect: "none" }}>{ayah ? ayah.ar : ""}</div>
              {reveal && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                  <span style={{ fontSize: 13, color: T.faint, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="eye" size={16} /> Recite from memory · tap to peek</span>
                </div>
              )}
            </div>
            {showTr && ayah && <div style={{ fontSize: 15.5, lineHeight: 1.65, color: T.muted, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}` }}>{ayah.en}</div>}
            {/* rep progress dots */}
            {target !== 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
                {Array.from({ length: target }, (_, i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i < rep ? N.gold : T.border, transition: "background .2s" }} />
                ))}
              </div>
            )}
          </div>

          {/* transport */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "22px 0" }}>
            <button className="ul-link ul-press" onClick={() => { const list = rangeAyahs.map((a) => a.n); const at = list.indexOf(cur); setCur(list[(at - 1 + list.length) % list.length]); setRep(0); }} style={{ width: 46, height: 46, borderRadius: 23, border: `1px solid ${T.border}`, background: T.surf, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="chevL" size={20} /></button>
            <button className="ul-link ul-press" onClick={() => { setPlaying((p) => !p); if (!playing) onToast(`Looping ayah ${cur}${target ? ` ·  ${target}×` : " · ∞"}`); }} style={{ width: 66, height: 66, borderRadius: 33, background: N.goldGrad, color: N.ink, border: "none", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 8px 26px rgba(230,184,85,.3)" }}><Icon name={playing ? "pause" : "play"} size={26} color={N.ink} /></button>
            <button className="ul-link ul-press" onClick={() => { const list = rangeAyahs.map((a) => a.n); const at = list.indexOf(cur); setCur(list[(at + 1) % list.length]); setRep(0); }} style={{ width: 46, height: 46, borderRadius: 23, border: `1px solid ${T.border}`, background: T.surf, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="chevR" size={20} /></button>
          </div>

          {/* repeat count */}
          <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 8 }}>Repeats per ayah</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {reps.map((r) => <button key={r} className="ul-link ul-press" onClick={() => { setTarget(r); setRep(0); }} style={segBtn(target === r)}>{r === 0 ? "∞" : r + "×"}</button>)}
          </div>

          {/* options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ToggleRow label="Hide the text" sub="Blur the verse and recite from memory — tap to peek" on={hidden} onClick={() => { setHidden((h) => !h); setPeek(false); }} T={T} />
            <ToggleRow label="Show translation" sub="Display the English meaning below" on={showTr} onClick={() => setShowTr((v) => !v)} T={T} />
          </div>

          <div style={{ marginTop: 20, padding: "13px 16px", borderRadius: 12, background: T.surf, border: `1px solid ${T.borderSoft}`, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
            <span style={{ color: N.gold, fontWeight: 700 }}>Method · </span>Listen and repeat each ayah {target === 0 ? "as many times as you need" : `${target} times`} with {reciter.split(" ")[0]}, then turn on “Hide the text” and recite from memory before moving on.
          </div>
        </div>
      </div>
    </div>
  );
}


function Reader({ surah, onBack, onNav }) {
  const meta = QURAN.surahs.find((s) => s.n === surah) || QURAN.surahs[0];
  const ayahs = QURAN.text[surah] || null;
  const words = QURAN.words[surah] || null;
  const info = QURAN.surahInfo[surah] || null;

  const [mode, setMode] = useState("verse");
  const [arScale, setArScale] = useState(() => parseFloat(localStorage.getItem("ul.arScale")) || 1);
  const [showTr, setShowTr] = useState(() => localStorage.getItem("ul.showTr") !== "0");
  const [showTl, setShowTl] = useState(() => localStorage.getItem("ul.showTl") === "1");
  const [wbw, setWbw] = useState(() => localStorage.getItem("ul.wbw") === "1");
  const [tajwid, setTajwid] = useState(() => localStorage.getItem("ul.tajwid") === "1");
  const [legendOpen, setLegendOpen] = useState(false);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("ul.rtheme") || "dark");
  const [typeOpen, setTypeOpen] = useState(false);
  const [trOpen, setTrOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [translation, setTranslation] = useState("Saheeh International");
  const [reciter, setReciter] = useState(QURAN.reciters[0].name);
  const [saved, setSaved] = useState(() => new Set());
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(0);
  const [sheet, setSheet] = useState(null);   // ayah object for action sheet
  const [tafsirAyah, setTafsirAyah] = useState(null); // ayah number for tafsīr sheet
  const [hifzOpen, setHifzOpen] = useState(false);
  const [word, setWord] = useState(null);     // tapped word
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);
  const ayahRefs = useRef({});
  const timer = useRef(null);
  const toastTimer = useRef(null);

  const T = READER_THEMES[themeKey] || READER_THEMES.dark;

  useEffect(() => { localStorage.setItem("ul.arScale", String(arScale)); }, [arScale]);
  useEffect(() => { localStorage.setItem("ul.showTr", showTr ? "1" : "0"); }, [showTr]);
  useEffect(() => { localStorage.setItem("ul.showTl", showTl ? "1" : "0"); }, [showTl]);
  useEffect(() => { localStorage.setItem("ul.wbw", wbw ? "1" : "0"); }, [wbw]);
  useEffect(() => { localStorage.setItem("ul.tajwid", tajwid ? "1" : "0"); }, [tajwid]);
  useEffect(() => { localStorage.setItem("ul.rtheme", themeKey); }, [themeKey]);
  useEffect(() => { setActive(null); setPlaying(false); setProgress(0); setSheet(null); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [surah]);

  const arSize = (base) => Math.round(base * arScale);
  const ruleInfo = (k) => { const r = TAJWID_LEGEND.find((x) => x.k === k); if (r) fireToast(`${r.en} — ${r.d}`); };
  // Arabic renderer: tajwīd-coloured span when enabled, otherwise plain text
  const AR = ({ text }) => tajwid ? <TajwidText text={text} onRule={ruleInfo} /> : text;
  const toggleSave = (n) => setSaved((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });
  const fireToast = (msg) => {
    setToast(msg); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };
  const showWord = (w) => { setWord(w); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setWord(null), 2400); };

  const scrollToAyah = useCallback((n) => {
    const el = ayahRefs.current[n], box = scrollRef.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.clientHeight * 0.32;
    box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    clearInterval(timer.current);
    if (playing && ayahs) {
      if (active == null) { setActive(ayahs[0].n); scrollToAyah(ayahs[0].n); }
      timer.current = setInterval(() => {
        setActive((cur) => {
          const idx = ayahs.findIndex((a) => a.n === cur);
          const next = ayahs[idx + 1];
          if (!next) { setPlaying(false); return cur; }
          scrollToAyah(next.n);
          return next.n;
        });
      }, 2600);
    }
    return () => clearInterval(timer.current);
  }, [playing, ayahs, scrollToAyah]); // eslint-disable-line

  const onScroll = () => {
    const box = scrollRef.current; if (!box) return;
    const max = box.scrollHeight - box.clientHeight;
    setProgress(max > 0 ? Math.min(1, box.scrollTop / max) : 0);
  };

  const playAyah = (n) => { setActive(n); setPlaying(true); scrollToAyah(n); };
  const prevSurah = meta.n > 1 ? meta.n - 1 : null;
  const nextSurah = meta.n < 114 ? meta.n + 1 : null;
  const iconBtn = (activeState) => ({ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, border: `1px solid ${activeState ? N.gold : T.border}`, background: activeState ? N.goldSoft : T.surf, color: activeState ? N.gold : T.muted, cursor: "pointer", flexShrink: 0 });

  return (
    <div style={{ width: "100%", height: "100%", background: T.bg, color: T.text, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* progress */}
      <div style={{ height: 3, background: T.borderSoft, flexShrink: 0 }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: N.goldGrad, transition: "width .1s linear" }} />
      </div>

      {/* reader bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px clamp(14px, 4vw, 40px)", borderBottom: `1px solid ${T.borderSoft}`, background: T.chrome, flexShrink: 0, position: "relative", zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button className="ul-link ul-press" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", color: T.muted, cursor: "pointer", fontFamily: N.ui, fontSize: 14, flexShrink: 0 }}>
            <Icon name="arrowL" size={18} /> <span className="ul-hide-sm">Library</span>
          </button>
          <span style={{ color: T.border }} className="ul-hide-sm">|</span>
          <button className="ul-link ul-press" onClick={() => info && setInfoOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: info ? "pointer" : "default", minWidth: 0, padding: 0, textAlign: "left" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: T.text }}>{meta.n} · {meta.tr}</div>
              <div style={{ fontSize: 12, color: T.faint, whiteSpace: "nowrap" }} className="ul-hide-sm">{meta.en} · {meta.rev} · {meta.ayahs} ayahs</div>
            </div>
            {info && <Icon name="chevD" size={15} color={T.faint} style={{ transform: infoOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* type / display panel */}
          <div style={{ position: "relative" }}>
            <button className="ul-link ul-press" onClick={() => { setTypeOpen((o) => !o); setTrOpen(false); setRecOpen(false); }} style={iconBtn(typeOpen)} title="Display settings"><Icon name="type" size={18} /></button>
            <Popover open={typeOpen} onClose={() => setTypeOpen(false)} anchorStyle={{ right: 0, width: 300 }} T={T}>
              <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 12 }}>Reading theme</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {Object.values(READER_THEMES).map((th) => (
                  <button key={th.key} className="ul-link ul-press" onClick={() => setThemeKey(th.key)} style={{ flex: 1, padding: "10px 6px 8px", borderRadius: 11, border: `1px solid ${themeKey === th.key ? N.gold : T.border}`, background: themeKey === th.key ? N.goldSoft : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 13, background: th.swatch, border: `1px solid ${T.border}` }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: themeKey === th.key ? N.gold : T.muted, fontFamily: N.ui }}>{th.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Arabic size</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <button className="ul-press ul-link" onClick={() => setArScale((s) => Math.max(0.8, +(s - 0.1).toFixed(2)))} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${T.border}`, background: T.surf, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="minus" size={16} /></button>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, position: "relative" }}><div style={{ width: `${((arScale - 0.8) / 0.9) * 100}%`, height: "100%", borderRadius: 3, background: N.gold }} /></div>
                <button className="ul-press ul-link" onClick={() => setArScale((s) => Math.min(1.7, +(s + 0.1).toFixed(2)))} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${T.border}`, background: T.surf, color: T.text, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="plus" size={16} /></button>
              </div>
              <div style={{ height: 1, background: T.borderSoft, margin: "6px 0" }} />
              <ToggleRow label="Translation" sub="Show English meaning" on={showTr} onClick={() => setShowTr((v) => !v)} T={T} />
              <ToggleRow label="Transliteration" sub="Romanized pronunciation" on={showTl} onClick={() => setShowTl((v) => !v)} T={T} />
              <ToggleRow label="Word by word" sub={words ? "Tap any word for its meaning" : "Not available for this surah"} on={wbw && !!words} onClick={() => words && setWbw((v) => !v)} T={T} />
              <ToggleRow label="Tajwīd colours" sub="Colour the rules of recitation" on={tajwid} onClick={() => setTajwid((v) => !v)} T={T} />
              {tajwid && (
                <div className="ul-fade" style={{ marginTop: 6, paddingTop: 12, borderTop: `1px solid ${T.borderSoft}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                    <span style={{ fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>Legend</span>
                    <button className="ul-link ul-press" onClick={() => { setLegendOpen(true); setTypeOpen(false); }} style={{ background: "none", border: "none", color: N.gold, fontFamily: N.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Full guide →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px" }}>
                    {TAJWID_LEGEND.slice(0, 8).map((r) => (
                      <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <span style={{ width: 11, height: 11, borderRadius: 3, background: r.c, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Popover>
          </div>

          {/* reciter */}
          <div style={{ position: "relative" }} className="ul-hide-sm">
            <button className="ul-link ul-press" onClick={() => { setRecOpen((o) => !o); setTypeOpen(false); setTrOpen(false); }} style={iconBtn(recOpen)} title="Reciter"><Icon name="headphones" size={18} /></button>
            <Popover open={recOpen} onClose={() => setRecOpen(false)} anchorStyle={{ right: 0, width: 270 }} T={T}>
              <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 10 }}>Reciter</div>
              {QURAN.reciters.map((r) => (
                <div key={r.name} className="ul-link ul-press" onClick={() => { setReciter(r.name); setRecOpen(false); fireToast(`Reciter · ${r.name.split(" ")[0]}`); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px", margin: "0 -10px", borderRadius: 9, background: r.name === reciter ? N.goldSoft : "transparent" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: r.name === reciter ? 700 : 600, color: r.name === reciter ? N.gold : T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: T.faint }}>{r.style} · {r.note}</div>
                  </div>
                  {r.name === reciter && <Icon name="check" size={15} color={N.gold} />}
                </div>
              ))}
            </Popover>
          </div>

          {/* translation */}
          <div style={{ position: "relative" }} className="ul-hide-sm">
            <button className="ul-link ul-press" onClick={() => { setTrOpen((o) => !o); setTypeOpen(false); setRecOpen(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 13px", height: 38, borderRadius: 10, border: `1px solid ${trOpen ? N.gold : T.border}`, background: trOpen ? N.goldSoft : T.surf, color: trOpen ? N.gold : T.muted, cursor: "pointer", fontFamily: N.ui, fontSize: 13.5 }}>
              <Icon name="globe" size={16} /> {translation.split(" ")[0]} <Icon name="chevD" size={14} />
            </button>
            <Popover open={trOpen} onClose={() => setTrOpen(false)} anchorStyle={{ right: 0, width: 240 }} T={T}>
              <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: T.faint, fontWeight: 700, marginBottom: 10 }}>Translation</div>
              {["Saheeh International", "Pickthall", "Yusuf Ali", "Dr. Mustafa Khattab", "Français · Hamidullah"].map((t) => (
                <div key={t} className="ul-link ul-press" onClick={() => { setTranslation(t); setTrOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", margin: "0 -10px", borderRadius: 8, background: t === translation ? N.goldSoft : "transparent", color: t === translation ? N.gold : T.muted, fontSize: 13.5, fontWeight: t === translation ? 700 : 500 }}>
                  {t}{t === translation && <Icon name="check" size={15} />}
                </div>
              ))}
            </Popover>
          </div>

          <Seg size="sm" value={mode} onChange={setMode} options={[{ value: "verse", label: "Verse" }, { value: "reading", label: "Reading" }, { value: "mushaf", label: "Mushaf" }]} />
          {/* memorize */}
          <button className="ul-link ul-press" onClick={() => ayahs && setHifzOpen(true)} style={iconBtn(false)} title="Memorize (Ḥifẓ)"><Icon name="star" size={18} /></button>
        </div>
      </div>

      {/* surah info panel */}
      {info && infoOpen && (
        <div className="ul-fade" style={{ background: T.surf, borderBottom: `1px solid ${T.borderSoft}`, flexShrink: 0, position: "relative", zIndex: 20 }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px clamp(16px,4vw,24px)" }}>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12 }}>
              {[["Revelation", meta.rev], ["Order revealed", `${info.order} of 114`], ["Verses", meta.ayahs], ["Juzʾ", meta.juz]].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>{k}</div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: T.muted, margin: 0 }}>{info.text}</p>
          </div>
        </div>
      )}

      {/* reading surface */}
      <div ref={scrollRef} onScroll={onScroll} className="ul-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ maxWidth: mode === "mushaf" ? 760 : 720, margin: "0 auto", padding: "30px clamp(16px, 5vw, 24px) 40px" }}>
          {/* surah header */}
          <div style={{ textAlign: "center", paddingBottom: 22, borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 8 }}>
            <div style={{ display: "inline-grid", placeItems: "center", position: "relative", marginBottom: 8 }}>
              <Khatam size={96} color={N.goldDim} sw={1} opacity={0.55} />
              <div className="ul-ar" style={{ position: "absolute", fontSize: 32, color: N.goldHi }}>{meta.ar}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{meta.tr}</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginTop: 3, letterSpacing: 0.4 }}>{meta.en.toUpperCase()} · {meta.rev.toUpperCase()} · {meta.ayahs} ĀYĀT</div>
          </div>

          {meta.n !== 1 && meta.n !== 9 && (
            <div className="ul-ar" style={{ textAlign: "center", fontSize: arSize(32), color: T.text, padding: "22px 0 14px" }}><AR text={QURAN.basmala} /></div>
          )}

          {!ayahs && <NoText onNav={onNav} T={T} />}

          {/* VERSE mode */}
          {ayahs && mode === "verse" && (
            <div className="ul-rise">
              {ayahs.map((a, ai) => {
                const isActive = active === a.n;
                const aw = words && words[ai];
                return (
                  <div key={a.n} ref={(el) => (ayahRefs.current[a.n] = el)} style={{ padding: "22px 16px", borderRadius: 14, marginBottom: 4, border: `1px solid ${isActive ? N.gold : "transparent"}`, background: isActive ? N.goldSoft : "transparent", transition: "background .25s, border-color .25s" }}>
                    {wbw && aw ? (
                      <div style={{ marginBottom: 8 }}><WordGrid words={aw} arSize={arSize} T={T} onWord={showWord} /></div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "flex-end" }}>
                        <div className="ul-ar" style={{ fontSize: arSize(31), lineHeight: 2.05, textAlign: "right", flex: 1, color: T.text }}><AR text={a.ar} /></div>
                        <div style={{ marginTop: 6 }}><AyahNum n={a.n} /></div>
                      </div>
                    )}
                    {showTl && <div style={{ fontSize: 14.5, fontStyle: "italic", color: N.gold, marginTop: 14, opacity: 0.9 }}>{a.tr}</div>}
                    {showTr && <div style={{ fontSize: 16.5, lineHeight: 1.7, color: T.muted, marginTop: 10 }}>{a.en}</div>}
                    <div style={{ marginTop: 16 }}>
                      <AyahActions saved={saved.has(a.n)} onSave={() => toggleSave(a.n)} playing={isActive && playing} onPlay={() => (isActive && playing ? setPlaying(false) : playAyah(a.n))} onMore={() => setSheet(a)} onTafsir={() => setTafsirAyah(a.n)} T={T} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* READING mode */}
          {ayahs && mode === "reading" && (
            <div className="ul-fade">
              <div className="ul-ar" style={{ fontSize: arSize(33), lineHeight: 2.4, textAlign: "right", padding: "14px 0", color: T.text }}>
                {ayahs.map((a) => (
                  <span key={a.n} ref={(el) => (ayahRefs.current[a.n] = el)} onClick={() => setSheet(a)} className="ul-link" style={{ background: active === a.n ? N.goldSoft : "transparent", borderRadius: 8, padding: "2px 4px", transition: "background .25s" }}>
                    <AR text={a.ar} />
                    <span style={{ display: "inline-grid", placeItems: "center", position: "relative", width: arSize(34), height: arSize(34), margin: "0 6px", verticalAlign: "middle" }}>
                      <Khatam size={arSize(34)} color={N.goldDim} sw={1.2} />
                      <span style={{ position: "absolute", fontSize: arSize(34) * 0.32, color: N.gold, fontWeight: 700, fontFamily: N.ui }}>{a.n}</span>
                    </span>{" "}
                  </span>
                ))}
              </div>
              {showTr && (
                <div style={{ marginTop: 26, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 22 }}>
                  {ayahs.map((a) => (
                    <p key={a.n} style={{ fontSize: 16, lineHeight: 1.7, color: T.muted, margin: "0 0 14px" }}>
                      <span style={{ color: N.gold, fontWeight: 700, fontSize: 13, marginRight: 8 }}>{a.n}</span>{a.en}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MUSHAF mode */}
          {ayahs && mode === "mushaf" && (
            <div className="ul-fade" style={{ background: T.surf, border: `1px solid ${T.border}`, borderRadius: 16, padding: "clamp(22px, 5vw, 44px)", marginTop: 14 }}>
              <div className="ul-ar" style={{ fontSize: arSize(34), lineHeight: 2.5, textAlign: "justify", textAlignLast: "center", color: T.text }}>
                {ayahs.map((a) => (
                  <span key={a.n} ref={(el) => (ayahRefs.current[a.n] = el)} onClick={() => setSheet(a)} className="ul-link" style={{ background: active === a.n ? N.goldSoft : "transparent", borderRadius: 6 }}>
                    <AR text={a.ar} />
                    <span style={{ display: "inline-grid", placeItems: "center", position: "relative", width: arSize(36), height: arSize(36), margin: "0 4px", verticalAlign: "middle" }}>
                      <Khatam size={arSize(36)} color={N.goldDim} sw={1.1} />
                      <span style={{ position: "absolute", fontSize: arSize(36) * 0.3, color: N.gold, fontWeight: 700, fontFamily: N.ui }}>{a.n}</span>
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 26, fontSize: 12.5, color: T.faint, letterSpacing: 1 }}>﴿ {meta.tr} ﴾</div>
            </div>
          )}

          {/* pager */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 30, paddingTop: 22, borderTop: `1px solid ${T.borderSoft}` }}>
            <button className="ul-link ul-press" disabled={!prevSurah} onClick={() => prevSurah && onNav(prevSurah)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surf, color: prevSurah ? T.text : T.faint, cursor: prevSurah ? "pointer" : "default", opacity: prevSurah ? 1 : 0.4, fontFamily: N.ui }}>
              <Icon name="chevL" size={18} />
              <div style={{ textAlign: "left", minWidth: 0 }}><div style={{ fontSize: 11, color: T.faint }}>Previous</div><div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prevSurah ? QURAN.surahs[prevSurah - 1].tr : "—"}</div></div>
            </button>
            <button className="ul-link ul-press" disabled={!nextSurah} onClick={() => nextSurah && onNav(nextSurah)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surf, color: nextSurah ? T.text : T.faint, cursor: nextSurah ? "pointer" : "default", opacity: nextSurah ? 1 : 0.4, fontFamily: N.ui }}>
              <div style={{ textAlign: "right", minWidth: 0 }}><div style={{ fontSize: 11, color: T.faint }}>Next</div><div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextSurah ? QURAN.surahs[nextSurah - 1].tr : "—"}</div></div>
              <Icon name="chevR" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* audio player */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px clamp(14px, 4vw, 40px)", borderTop: `1px solid ${T.border}`, background: T.chrome, flexShrink: 0, position: "relative", zIndex: 30 }}>
        <button className="ul-link ul-press" onClick={() => (ayahs ? (playing ? setPlaying(false) : playAyah(active || ayahs[0].n)) : null)} style={{ width: 44, height: 44, borderRadius: 22, background: N.goldGrad, color: N.ink, display: "grid", placeItems: "center", border: "none", cursor: "pointer", flexShrink: 0 }}>
          <Icon name={playing ? "pause" : "play"} size={18} color={N.ink} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.muted, marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reciter}{active ? ` · Ayah ${active}` : ""}</span>
            <span className="ul-hide-sm" style={{ flexShrink: 0, marginLeft: 10 }}>{playing ? "Now playing" : "Paused"} · 1:24 / 4:10</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: T.border }}>
            <div style={{ width: ayahs && active ? `${((ayahs.findIndex((a) => a.n === active) + 1) / ayahs.length) * 100}%` : "0%", height: "100%", borderRadius: 2, background: N.gold, transition: "width .3s" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: T.muted, flexShrink: 0 }} className="ul-hide-sm">
          <button className="ul-link ul-press" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }} title="Loop"><Icon name="repeat" size={17} /></button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>1.0×</span>
          <button className="ul-link ul-press" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }} title="Download"><Icon name="download" size={17} /></button>
        </div>
      </div>

      {/* action sheet */}
      <ActionSheet ayah={sheet} meta={meta} T={T} onClose={() => setSheet(null)} onToast={fireToast} onSave={toggleSave} saved={sheet ? saved.has(sheet.n) : false} onPlay={playAyah} onTafsir={(n) => { setSheet(null); setTafsirAyah(n); }} />

      {/* tafsīr sheet */}
      {tafsirAyah != null && <TafsirSheet surah={surah} ayahN={tafsirAyah} ayahs={ayahs} meta={meta} T={T} translation={translation} onClose={() => setTafsirAyah(null)} onChange={setTafsirAyah} />}

      {/* hifz mode */}
      {hifzOpen && ayahs && <HifzMode ayahs={ayahs} meta={meta} T={T} reciter={reciter} arSize={arSize} onClose={() => setHifzOpen(false)} onToast={fireToast} />}

      {/* tajwīd legend overlay */}
      {legendOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 85, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setLegendOpen(false)} className="ul-fade" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)" }} />
          <div className="ul-sheet ul-scroll" style={{ position: "relative", width: "min(560px, 100%)", maxHeight: "82%", overflowY: "auto", margin: 12, background: T.surfHi, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, boxShadow: "0 -20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, color: T.text }}>Tajwīd guide</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Colours mark the rules of beautiful recitation. Tap any coloured letter while reading.</div>
              </div>
              <button className="ul-link ul-press" onClick={() => setLegendOpen(false)} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
              {TAJWID_LEGEND.map((r) => (
                <div key={r.k} style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "11px 8px", borderRadius: 11, borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, background: r.c, flexShrink: 0, marginTop: 3, opacity: r.k === "silent" ? 0.5 : 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: r.k === "silent" ? T.muted : r.c }}>{r.en}</span>
                      <span className="ul-ar" style={{ fontSize: 16, color: T.muted }}>{r.ar}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.faint, marginTop: 14, lineHeight: 1.5 }}>Colouring is generated automatically to guide practice; for precise tajwīd always learn with a qualified teacher.</div>
          </div>
        </div>
      )}

      {/* word tooltip */}
      {word && (
        <div className="ul-fade" style={{ position: "absolute", left: "50%", top: 76, transform: "translateX(-50%)", zIndex: 70, background: T.surfHi, border: `1px solid ${N.gold}`, borderRadius: 14, padding: "12px 20px", textAlign: "center", boxShadow: "0 16px 40px rgba(0,0,0,.45)", pointerEvents: "none" }}>
          <div className="ul-ar" style={{ fontSize: 26, color: T.text }}>{word.ar}</div>
          <div style={{ fontSize: 13, color: N.gold, fontStyle: "italic", marginTop: 4 }}>{word.tr}</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 2 }}>{word.en}</div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="ul-toast" style={{ position: "absolute", left: "50%", bottom: 86, transform: "translateX(-50%)", zIndex: 90, background: T.surfHi, border: `1px solid ${T.border}`, color: T.text, fontSize: 13.5, fontWeight: 600, padding: "11px 20px", borderRadius: 999, boxShadow: "0 12px 36px rgba(0,0,0,.45)", display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
          <Icon name="check" size={16} color={N.gold} /> {toast}
        </div>
      )}
      <style>{`@keyframes ulSheet{from{transform:translateY(30px);opacity:.4}to{transform:none;opacity:1}} .ul-sheet{animation:ulSheet .22s cubic-bezier(.2,.7,.2,1) both} .ul-sheet .ul-link>span{white-space:nowrap} @keyframes ulToastIn{from{transform:translate(-50%,12px);opacity:0}to{transform:translate(-50%,0);opacity:1}} .ul-toast{animation:ulToastIn .2s ease both}`}</style>
    </div>
  );
}

function NoText({ onNav, T }) {
  const picks = [1, 2, 112, 113, 114, 103];
  return (
    <div className="ul-fade" style={{ textAlign: "center", padding: "40px 20px 30px" }}>
      <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 16, opacity: 0.5 }}><Khatam size={60} color={N.goldDim} sw={1.2} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: T.text }}>This surah syncs from your library</div>
      <div style={{ fontSize: 14.5, color: T.muted, maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
        In this preview the full Uthmani text is bundled for a curated set. Open one to explore the reader’s modes, word-by-word, audio sync and controls.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {picks.map((p) => (
          <button key={p} className="ul-link ul-press" onClick={() => onNav(p)} style={{ padding: "10px 18px", borderRadius: 999, border: `1px solid ${T.border}`, background: T.surf, color: T.text, cursor: "pointer", fontFamily: N.ui, fontSize: 14, fontWeight: 600 }}>
            {QURAN.surahs[p - 1].tr}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Reader });
