import { defineConfig } from "vitest/config";

/**
 * Root config — supplies the coverage settings for the workspace run
 * (`pnpm test:coverage`). Coverage is reported for the logic libraries
 * (core / data / adapters) and the web client logic. Per-library thresholds
 * lock in the well-tested logic so it can't silently regress; the web UI is
 * reported as a growing baseline (no gate yet).
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      all: true,
      include: [
        "packages/core/src/**/*.ts",
        "packages/data/src/**/*.ts",
        "packages/adapters/src/**/*.ts",
        // Web client logic — components + local-first helpers (not Next route/server files).
        "apps/web/src/components/**/*.{ts,tsx}",
        "apps/web/src/lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.d.ts",
        "**/datasets/**",
        "**/scripts/**",
        "apps/web/src/test-setup.ts",
        // Type-only modules — interfaces/types with no runtime code to cover.
        "packages/core/src/entities.ts",
        "packages/core/src/ports.ts",
      ],
      // Thresholds are set a little below current so they absorb churn but can
      // only be RAISED (a ratchet). Bump the web floors as more tests land.
      thresholds: {
        "packages/core/src/**": { statements: 95, branches: 88, functions: 95, lines: 95 },
        "packages/data/src/**": { statements: 85, branches: 78, functions: 72, lines: 85 },
        "packages/adapters/src/**": { statements: 95, branches: 82, functions: 90, lines: 95 },
        // Web client — a growing baseline, ratcheted as tests land.
        "apps/web/src/lib/**": { statements: 55, branches: 73, functions: 95, lines: 55 },
        "apps/web/src/components/**": { statements: 24, branches: 71, functions: 48, lines: 24 },
      },
    },
  },
});
