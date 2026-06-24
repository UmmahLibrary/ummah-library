/**
 * "Sync across devices" panel for the popup (#25, ADR 0033) — the extension's
 * counterpart to the web `SyncSettings`. Collapsed to a single row by default to
 * keep the popup uncluttered; expands to set up or manage opt-in, end-to-end-
 * encrypted sync (generate/enter a recovery phrase, on/off, reveal/copy, sync now).
 * The extension only syncs the prefs it shares with the web/mobile apps — the
 * theme and the Hijri-date adjustment. The phrase is the only key; losing it means
 * the synced data can't be recovered, which the panel states plainly.
 */
import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import type { SyncOutcome } from "@ummahlibrary/core";
import { generateRecoveryPhrase } from "./lib/sync/web-crypto-cipher";
import {
  disableSync,
  enableSync,
  isSyncEnabled,
  readSyncSecret,
} from "./lib/sync/sync-settings";
import { resetSyncRuntime, syncIfEnabled } from "./lib/sync/sync-runtime";

const SERVER_DOWN = "Couldn’t reach the sync server — your data is safe on this device.";
const DANGER = "#E5736B";

function outcomeMessage(outcome: SyncOutcome | null): string {
  if (!outcome) return "Sync is off.";
  if (outcome.applied === 0) return "Up to date.";
  const n = outcome.applied;
  return `Synced — ${n} item${n === 1 ? "" : "s"} brought in.`;
}

const LABEL_STYLE = {
  fontSize: 10.5,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: N.gold,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

const primaryBtn = {
  padding: "8px 14px",
  borderRadius: 9,
  border: "1px solid transparent",
  background: N.gold,
  color: N.ink,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: "pointer",
  fontFamily: N.ui,
} as const;

const secondaryBtn = {
  padding: "8px 12px",
  borderRadius: 9,
  border: `1px solid ${N.border}`,
  background: N.bg2,
  color: N.fg,
  fontWeight: 600,
  fontSize: 12.5,
  cursor: "pointer",
  fontFamily: N.ui,
} as const;

export function SyncPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [reveal, setReveal] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([isSyncEnabled(), readSyncSecret()]).then(([on, s]) => {
      setEnabled(on);
      setSecret(s);
    });
  }, []);

  async function turnOn() {
    const s = phrase.trim();
    if (!s) return;
    setBusy(true);
    setStatus(null);
    try {
      // Inside the try so a failed storage write can't wedge the panel (stuck
      // "busy", no status) — chrome.storage.set can reject (quota, or the context
      // being invalidated by a reload while the popup is open).
      await enableSync(s);
      resetSyncRuntime();
      setEnabled(true);
      setSecret(s);
      setStatus({ ok: true, message: outcomeMessage(await syncIfEnabled()) });
    } catch {
      setStatus({ ok: false, message: SERVER_DOWN });
    } finally {
      setBusy(false);
      setPhrase("");
    }
  }

  async function syncNow() {
    setBusy(true);
    setStatus(null);
    try {
      setStatus({ ok: true, message: outcomeMessage(await syncIfEnabled()) });
    } catch {
      setStatus({ ok: false, message: SERVER_DOWN });
    } finally {
      setBusy(false);
    }
  }

  function turnOff() {
    void disableSync();
    resetSyncRuntime();
    setEnabled(false);
    setSecret(null);
    setReveal(false);
    setConfirmOff(false);
    setStatus(null);
  }

  function copyPhrase() {
    if (secret) void navigator.clipboard?.writeText(secret).catch(() => {});
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span style={LABEL_STYLE}>Sync across devices</span>
        <span style={{ fontSize: 11, color: enabled ? N.gold : N.muted, fontFamily: N.ui }}>
          {enabled ? "On" : "Off"} {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          style={{
            background: N.card,
            border: `1px solid ${N.border}`,
            borderRadius: 12,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: N.muted, fontFamily: N.ui }}>
            Keep your theme and Hijri-date setting in step with the Ummah Library app and website —
            end-to-end encrypted, no account.
          </p>

          {enabled ? (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}
                  disabled={busy}
                  onClick={() => void syncNow()}
                >
                  {busy ? "Syncing…" : "Sync now"}
                </button>
                <button type="button" style={secondaryBtn} onClick={() => setReveal((r) => !r)}>
                  {reveal ? "Hide phrase" : "Show phrase"}
                </button>
              </div>
              {reveal && secret && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <code
                    style={{
                      flex: 1,
                      minWidth: 140,
                      padding: "6px 9px",
                      borderRadius: 8,
                      background: N.bg2,
                      border: `1px solid ${N.border}`,
                      color: N.fg,
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {secret}
                  </code>
                  <button type="button" style={secondaryBtn} onClick={copyPhrase}>
                    Copy
                  </button>
                </div>
              )}
              {confirmOff ? (
                <button
                  type="button"
                  style={{ ...secondaryBtn, color: DANGER, alignSelf: "flex-start" }}
                  onClick={turnOff}
                >
                  Tap again to turn off sync
                </button>
              ) : (
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: DANGER,
                    fontSize: 12,
                    fontFamily: N.ui,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                    padding: 0,
                  }}
                  onClick={() => setConfirmOff(true)}
                >
                  Turn off sync
                </button>
              )}
            </>
          ) : (
            <>
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Enter or generate a phrase"
                aria-label="Recovery phrase"
                spellCheck={false}
                autoCapitalize="characters"
                style={{
                  background: N.bg2,
                  color: N.fg,
                  border: `1px solid ${N.border}`,
                  borderRadius: 9,
                  padding: "8px 10px",
                  fontSize: 12.5,
                  fontFamily: "monospace",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() => setPhrase(generateRecoveryPhrase())}
                >
                  Generate
                </button>
                <button
                  type="button"
                  style={{ ...primaryBtn, opacity: phrase.trim() && !busy ? 1 : 0.5 }}
                  disabled={!phrase.trim() || busy}
                  onClick={() => void turnOn()}
                >
                  {busy ? "Turning on…" : "Turn on sync"}
                </button>
              </div>
            </>
          )}

          {status && (
            <p style={{ margin: 0, fontSize: 11.5, color: status.ok ? N.gold : DANGER, fontFamily: N.ui }}>
              {status.message}
            </p>
          )}

          <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, color: N.faint, fontFamily: N.ui }}>
            ⚠ Your phrase is the only key — we can’t recover it. If you lose it, the synced data
            can’t be decrypted.
          </p>
        </div>
      )}
    </section>
  );
}
