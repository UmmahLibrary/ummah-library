import type { MetadataRoute } from "next";
import { TOTAL_JUZ, TOTAL_SURAHS } from "@ummahlibrary/core";

const BASE = "https://app.ummahlibrary.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/search", "/juz", "/hadith", "/hifz"].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const surahs = Array.from({ length: TOTAL_SURAHS }, (_, i) => ({
    url: `${BASE}/surah/${i + 1}`,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const juz = Array.from({ length: TOTAL_JUZ }, (_, i) => ({
    url: `${BASE}/juz/${i + 1}`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...surahs, ...juz];
}
