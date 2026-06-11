import { defineWorkspace } from "vitest/config";

/**
 * Runs every package that has unit tests as one project, so `vitest --coverage`
 * produces a single, unified coverage report across the monorepo.
 */
export default defineWorkspace([
  "packages/core",
  "packages/data",
  "packages/adapters",
  "apps/mobile",
]);
