/* Ummah Library — first-run onboarding (Noor). Exports: Onboarding. */
const { useState: obS } = React;

function Onboarding({ onDone }) {
  const [step, setStep] = obS(0);
  const [goal, setGoal] = obS(20);
  const [reciter, setReciter] = obS(0);
  const [translation, setTranslation] = obS(0);

  const slides = [
    {
      kind: "hero",
      title: "Welcome to\nUmmah Library",
      body: "Read, listen, memorize and reflect on the Qurʾān — with a complete suite of worship tools. All free, private, and on your device.",
    },
    {
      kind: "translation",
      eyebrow: "Choose your translation",
      title: "Read in your language",
      body: "You can change this any time, and add more from 98 languages.",
    },
    {
      kind: "reciter",
      eyebrow: "Pick a reciter",
      title: "Listen and follow along",
      body: "Audio highlights each verse as it’s recited. Swap reciters whenever you like.",
    },
    {
      kind: "goal",
      eyebrow: "Set a daily habit",
      title: "A little, every day",
      body: "We’ll gently remind you and keep your streak. Most readers start with 20 minutes.",
    },
  ];
  const s = slides[step];
  const last = step === slides.length - 1;
  const translations = ["Saheeh International", "Dr. Mustafa Khattab — The Clear Quran", "Pickthall", "Yusuf Ali", "Français — Hamidullah"];

  const field =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23E6B855' stroke-width='0.6' opacity='0.07'%3E%3Crect x='28' y='28' width='24' height='24'/%3E%3Crect x='28' y='28' width='24' height='24' transform='rotate(45 40 40)'/%3E%3C/g%3E%3C/svg%3E\")";

  return (
    <div style={{ width: "100%", height: "100%", background: N.bg, color: N.fg, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: field, opacity: 0.6, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -280, left: "50%", transform: "translateX(-50%)", width: "min(820px,120vw)", height: 640, background: "radial-gradient(ellipse at center, rgba(230,184,85,0.16), transparent 62%)", pointerEvents: "none" }} />

      {/* top bar: progress + skip */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px clamp(20px,5vw,40px)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width: i === step ? 26 : 8, height: 8, borderRadius: 4, background: i === step ? N.gold : N.border, transition: "all .25s" }} />
          ))}
        </div>
        <button className="ul-link ul-press" onClick={onDone} style={{ background: "none", border: "none", color: N.faint, fontFamily: N.ui, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Skip</button>
      </div>

      {/* body */}
      <div className="ul-scroll" style={{ position: "relative", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px clamp(20px,5vw,40px) 20px", textAlign: "center" }}>
        <div key={step} className="ul-rise" style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {s.kind === "hero" && (
            <div style={{ display: "inline-grid", placeItems: "center", position: "relative", marginBottom: 30 }}>
              <Khatam size={150} color={N.gold} sw={1.4} opacity={0.9} />
              <div className="ul-ar" style={{ position: "absolute", fontSize: 30, color: N.goldHi }}>ﷺ</div>
            </div>
          )}
          {s.eyebrow && <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: N.gold, fontWeight: 700, marginBottom: 14 }}>{s.eyebrow}</div>}
          <h1 style={{ fontSize: "clamp(30px,5.5vw,44px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: -1.2, margin: "0 0 16px", whiteSpace: "pre-line", width: "100%" }}>{s.title}</h1>
          <p style={{ fontSize: "clamp(15px,2.4vw,17px)", lineHeight: 1.6, color: N.muted, width: "100%", maxWidth: 440, margin: "0 0 28px" }}>{s.body}</p>

          {s.kind === "translation" && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {translations.map((t, i) => (
                <button key={t} className="ul-link ul-press" onClick={() => setTranslation(i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "15px 18px", borderRadius: 13, border: `1px solid ${translation === i ? N.gold : N.border}`, background: translation === i ? N.goldSoft : N.card, cursor: "pointer", fontFamily: N.ui, textAlign: "left" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: translation === i ? N.gold : N.fg }}>{t}</span>
                  {translation === i ? <Icon name="check" size={18} color={N.gold} /> : <span style={{ width: 18, height: 18, borderRadius: 9, border: `1px solid ${N.border}` }} />}
                </button>
              ))}
            </div>
          )}

          {s.kind === "reciter" && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {QURAN.reciters.slice(0, 5).map((r, i) => (
                <button key={r.name} className="ul-link ul-press" onClick={() => setReciter(i)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 13, border: `1px solid ${reciter === i ? N.gold : N.border}`, background: reciter === i ? N.goldSoft : N.card, cursor: "pointer", fontFamily: N.ui, textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: reciter === i ? N.goldGrad : N.cardHi, border: `1px solid ${N.border}`, display: "grid", placeItems: "center", flexShrink: 0, color: reciter === i ? N.ink : N.muted }}><Icon name={reciter === i ? "pause" : "play"} size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: reciter === i ? N.gold : N.fg }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: N.faint }}>{r.style} · {r.note}</div>
                  </div>
                  {reciter === i && <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18 }}>{[8, 14, 6, 12].map((h, j) => <span key={j} style={{ width: 3, height: h, background: N.gold, borderRadius: 2 }} />)}</div>}
                </button>
              ))}
            </div>
          )}

          {s.kind === "goal" && (
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: N.gold, letterSpacing: -2 }}>{goal}<span style={{ fontSize: 22, color: N.muted, fontWeight: 600, letterSpacing: 0 }}> min / day</span></div>
              <input type="range" min="5" max="60" step="5" value={goal} onChange={(e) => setGoal(+e.target.value)} style={{ width: "100%", accentColor: N.gold, margin: "18px 0 8px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: N.faint, marginBottom: 18 }}><span>5 min</span><span>60 min</span></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {[10, 20, 30, 45].map((g) => (
                  <button key={g} className="ul-link ul-press" onClick={() => setGoal(g)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${goal === g ? N.gold : N.border}`, background: goal === g ? N.goldSoft : N.card, color: goal === g ? N.gold : N.muted, fontFamily: N.ui, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{g} min</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{ position: "relative", padding: "18px clamp(20px,5vw,40px) calc(20px + env(safe-area-inset-bottom,0px))", flexShrink: 0, display: "flex", gap: 12, alignItems: "center", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {step > 0 && (
          <button className="ul-link ul-press" onClick={() => setStep((x) => x - 1)} style={{ width: 52, height: 52, borderRadius: 14, border: `1px solid ${N.border}`, background: N.card, color: N.fg, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="arrowL" size={20} /></button>
        )}
        <button className="ul-link ul-press" onClick={() => (last ? onDone() : setStep((x) => x + 1))} style={{ flex: 1, height: 52, borderRadius: 14, border: "none", background: N.goldGrad, color: N.ink, fontFamily: N.ui, fontWeight: 700, fontSize: 16, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          {last ? "Begin reading" : "Continue"} <Icon name="arrowR" size={19} color={N.ink} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding });
