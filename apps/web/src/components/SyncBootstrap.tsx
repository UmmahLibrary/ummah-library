"use client";

import { useEffect } from "react";
import { syncIfEnabled } from "../lib/sync/sync-runtime";
import { wireSyncRefresh } from "../lib/sync/sync-refresh";

/**
 * App-wide sync trigger (#25, ADR 0033): runs one sync round on load and whenever
 * the tab regains focus — but only when sync is enabled, since {@link syncIfEnabled}
 * is a no-op otherwise. Invisible; mounted in the root layout beside the reminder
 * schedulers so sync keeps up no matter which page is open. Failures are swallowed
 * (offline, server unprovisioned) — the local-first app carries on regardless.
 *
 * Also wires {@link wireSyncRefresh} so a value pulled from another device shows
 * without a reload (re-reads the affected feature; re-applies a synced theme).
 */
export function SyncBootstrap() {
  useEffect(() => {
    const unwireRefresh = wireSyncRefresh();
    const run = () => void syncIfEnabled().catch(() => {});
    run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    return () => {
      unwireRefresh();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
    };
  }, []);
  return null;
}
