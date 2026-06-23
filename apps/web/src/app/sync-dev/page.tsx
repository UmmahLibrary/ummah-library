"use client";
import { useCallback, useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import type { SyncOutcome } from "@ummahlibrary/core";
import { readBookmarks, toggleBookmark } from "../../lib/bookmarks";
import { generateRecoveryPhrase } from "../../lib/sync/web-crypto-cipher";
import {
  type SyncController,
  createSyncControllerFromSecret,
} from "../../lib/sync/sync-controller";
import { SYNC_CHANGE_EVENT } from "../../lib/sync/web-sync-state-store";

const card = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 14,
  padding: 18,
  marginBottom: 16,
} as const;

const button = {
  padding: "8px 14px",
  borderRadius: 10,
  border: `1px solid ${N.border}`,
  background: N.card,
  color: N.fg,
  fontFamily: N.ui,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
} as const;

const DEMO_SURAHS = [1, 2, 36, 67, 112];

/**
 * Dev-only surface to verify cross-device sync end-to-end (#163): enter the same
 * recovery phrase in two browser profiles, bookmark a surah in one, "Sync now" in
 * both, and watch it appear in the other. The polished Settings experience is D2.
 */
export default function SyncDevPage() {
  const [secret, setSecret] = useState("");
  const [controller, setController] = useState<SyncController | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void readBookmarks().then(setBookmarks);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(SYNC_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SYNC_CHANGE_EVENT, refresh);
  }, [refresh]);

  const enable = useCallback(async () => {
    setError(null);
    try {
      setController(await createSyncControllerFromSecret(secret.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not enable sync");
    }
  }, [secret]);

  const syncNow = useCallback(async () => {
    if (!controller) return;
    setBusy(true);
    setError(null);
    try {
      setOutcome(await controller.syncNow());
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "sync failed");
    } finally {
      setBusy(false);
    }
  }, [controller, refresh]);

  const toggle = useCallback(async (surah: number) => {
    setBookmarks(await toggleBookmark(surah));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px 60px", fontFamily: N.ui }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: N.fg }}>
        Sync · dev preview
      </h1>
      <p style={{ color: N.muted, fontSize: 14, margin: "0 0 20px" }}>
        Temporary surface to verify cross-device sync (#163). The real Settings UI is D2.
      </p>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: N.fg }}>1 · Recovery phrase</div>
        <p style={{ color: N.muted, fontSize: 13, margin: "0 0 10px" }}>
          This phrase is your only key — it never leaves your device, and if you lose it your synced
          data is unrecoverable. Enter the same phrase on each device.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ABCDE-ABCDE-…"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${N.border}`,
              background: N.bg,
              color: N.fg,
              fontFamily: "monospace",
              fontSize: 14,
            }}
          />
          <button type="button" style={button} onClick={() => setSecret(generateRecoveryPhrase())}>
            Generate
          </button>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: N.fg }}>2 · Enable &amp; sync</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            style={button}
            disabled={!secret.trim()}
            onClick={() => void enable()}
          >
            {controller ? "Re-enable" : "Enable sync"}
          </button>
          <button
            type="button"
            style={button}
            disabled={!controller || busy}
            onClick={() => void syncNow()}
          >
            {busy ? "Syncing…" : "Sync now"}
          </button>
          <span style={{ fontSize: 13, color: N.muted }}>
            {controller ? "✓ enabled" : "not enabled"}
          </span>
        </div>
        {outcome && (
          <div style={{ fontSize: 13, color: N.muted, marginTop: 10 }}>
            Last sync — pushed {outcome.pushed}, pulled {outcome.pulled}, applied {outcome.applied}.
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "#d14343", marginTop: 10 }}>{error}</div>}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: N.fg }}>
          3 · Bookmarks (the synced data)
        </div>
        <div style={{ fontSize: 14, marginBottom: 10, color: N.fg }}>
          {bookmarks.length ? `Surahs: ${bookmarks.join(", ")}` : "No bookmarks yet."}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DEMO_SURAHS.map((s) => (
            <button key={s} type="button" style={button} onClick={() => void toggle(s)}>
              {bookmarks.includes(s) ? `− ${s}` : `+ ${s}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
