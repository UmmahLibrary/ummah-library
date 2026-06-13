"use client";
import Link from "next/link";
import { useState } from "react";
import { JUZ_STARTS, TOTAL_JUZ } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "./noor";
import { HomeHeroCards } from "./HomeHeroCards";
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

// Traditional names of the 30 ajzāʾ (by opening words).
const JUZ_NAMES = [
  "Alif Lām Mīm",
  "Sayaqūl",
  "Tilka r-Rusul",
  "Lan Tanālū",
  "Wa-l-Muḥṣanāt",
  "Lā Yuḥibbu llāh",
  "Wa-idhā Samiʿū",
  "Wa-law Annanā",
  "Qāla l-Malaʾ",
  "Wa-ʿlamū",
  "Yaʿtadhirūn",
  "Wa-mā min Dābbah",
  "Wa-mā Ubarriʾu",
  "Rubamā",
  "Subḥāna lladhī",
  "Qāla Alam",
  "Iqtaraba",
  "Qad Aflaḥa",
  "Wa-qāla lladhīna",
  "Aman Khalaqa",
  "Utlu Mā Ūḥiya",
  "Wa-man Yaqnut",
  "Wa-mā Liya",
  "Fa-man Aẓlam",
  "Ilayhi Yuraddu",
  "Ḥā Mīm",
  "Qāla Fa-mā Khaṭbukum",
  "Qad Samiʿa llāh",
  "Tabāraka lladhī",
  "ʿAmma",
];

/** The juzʾ a surah begins in — the largest juzʾ whose start is at or before the surah's first ayah. */
function startingJuz(surahNumber: number): number {
  let juz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    const js = JUZ_STARTS[i]!;
    if (js.sura < surahNumber || (js.sura === surahNumber && js.aya <= 1)) juz = i + 1;
    else break;
  }
  return juz;
}

function SurahCard({ s }: { s: Surah }) {
  return (
    <Link
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
          {s.number}
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
          {s.englishName} · {s.ayahCount} ayahs ·{" "}
          {s.revelationPlace === "meccan" ? "Meccan" : "Medinan"}
        </div>
      </div>
      <div className="noor-ar" style={{ fontSize: 22, color: N.muted, flexShrink: 0 }}>
        {s.name}
      </div>
    </Link>
  );
}

function GroupHeader({
  href,
  kicker,
  title,
  ar,
  note,
}: {
  href?: string;
  kicker: string;
  title: string;
  ar?: string;
  note?: string | null;
}) {
  const badge = {
    fontSize: 12,
    fontWeight: 800,
    color: N.ink,
    background: N.goldGrad,
    borderRadius: 7,
    padding: "3px 9px",
    flexShrink: 0,
    textDecoration: "none",
    fontFamily: N.ui,
  } as const;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 12px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        {href ? (
          <Link href={href} style={badge}>
            {kicker}
          </Link>
        ) : (
          <span style={badge}>{kicker}</span>
        )}
        <span
          style={{
            fontSize: 16.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
            color: N.fg,
            fontFamily: N.ui,
          }}
        >
          {title}
        </span>
        {ar && (
          <span className="noor-ar" style={{ fontSize: 19, color: N.goldHi, flexShrink: 0 }}>
            {ar}
          </span>
        )}
        {note && (
          <span
            style={{
              fontSize: 13,
              color: N.faint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              fontFamily: N.ui,
            }}
          >
            {note}
          </span>
        )}
      </div>
      <div style={{ flex: 1, height: 1, background: N.borderSoft, minWidth: 16 }} />
    </div>
  );
}

/** Juzʾ index — the 30 ajzāʾ, surahs grouped by the juzʾ they begin in, with a
 *  muted "continuation" row where a juzʾ opens mid-surah (mirrors the design). */
function JuzGroups({ surahs }: { surahs: Surah[] }) {
  const byNumber = new Map(surahs.map((s) => [s.number, s]));
  const starters = new Map<number, Surah[]>();
  for (const s of surahs) {
    const j = startingJuz(s.number);
    const arr = starters.get(j);
    if (arr) arr.push(s);
    else starters.set(j, [s]);
  }
  return (
    <div>
      {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((n) => {
        const list = starters.get(n) ?? [];
        const cont = list.length === 0 ? byNumber.get(JUZ_STARTS[n - 1]!.sura) : null;
        return (
          <div key={n}>
            <GroupHeader
              href={`/juz/${n}`}
              kicker={`Juzʾ ${n}`}
              title={JUZ_NAMES[n - 1] ?? ""}
              note={
                list.length ? `${list.length} surah${list.length > 1 ? "s" : ""} begin here` : null
              }
            />
            {cont ? (
              <Link
                href={`/surah/${cont.number}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  border: `1px dashed ${N.border}`,
                  color: N.faint,
                  textDecoration: "none",
                }}
              >
                <Icon name="arrowR" size={16} color={N.goldDim} />
                <span style={{ fontSize: 14, fontFamily: N.ui }}>
                  Continuation of{" "}
                  <span style={{ color: N.muted, fontWeight: 600 }}>{cont.transliteration}</span> ·{" "}
                  {cont.englishName}
                </span>
              </Link>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 12,
                }}
              >
                {list.map((s) => (
                  <SurahCard key={s.number} s={s} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Revelation index — surahs grouped by place of revelation (Meccan / Medinan). */
function RevGroups({ surahs }: { surahs: Surah[] }) {
  const groups = [
    {
      place: "meccan" as const,
      title: "Meccan",
      ar: "مكية",
      desc: "Revealed in Mecca — faith, tawḥīd and the hereafter",
    },
    {
      place: "medinan" as const,
      title: "Medinan",
      ar: "مدنية",
      desc: "Revealed in Medina — law, community and social life",
    },
  ];
  return (
    <div>
      {groups.map((g) => {
        const list = surahs.filter((s) => s.revelationPlace === g.place);
        return (
          <div key={g.place}>
            <GroupHeader kicker={String(list.length)} title={g.title} ar={g.ar} note={g.desc} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {list.map((s) => (
                <SurahCard key={s.number} s={s} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

  // Surahs for the Surah tab (the Juzʾ and Revelation tabs group them themselves).
  const surahList = filtered;

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

        {/* Next prayer + today's reading summary */}
        <HomeHeroCards />

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

        {q && tab === "surah" && (
          <div style={{ fontSize: 13, color: N.faint, marginBottom: 12, fontFamily: N.ui }}>
            {surahList.length} result{surahList.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Juzʾ index — grouped by the juzʾ each surah begins in */}
        {tab === "juz" && <JuzGroups surahs={surahs} />}

        {/* Revelation index — grouped by place of revelation (Meccan / Medinan) */}
        {tab === "rev" && <RevGroups surahs={surahs} />}

        {/* Surah index */}
        {tab === "surah" && (
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
                    {s.number}
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
                    {`${s.englishName} · ${s.ayahCount} ayahs · ${
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

        {tab === "surah" && surahList.length === 0 && (
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
