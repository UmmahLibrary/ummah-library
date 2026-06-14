"use client";
import Link from "next/link";
import { N } from "@ummahlibrary/ui";
import { ToolsPrayerCard } from "../../components/ToolsPrayerCard";

const TOOLS = [
  { key: "/prayer-times", label: "Prayer Times", glyph: "🕌", note: "Daily salah times" },
  { key: "/tracker", label: "Prayer Tracker", glyph: "📿", note: "Log & build streaks" },
  { key: "/qibla", label: "Qibla", glyph: "🧭", note: "118° SE · Direction to Makkah" },
  { key: "/hifz", label: "Hifz Review", glyph: "✦", note: "Spaced repetition" },
  { key: "/calendar", label: "Hijri Calendar", glyph: "☾", note: "Islamic dates" },
  { key: "/names", label: "99 Names", glyph: "﷽", note: "Al-Asmāʾ al-Ḥusnā" },
  { key: "/tasbih", label: "Tasbih", glyph: "◍", note: "Dhikr counter" },
  { key: "/adhkar", label: "Adhkār", glyph: "☼", note: "Morning · Evening" },
  { key: "/zakat", label: "Zakat", glyph: "⊜", note: "2.5% calculator" },
];

export default function ToolsPage() {
  return (
    <div
      className="noor-scroll"
      style={{ height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}
    >
      <div
        className="noor-rise"
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 34px) clamp(16px, 4vw, 36px) 60px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 28px)",
            fontWeight: 800,
            letterSpacing: -0.6,
            margin: "0 0 4px",
            fontFamily: N.ui,
          }}
        >
          Worship &amp; Tools
        </h1>
        <div style={{ fontSize: 14, color: N.muted, marginBottom: 24, fontFamily: N.ui }}>
          Everything for your day, in one place.
        </div>

        {/* Featured cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Prayer times featured */}
          <ToolsPrayerCard />

          {/* Qibla featured */}
          <Link
            href="/qibla"
            style={{
              borderRadius: 18,
              padding: 24,
              background: N.card,
              border: `1px solid ${N.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            {/* Compass decoration */}
            <div style={{ position: "relative", width: 150, height: 150, marginBottom: 16 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${N.border}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 14,
                  borderRadius: "50%",
                  border: `1px dashed ${N.borderSoft}`,
                }}
              />
              {(["N", "E", "S", "W"] as const).map((d, i) => (
                <span
                  key={d}
                  style={{
                    position: "absolute",
                    fontSize: 11,
                    color: N.faint,
                    top: i === 0 ? 6 : i === 2 ? "auto" : "50%",
                    bottom: i === 2 ? 6 : "auto",
                    left: i === 3 ? 8 : i === 1 ? "auto" : "50%",
                    right: i === 1 ? 8 : "auto",
                    transform: i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)",
                  }}
                >
                  {d}
                </span>
              ))}
              {/* Needle */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 4,
                  height: 56,
                  background: N.goldGrad,
                  borderRadius: 2,
                  transformOrigin: "bottom center",
                  transform: "translate(-50%, -100%) rotate(118deg)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: N.gold,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
              Qibla · 118° SE
            </div>
            <div style={{ fontSize: 13, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
              Direction to the Kaʿbah
            </div>
          </Link>
        </div>

        {/* All tools grid */}
        <div style={{ fontSize: 16, fontWeight: 700, margin: "10px 0 14px", fontFamily: N.ui }}>
          All tools
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {TOOLS.map((t) => (
            <Link
              key={t.key}
              href={t.key}
              style={{
                padding: "18px 16px",
                borderRadius: 14,
                background: N.card,
                border: `1px solid ${N.border}`,
                textDecoration: "none",
                transition: "border-color .15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{t.glyph}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                {t.label}
              </div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, fontFamily: N.ui }}>
                {t.note}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
