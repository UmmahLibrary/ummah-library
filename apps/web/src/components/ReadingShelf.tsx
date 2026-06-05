"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SurahRef {
  number: number;
  transliteration: string;
  englishName: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Client-only "continue reading" + bookmarks, backed by localStorage. */
export function ReadingShelf({ surahs }: { surahs: SurahRef[] }) {
  const [lastRead, setLastRead] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLastRead(read<{ surah: number } | null>("ul.lastRead", null)?.surah ?? null);
    setBookmarks(read<number[]>("ul.bookmarks", []));
    setReady(true);
  }, []);

  if (!ready || (lastRead === null && bookmarks.length === 0)) return null;

  const byNumber = new Map(surahs.map((s) => [s.number, s]));
  const last = lastRead !== null ? byNumber.get(lastRead) : undefined;

  return (
    <section className="shelf">
      {last && (
        <Link href={`/surah/${last.number}`} className="shelf-continue">
          <span className="shelf-label">Continue reading</span>
          <span className="shelf-surah">
            {last.transliteration} · {last.englishName}
          </span>
        </Link>
      )}
      {bookmarks.length > 0 && (
        <div className="shelf-bookmarks">
          <span className="shelf-label">Bookmarks</span>
          <div className="shelf-chips">
            {bookmarks.map((n) => {
              const s = byNumber.get(n);
              return s ? (
                <Link key={n} href={`/surah/${n}`} className="chip">
                  {s.transliteration}
                </Link>
              ) : null;
            })}
          </div>
        </div>
      )}
    </section>
  );
}
