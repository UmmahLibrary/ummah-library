import { TOTAL_SURAHS } from "@ummahlibrary/core";
import { quranRepository } from "@ummahlibrary/api";

// Server component: pulls data through api → data adapter → core port.
export default async function HomePage() {
  const surahs = await quranRepository.listSurahs();

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Ummah Library</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Phase 1 — the {TOTAL_SURAHS} surahs, served through api → data → core.
      </p>

      <ol style={{ lineHeight: 1.8, paddingLeft: "2.2rem", marginTop: "2.5rem" }}>
        {surahs.map((surah) => (
          <li key={surah.number} style={{ marginBottom: "0.15rem" }}>
            <span dir="rtl" style={{ fontSize: "1.15rem" }}>
              {surah.name}
            </span>{" "}
            <span style={{ opacity: 0.85 }}>{surah.transliteration}</span>{" "}
            <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>
              · {surah.englishName} · {surah.ayahCount} āyāt · {surah.revelationPlace}
            </span>
          </li>
        ))}
      </ol>

      <p style={{ marginTop: "3rem", fontSize: "0.85rem", opacity: 0.5 }}>
        Sadaqah Jariyah · AGPL-3.0
      </p>
    </main>
  );
}
