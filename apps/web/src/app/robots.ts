import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

const BASE = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
