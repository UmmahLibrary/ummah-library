"use client";
import Link from "next/link";
import { N } from "@ummahlibrary/ui";
import { ToolsPrayerCard } from "../../components/ToolsPrayerCard";
import { ToolsQiblaCard } from "../../components/ToolsQiblaCard";

const TOOLS = [
  { key: "/prayer-times", label: "Prayer Times", glyph: "🕌", note: "Daily salah times" },
  { key: "/ramadan", label: "Ramadan", glyph: "🌙", note: "Suḥūr & iftār times" },
  { key: "/tracker", label: "Prayer Tracker", glyph: "📿", note: "Log & build streaks" },
  { key: "/duas", label: "Duʿās", glyph: "🤲", note: "Fortress of the Muslim" },
  { key: "/plans", label: "Reading Plans", glyph: "🗺", note: "Structured journeys" },
  { key: "/qibla", label: "Qibla", glyph: "🧭", note: "Direction to Makkah" },
  { key: "/mosques", label: "Nearby Mosques", glyph: "📍", note: "Find a place to pray" },
  { key: "/hifz", label: "Hifz Review", glyph: "✦", note: "Spaced repetition" },
  { key: "/calendar", label: "Hijri Calendar", glyph: "☾", note: "Islamic dates" },
  { key: "/names", label: "99 Names", glyph: "﷽", note: "Al-Asmāʾ al-Ḥusnā" },
  { key: "/tasbih", label: "Tasbih", glyph: "◍", note: "Dhikr counter" },
  { key: "/adhkar", label: "Adhkār", glyph: "☼", note: "Morning · Evening" },
  { key: "/zakat", label: "Zakat", glyph: "⊜", note: "2.5% calculator" },
  { key: "/hadith", label: "Hadith", glyph: "📖", note: "Search the collections" },
  { key: "/downloads", label: "Downloads", glyph: "⤓", note: "Offline reciter audio" },
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
          <ToolsQiblaCard />
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
