import { defineConfig } from "vitest/config";

/**
 * Standalone vitest config used ONLY by Stryker (`stryker.config.json`). The repo's
 * default test run uses the root `vitest.workspace.ts`; that workspace references
 * sibling packages by path, which don't exist inside Stryker's per-package sandbox.
 * A non-default filename keeps the workspace from auto-picking this up — it's wired
 * in solely via Stryker's `vitest.configFile`.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // A single, self-contained project — no workspace, so the sandbox resolves cleanly.
    watch: false,
  },
});
