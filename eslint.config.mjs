// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
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
      // Vendored design-reference snapshot — not maintained to our lint rules.
      "docs/design/**",
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
    rules: {
      // CommonJS config files (metro.config.js, babel.config.js) use require().
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // React/React Native hook rules (rules-of-hooks as an error; exhaustive-deps
    // as a warning, matching the plugin's own recommended severities) — this is
    // what the `react-hooks/exhaustive-deps` disable comments in the codebase
    // are actually suppressing, so the rule needs to be registered for those
    // comments to reference a real rule instead of erroring as unknown.
    files: ["**/*.{tsx,jsx}"],
    ...reactHooks.configs["recommended-latest"],
  },
  {
    // Service worker — browser + service worker globals (self, caches, clients).
    files: ["**/public/sw.js"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },
  {
    // Playwright preview helpers (apps/*/scripts/shot.mjs) drive the web build:
    // their addInitScript/evaluate callbacks run in the browser, so they touch
    // localStorage, document, getComputedStyle, etc.
    files: ["apps/*/scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
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
  {
    // Check A — core purity (ADR 0001 rules #1 & #3). `core` is pure and
    // deterministic: no platform globals, no I/O, no nondeterminism, no Node
    // built-ins. The clock is injected (see hifz.ts), so a bare `new Date()`
    // *default parameter* stays allowed; `Date.now()`/`Math.random()` do not.
    // boundaries already blocks workspace imports from core — this closes the
    // global/builtin holes it can't see.
    files: ["packages/core/src/**/*.ts"],
    ignores: ["packages/core/src/**/*.test.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
          "fetch",
          "XMLHttpRequest",
          "indexedDB",
          "caches",
          "process",
        ].map((name) => ({
          name,
          message:
            "core is pure (ADR 0001 #1/#3): no platform access — put it behind a port in core/src/ports.ts and implement it in an adapter.",
        })),
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "core is deterministic (ADR 0001 #3) — inject the clock (see hifz.ts), don't read wall-clock time.",
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "core is deterministic (ADR 0001 #3) — inject randomness, don't call Math.random().",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "node:*",
                "fs",
                "path",
                "os",
                "crypto",
                "http",
                "https",
                "stream",
                "child_process",
                "util",
                "events",
                "url",
                "zlib",
                "net",
                "tls",
                "dns",
                "assert",
                "buffer",
                "querystring",
                "readline",
                "worker_threads",
              ],
              message: "core imports nothing (ADR 0001 #1) — no Node built-ins; wrap external access in an adapter.",
            },
          ],
        },
      ],
    },
  },
  {
    // Check B — persistence behind a port (ADR 0024). App feature code must not
    // touch raw web storage; it goes through a Store adapter so a synced adapter
    // (#25) can replace it. The ONLY sanctioned raw-storage homes are the adapter
    // files carved out below (`*-store` / `*-provider` / the notifier / each app's
    // `storage.ts`). No legacy allowlist — every feature is migrated.
    files: ["apps/**/*.{ts,tsx}"],
    ignores: [
      "apps/**/*.test.{ts,tsx}",
      "apps/web/src/test-setup.ts",
      "apps/*/scripts/**",
      "apps/**/*-store.ts",
      "apps/**/*-provider.ts",
      "apps/web/src/lib/web-notifier.ts",
      "apps/*/src/**/storage.ts",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["localStorage", "sessionStorage", "indexedDB"].map((name) => ({
          name,
          message:
            "Persisted state must go through a Store adapter (ADR 0024): keep raw web storage in a *-store / *-provider / storage.ts file, not in feature code.",
        })),
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@react-native-async-storage/async-storage",
              message:
                "Persisted state must go through a Store adapter (ADR 0024): keep AsyncStorage in a *-store / storage.ts file.",
            },
          ],
        },
      ],
    },
  },
);
