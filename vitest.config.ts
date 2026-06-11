import { defineConfig } from "vitest/config";

/**
 * Root config — supplies the coverage settings for the workspace run
 * (`pnpm test:coverage`). Coverage is scoped to the logic libraries
 * (core / data / adapters); the UI apps are covered by manual + e2e checks,
 * not unit tests. No failing thresholds yet — this just reports the numbers.
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
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "**/datasets/**",
        "**/scripts/**",
        // Type-only modules — interfaces/types with no runtime code to cover.
        "packages/core/src/entities.ts",
        "packages/core/src/ports.ts",
      ],
    },
  },
});
