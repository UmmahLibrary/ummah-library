// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/.expo/**",
      "**/next-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Tooling / config files that run in Node (CommonJS or ESM).
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Service worker — browser + service worker globals (self, caches, clients).
    files: ["**/public/sw.js"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // Module-boundary enforcement (ADR 0001). Dependencies point inward:
    // apps may use any package; packages may never import apps; core imports
    // nothing. Every external tool is reached through an adapter.
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/dependency-nodes": ["import"],
      "boundaries/include": ["apps/**/*", "packages/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "apps/*", mode: "folder" },
        { type: "core", pattern: "packages/core", mode: "folder" },
        { type: "data", pattern: "packages/data", mode: "folder" },
        { type: "adapters", pattern: "packages/adapters", mode: "folder" },
        { type: "api", pattern: "packages/api", mode: "folder" },
        { type: "ui", pattern: "packages/ui", mode: "folder" },
      ],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Boundary violation: '${file.type}' may not import '${dependency.type}' (see docs/adr/0001-modular-monolith.md).",
          rules: [
            {
              from: { type: "app" },
              allow: { to: { type: ["app", "api", "core", "data", "adapters", "ui"] } },
            },
            { from: { type: "api" }, allow: { to: { type: ["api", "core", "data", "adapters"] } } },
            { from: { type: "data" }, allow: { to: { type: ["data", "core"] } } },
            { from: { type: "adapters" }, allow: { to: { type: ["adapters", "core"] } } },
            { from: { type: "ui" }, allow: { to: { type: ["ui", "core"] } } },
            { from: { type: "core" }, allow: { to: { type: "core" } } },
          ],
        },
      ],
    },
  },
);
