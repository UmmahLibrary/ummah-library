import type { MetadataRoute } from "next";
import { PLAN_TEMPLATES, TOTAL_JUZ, TOTAL_PAGES_MADANI, TOTAL_SURAHS } from "@ummahlibrary/core";
import { getPublishedArticles } from "../lib/blog/articles";
import { SITE_URL } from "../lib/site";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    // The five places (ADR 0043) and their public pages.
    "/quran",
    "/prayer",
    "/learn",
    "/tools",
    "/search",
    "/goals",
    "/collections",
    "/juz",
    "/hadith",
    "/tafsir",
    "/duas",
    "/plans",
    "/ramadan",
    "/kids",
    "/adhkar",
    "/tasbih",
    "/names",
    "/hifz",
    "/prayer-times",
    "/qibla",
    "/mosques",
    "/calendar",
    "/zakat",
    "/settings",
    "/blog",
    "/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  // Only published articles get a sitemap entry — an unpublished draft has no
  // route to list (see ADR 0037).
  const blogPosts = getPublishedArticles().map((a) => ({
    url: `${BASE}/blog/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const plans = PLAN_TEMPLATES.map((t) => ({
    url: `${BASE}/plans/${t.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
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

  const pages = Array.from({ length: TOTAL_PAGES_MADANI }, (_, i) => ({
    url: `${BASE}/page/${i + 1}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...blogPosts, ...plans, ...surahs, ...juz, ...pages];
}
