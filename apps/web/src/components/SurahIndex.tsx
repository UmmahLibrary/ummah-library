"use client";

import { useState } from "react";
import Link from "next/link";

interface SurahCard {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
}

export function SurahIndex({ surahs }: { surahs: SurahCard[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? surahs.filter(
        (s) =>
          String(s.number).startsWith(q) ||
          s.transliteration.toLowerCase().includes(q) ||
          s.englishName.toLowerCase().includes(q),
      )
    : surahs;

  return (
    <>
      <input
        type="search"
        className="surah-search"
        placeholder="Search surahs by name or number…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search surahs"
      />
      {filtered.length === 0 ? (
        <p className="hifz-muted">No surahs match “{query}”.</p>
      ) : (
        <nav className="surah-grid">
          {filtered.map((surah) => (
            <Link key={surah.number} href={`/surah/${surah.number}`} className="surah-card">
              <span className="surah-num">{surah.number}</span>
              <span className="meta">
                <span className="name-en">{surah.transliteration}</span>
                <br />
                <span className="sub">
                  {surah.englishName} · {surah.ayahCount} āyāt
                </span>
              </span>
              <span className="name-ar arabic">{surah.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
