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
  // tRPC function so it can read them at runtime.
  outputFileTracingRoot: join(import.meta.dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/trpc/[trpc]": ["../../packages/data/datasets/**/*"],
  },
};

export default nextConfig;
