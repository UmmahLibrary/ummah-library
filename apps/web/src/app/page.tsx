import { TOTAL_SURAHS } from "@ummahlibrary/core";
import { quranService } from "@ummahlibrary/api";

// Server component: pulls data through api → data adapter → core port.
export default async function HomePage() {
  const surahs = await quranService.listSurahs();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Ummah Library</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Phase 0 scaffold — hello world. The Quran has {TOTAL_SURAHS} surahs.
      </p>

      <h2 style={{ fontSize: "1rem", marginTop: "2.5rem", opacity: 0.8 }}>
        Sample surahs (via @ummahlibrary/api)
      </h2>
      <ul style={{ lineHeight: 1.9, paddingLeft: "1.2rem" }}>
        {surahs.map((surah) => (
          <li key={surah.number}>
            <strong>{surah.number}</strong> · {surah.name}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "3rem", fontSize: "0.85rem", opacity: 0.5 }}>
        Sadaqah Jariyah · AGPL-3.0
      </p>
    </main>
  );
}
