"use client";
import Link from "next/link";
import { useState } from "react";
import { JUZ_STARTS, TOTAL_JUZ } from "@ummahlibrary/core";
import { N, Khatam } from "./noor";
import { useSearch } from "./shell/SearchContext";

interface Surah {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
  revelationPlace: "meccan" | "medinan";
  revelationOrder: number;
}

interface Props {
  surahs: Surah[];
}

const QUICK_TOOLS = [
  { label: "Prayer Times", href: "/prayer-times", note: "Daily ṣalāh", glyph: "🕌" },
  { label: "Qibla", href: "/qibla", note: "Direction to Makkah", glyph: "🧭" },
  { label: "Hifz Review", href: "/hifz", note: "Spaced repetition", glyph: "✦" },
  { label: "Hijri Calendar", href: "/calendar", note: "Islamic dates", glyph: "☾" },
];

export function NoorHomePage({ surahs }: Props) {
  const { query } = useSearch();
  const [tab, setTab] = useState<"surah" | "juz" | "rev">("surah");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? surahs.filter(
        (s) =>
          s.transliteration.toLowerCase().includes(q) ||
          s.englishName.toLowerCase().includes(q) ||
          String(s.number) === q ||
          s.name.includes(query),
      )
    : surahs;

  // Surah list for the active tab: natural order, or by order of revelation.
  const surahList =
    tab === "rev" ? [...filtered].sort((a, b) => a.revelationOrder - b.revelationOrder) : filtered;

  // Juzʾ index — each juzʾ spans one or more surahs (mirrors /juz).
  const byNumber = new Map(surahs.map((s) => [s.number, s]));
  const juzEndSura = (n: number): number => {
    if (n >= TOTAL_JUZ) return 114;
    const next = JUZ_STARTS[n]!;
    return next.aya > 1 ? next.sura : next.sura - 1;
  };
  const juzList = JUZ_STARTS.map((start, i) => {
    const n = i + 1;
    const first = byNumber.get(start.sura);
    const lastSura = juzEndSura(n);
    const last = byNumber.get(lastSura);
    const span =
      lastSura === start.sura
        ? (first?.transliteration ?? "")
        : `${first?.transliteration ?? ""} – ${last?.transliteration ?? ""}`;
    return { n, span, name: first?.name ?? "" };
  });

  return (
    <div
      className="noor-scroll"
      style={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 520,
          height: 460,
          background: "radial-gradient(ellipse, var(--noor-gold-soft), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="noor-rise"
        style={{
          position: "relative",
          maxWidth: 1080,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 34px) clamp(16px, 4vw, 36px) 40px",
        }}
      >
        {/* Greeting */}
        <div style={{ fontSize: 14, color: N.muted, marginBottom: 3, fontFamily: N.ui }}>
          As-salāmu ʿalaykum 🌙
        </div>
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 28px)",
            fontWeight: 800,
            letterSpacing: -0.6,
            margin: "0 0 22px",
            fontFamily: N.ui,
          }}
        >
          Welcome back.
        </h1>

        {/* Continue reading card */}
        <Link
          href="/surah/2"
          style={{
            display: "block",
            borderRadius: 16,
            padding: 24,
            background: `linear-gradient(135deg, ${N.cardHi}, ${N.card})`,
            border: `1px solid ${N.border}`,
            position: "relative",
            overflow: "hidden",
            textDecoration: "none",
            marginBottom: 16,
            transition: "border-color .15s",
          }}
        >
          <div
            aria-hidden="true"
            style={{ position: "absolute", right: -30, top: -30, pointerEvents: "none" }}
          >
            <Khatam size={150} color={N.gold} sw={1.2} opacity={0.1} />
          </div>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: N.faint,
              fontWeight: 700,
              marginBottom: 12,
              fontFamily: N.ui,
            }}
          >
            Continue reading
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "clamp(20px,3vw,25px)",
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: N.fg,
                  fontFamily: N.ui,
                }}
              >
                Al-Baqarah
              </div>
              <div style={{ fontSize: 14, color: N.muted, marginTop: 3, fontFamily: N.ui }}>
                Ayah 153 · The Cow · Juzʾ 2
              </div>
            </div>
            <div className="noor-ar" style={{ fontSize: 40, color: N.goldHi }}>
              البقرة
            </div>
          </div>
          <div
            style={{
              marginTop: 18,
              height: 6,
              borderRadius: 3,
              background: N.bg,
              overflow: "hidden",
            }}
          >
            <div style={{ width: "54%", height: "100%", background: N.goldGrad }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 12.5,
              color: N.faint,
              fontFamily: N.ui,
            }}
          >
            <span>54% through the surah</span>
            <span style={{ color: N.gold, fontWeight: 600 }}>Resume →</span>
          </div>
        </Link>

        {/* Verse of the day */}
        <div
          style={{
            borderRadius: 16,
            padding: "22px 26px",
            background: N.card,
            border: `1px solid ${N.border}`,
            marginBottom: 16,
            display: "flex",
            gap: 28,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            className="noor-ar"
            style={{ flex: "1 1 280px", fontSize: 28, lineHeight: 2.1, color: N.fg }}
          >
            ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ
            تَطْمَئِنُّ ٱلْقُلُوبُ
          </div>
          <div style={{ flex: "1 1 260px" }}>
            <div
              style={{
                fontSize: 11.5,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: N.gold,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: N.ui,
              }}
            >
              Verse of the day
            </div>
            <div style={{ fontSize: 15.5, lineHeight: 1.65, color: N.muted, fontFamily: N.ui }}>
              Those who believe and whose hearts find rest in the remembrance of Allah. Verily, in
              the remembrance of Allah do hearts find rest.
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: N.gold,
                marginTop: 10,
                fontWeight: 600,
                fontFamily: N.ui,
              }}
            >
              Ar-Raʿd 13:28
            </div>
          </div>
        </div>

        {/* Quick tools strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {QUICK_TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 14,
                background: N.card,
                border: `1px solid ${N.border}`,
                textDecoration: "none",
                transition: "border-color .15s",
              }}
            >
              <div style={{ fontSize: 22 }}>{t.glyph}</div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    color: N.fg,
                    fontFamily: N.ui,
                  }}
                >
                  {t.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: N.faint,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: N.ui,
                  }}
                >
                  {t.note}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Surah index header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: N.ui }}>The Quran</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                ["surah", "Surah"],
                ["juz", "Juzʾ"],
                ["rev", "Revelation"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: `1px solid ${tab === v ? N.gold : N.border}`,
                  background: tab === v ? N.goldSoft : "transparent",
                  color: tab === v ? N.gold : N.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: N.ui,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {q && tab !== "juz" && (
          <div style={{ fontSize: 13, color: N.faint, marginBottom: 12, fontFamily: N.ui }}>
            {surahList.length} result{surahList.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Juzʾ grid */}
        {tab === "juz" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {juzList.map((j) => (
              <Link
                key={j.n}
                href={`/juz/${j.n}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: N.card,
                  border: `1px solid ${N.border}`,
                  textDecoration: "none",
                  transition: "border-color .15s, transform .12s",
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Khatam size={40} color={N.goldDim} sw={1.2} />
                  <span
                    style={{
                      position: "absolute",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: N.gold,
                      fontFamily: N.ui,
                    }}
                  >
                    {j.n}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: N.fg,
                      fontFamily: N.ui,
                    }}
                  >
                    Juzʾ {j.n}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: N.faint,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: N.ui,
                    }}
                  >
                    {j.span}
                  </div>
                </div>
                <div className="noor-ar" style={{ fontSize: 22, color: N.muted, flexShrink: 0 }}>
                  {j.name}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Surah grid (Surah order, or order of revelation) */}
        {tab !== "juz" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {surahList.map((s) => (
              <Link
                key={s.number}
                href={`/surah/${s.number}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: N.card,
                  border: `1px solid ${N.border}`,
                  textDecoration: "none",
                  transition: "border-color .15s, transform .12s",
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Khatam size={40} color={N.goldDim} sw={1.2} />
                  <span
                    style={{
                      position: "absolute",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: N.gold,
                      fontFamily: N.ui,
                    }}
                  >
                    {tab === "rev" ? s.revelationOrder : s.number}
                  </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: N.fg,
                      fontFamily: N.ui,
                    }}
                  >
                    {s.transliteration}
                  </div>
                  <div style={{ fontSize: 12.5, color: N.faint, fontFamily: N.ui }}>
                    {tab === "rev"
                      ? `Revealed #${s.revelationOrder} · ${s.englishName}`
                      : `${s.englishName} · ${s.ayahCount} ayahs · ${
                          s.revelationPlace === "meccan" ? "Meccan" : "Medinan"
                        }`}
                  </div>
                </div>
                <div className="noor-ar" style={{ fontSize: 22, color: N.muted, flexShrink: 0 }}>
                  {s.name}
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab !== "juz" && surahList.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: N.faint,
              padding: 40,
              fontFamily: N.ui,
            }}
          >
            No surah matches &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
