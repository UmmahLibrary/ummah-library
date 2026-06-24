import { defineConfig } from "vitest/config";

/**
 * Local project config so `vitest run` (per-package, via `turbo run test`) uses
 * THIS config instead of walking up and discovering the root `vitest.workspace.ts`
 * — whose sibling-package paths resolve relative to the package dir and fail
 * (e.g. `packages/<pkg>/packages/core`). The unified, coverage-gated run still
 * goes through the root workspace via `pnpm test:coverage`. Node env (pure logic).
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
