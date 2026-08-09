import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke tests. The web dev server is started automatically (reused locally
 * if one is already running on :3000). Tests stub external audio so they never
 * depend on quran.com / everyayah being reachable.
 *
 * `storageState` pre-seeds `ul.onboarded` so specs land straight on the feature
 * under test instead of the first-run intro overlay (ADR 0024); onboarding.spec.ts
 * opts back out to exercise the un-onboarded state.
 */
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 60_000,
    trace: "on-first-retry",
    storageState: "e2e/.auth/onboarded.json",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter @ummahlibrary/web dev",
    url: "http://localhost:3000",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
