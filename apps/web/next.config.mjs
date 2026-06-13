import { join } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the workspace packages directly from their TypeScript source.
  transpilePackages: [
    "@ummahlibrary/core",
    "@ummahlibrary/api",
    "@ummahlibrary/data",
    "@ummahlibrary/ui",
  ],
  // Trace from the monorepo root and ship the Quran datasets with the dynamic
  // functions that read them at runtime.
  outputFileTracingRoot: join(import.meta.dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/trpc/[trpc]": ["../../packages/data/datasets/**/*"],
    "/api/v1/surahs/[number]/ayahs/[aya]": ["../../packages/data/datasets/**/*"],
    // The hadith section route reads the ingested collections at runtime (ADR 0022).
    "/api/v1/hadith/[collection]/sections/[section]": [
      "../../packages/data/datasets/hadiths/**/*",
    ],
  },
};

export default nextConfig;
