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
};

export default nextConfig;
