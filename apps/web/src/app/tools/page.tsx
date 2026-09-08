"use client";
import Link from "next/link";
import { N } from "@ummahlibrary/ui";
import { ToolsPrayerCard } from "../../components/ToolsPrayerCard";
import { ToolsQiblaCard } from "../../components/ToolsQiblaCard";
import { useT } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";

// Label and note resolve through i18n (#208); the glyph and href are content.
const TOOLS: Array<{ key: string; labelKey: MessageKey; glyph: string; noteKey: MessageKey }> = [
  {
    key: "/prayer-times",
    labelKey: "nav.prayerTimes",
    glyph: "🕌",
    noteKey: "tools.note.prayerTimes",
  },
  { key: "/ramadan", labelKey: "nav.ramadan", glyph: "🌙", noteKey: "tools.note.ramadan" },
  { key: "/tracker", labelKey: "nav.tracker", glyph: "📿", noteKey: "tools.note.tracker" },
  { key: "/duas", labelKey: "nav.duas", glyph: "🤲", noteKey: "tools.note.duas" },
  { key: "/plans", labelKey: "nav.plans", glyph: "🗺", noteKey: "tools.note.plans" },
  { key: "/qibla", labelKey: "nav.qibla", glyph: "🧭", noteKey: "tools.note.qibla" },
  { key: "/mosques", labelKey: "nav.mosques", glyph: "📍", noteKey: "tools.note.mosques" },
  { key: "/hifz", labelKey: "nav.hifz", glyph: "✦", noteKey: "tools.note.hifz" },
  { key: "/calendar", labelKey: "nav.calendar", glyph: "☾", noteKey: "tools.note.calendar" },
  { key: "/names", labelKey: "nav.names", glyph: "﷽", noteKey: "tools.note.names" },
  { key: "/tasbih", labelKey: "nav.tasbih", glyph: "◍", noteKey: "tools.note.tasbih" },
  { key: "/adhkar", labelKey: "nav.adhkar", glyph: "☼", noteKey: "tools.note.adhkar" },
  { key: "/zakat", labelKey: "nav.zakat", glyph: "⊜", noteKey: "tools.note.zakat" },
  { key: "/hadith", labelKey: "nav.hadith", glyph: "📖", noteKey: "tools.note.hadith" },
  { key: "/downloads", labelKey: "nav.downloads", glyph: "⤓", noteKey: "tools.note.downloads" },
];

export default function ToolsPage() {
  const t = useT();
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
          {t("tools.title")}
        </h1>
        <div style={{ fontSize: 14, color: N.muted, marginBottom: 24, fontFamily: N.ui }}>
          {t("tools.subtitle")}
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
          {t("tools.all")}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {TOOLS.map((tool) => (
            <Link
              key={tool.key}
              href={tool.key}
              style={{
                padding: "18px 16px",
                borderRadius: 14,
                background: N.card,
                border: `1px solid ${N.border}`,
                textDecoration: "none",
                transition: "border-color .15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{tool.glyph}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                {t(tool.labelKey)}
              </div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, fontFamily: N.ui }}>
                {t(tool.noteKey)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
