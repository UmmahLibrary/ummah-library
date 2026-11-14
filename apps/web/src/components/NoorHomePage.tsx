"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { JUZ_STARTS, TOTAL_JUZ } from "@ummahlibrary/core";
import { N, Khatam, Icon } from "@ummahlibrary/ui";
import { HomeToday } from "./HomeToday";
import { EasyHome } from "./EasyHome";
import { useRouter } from "next/navigation";
import { readComfort, type AppMode } from "../lib/comfort-store";
import { HomeVerseOfDay } from "./HomeVerseOfDay";
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
  /** "home": the Today screen; "quran": the full surah / juz index (Quran tab). */
  variant?: "home" | "quran";
}

const QUICK_TOOLS = [
  { label: "The Quran", href: "/quran", note: "All 114 surahs", glyph: "📖" },
  { label: "Prayer Times", href: "/prayer-times", note: "Daily ṣalāh", glyph: "🕌" },
  { label: "Hifz Review", href: "/hifz", note: "Memorise", glyph: "✦" },
  { label: "Duʿās", href: "/duas", note: "From the Quran & Sunnah", glyph: "🤲" },
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

/**
 * "Continue reading" card — resolves the reader's real last-read position from
 * the reader-prefs store and resumes at the exact āyah (`#sura:aya`, scrolled to
 * by `HashHighlighter`). Before hydration, and for first-time readers, it gently
 * falls back to opening at Al-Fātiḥah instead of a misleading fixed position.
 */
export function NoorHomePage({ surahs, variant = "home" }: Props) {
  const { query } = useSearch();
  const router = useRouter();
  // Easy mode gets its own three-tile Home; Kids mode opens the kids list.
  const [appMode, setAppMode] = useState<AppMode>("standard");
  useEffect(() => {
    const m = readComfort().mode;
    setAppMode(m);
    if (variant === "home" && m === "kids") router.replace("/kids");
  }, [variant, router]);
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
        {variant === "home" && appMode === "easy" ? (
          <EasyHome surahs={surahs} />
        ) : variant === "home" ? (
          <>
            {/* Greeting */}
            <h1
              style={{
                fontSize: "clamp(22px, 3.6vw, 26px)",
                fontWeight: 800,
                letterSpacing: -0.4,
                margin: "0 0 16px",
                fontFamily: N.ui,
              }}
            >
              As-salāmu ʿalaykum
            </h1>

            {/* One card that says what to do now, then a quiet habit strip */}
            <HomeToday surahs={surahs} />

            {/* Verse of the day — deterministic per calendar date, resolved client-side */}
            <HomeVerseOfDay
              nameOf={(num) => surahs.find((s) => s.number === num)?.transliteration ?? ""}
            />
          </>
        ) : (
          <h1
            style={{
              fontSize: "clamp(24px, 4vw, 30px)",
              fontWeight: 800,
              letterSpacing: -0.5,
              margin: "0 0 18px",
              fontFamily: N.ui,
            }}
          >
            The Quran
          </h1>
        )}

        {/* Quick tools strip (Today screen only) */}
        {variant === "home" && appMode !== "easy" && (
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
        )}

        {/* The full index lives on the Quran tab */}
        {variant === "quran" && (
          <>
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
                {surahList.length} result{surahList.length !== 1 ? "s" : ""} for &ldquo;{query}
                &rdquo;
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
                    <div
                      className="noor-ar"
                      style={{ fontSize: 22, color: N.muted, flexShrink: 0 }}
                    >
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
          </>
        )}
      </div>
    </div>
  );
}
