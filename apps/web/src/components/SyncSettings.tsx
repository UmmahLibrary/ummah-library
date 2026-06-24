"use client";

import { useEffect, useState } from "react";
import type { SyncOutcome } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { generateRecoveryPhrase } from "../lib/sync/web-crypto-cipher";
import { disableSync, enableSync, isSyncEnabled, readSyncSecret } from "../lib/sync/sync-settings";
import { resetSyncRuntime, syncIfEnabled } from "../lib/sync/sync-runtime";

const lcard = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
  padding: 20,
} as const;

const primaryBtn = {
  padding: "11px 20px",
  borderRadius: 11,
  border: "1px solid transparent",
  background: N.goldGrad,
  color: N.ink,
  fontWeight: 700,
  fontSize: 14.5,
  cursor: "pointer",
  fontFamily: N.ui,
} as const;

const secondaryBtn = {
  padding: "11px 18px",
  borderRadius: 11,
  border: `1px solid ${N.border}`,
  background: N.cardHi,
  color: N.fg,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: N.ui,
} as const;

const dangerBtn = {
  ...secondaryBtn,
  background: "transparent",
  color: "#E5736B",
} as const;

const inputStyle = {
  flex: 1,
  minWidth: 200,
  padding: "10px 12px",
  borderRadius: 11,
  border: `1px solid ${N.border}`,
  background: N.bg,
  color: N.fg,
  fontFamily: "monospace",
  fontSize: 14,
} as const;

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: N.faint,
        fontWeight: 700,
        margin: "0 0 10px",
        fontFamily: N.ui,
      }}
    >
      {children}
    </div>
  );
}

function outcomeMessage(outcome: SyncOutcome | null): string {
  if (!outcome) return "Sync is off.";
  if (outcome.applied === 0) return "Up to date — nothing new from your other devices.";
  const n = outcome.applied;
  return `Synced — ${n} item${n === 1 ? "" : "s"} brought in from your other devices.`;
}

const SERVER_DOWN = "Couldn’t reach the sync server — your data is safe on this device.";

/**
 * The "Sync across devices" settings section (#25, ADR 0033). Sets up or manages
 * opt-in, end-to-end-encrypted sync: generate or enter a recovery phrase, turn sync
 * on/off, reveal/copy the phrase, and sync on demand. The phrase is the only key —
 * the section says so plainly, since losing it means the synced data can't be
 * recovered. Replaces the `/sync-dev` developer surface.
 */
export function SyncSettings() {
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Read localStorage only after mount to avoid a server/client hydration mismatch.
  useEffect(() => {
    setEnabled(isSyncEnabled());
    setSecret(readSyncSecret());
  }, []);

  async function turnOn() {
    const s = phrase.trim();
    if (!s) return;
    setBusy(true);
    setStatus(null);
    enableSync(s);
    resetSyncRuntime();
    setEnabled(true);
    setSecret(s);
    try {
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
    if (!confirm("Turn off sync and remove the recovery phrase from this device?")) return;
    disableSync();
    resetSyncRuntime();
    setEnabled(false);
    setSecret(null);
    setReveal(false);
    setStatus(null);
  }

  function copyPhrase() {
    if (secret) void navigator.clipboard?.writeText(secret).catch(() => {});
  }

  return (
    <div>
      <p
        style={{
          fontSize: 14.5,
          color: N.muted,
          lineHeight: 1.65,
          margin: "0 0 20px",
          fontFamily: N.ui,
        }}
      >
        Keep your bookmarks, reading position and preferences in step across your devices —
        end-to-end encrypted, with no account. Off by default; the app works fully offline without
        it.
      </p>

      {enabled ? (
        <>
          <GroupLabel>Sync is on</GroupLabel>
          <div style={{ ...lcard, marginBottom: 18 }}>
            <p
              style={{
                fontSize: 13.5,
                color: N.muted,
                lineHeight: 1.6,
                margin: "0 0 14px",
                fontFamily: N.ui,
              }}
            >
              Your data syncs across every device that uses your recovery phrase.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
              <button type="button" style={dangerBtn} onClick={turnOff}>
                Turn off sync
              </button>
            </div>
            {reveal && secret && (
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <code
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: N.bg,
                    border: `1px solid ${N.border}`,
                    color: N.fg,
                    fontFamily: "monospace",
                    fontSize: 14,
                    letterSpacing: 0.5,
                  }}
                >
                  {secret}
                </code>
                <button type="button" style={secondaryBtn} onClick={copyPhrase}>
                  Copy
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <GroupLabel>Set up sync</GroupLabel>
          <div style={{ ...lcard, marginBottom: 18 }}>
            <p
              style={{
                fontSize: 13.5,
                color: N.muted,
                lineHeight: 1.6,
                margin: "0 0 14px",
                fontFamily: N.ui,
              }}
            >
              Generate a <b>recovery phrase</b> on your first device, then enter the same phrase on
              each other device to link them. It’s the only key — pick it once and keep it.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Enter or generate a phrase"
                spellCheck={false}
                aria-label="Recovery phrase"
                style={inputStyle}
              />
              <button
                type="button"
                style={secondaryBtn}
                onClick={() => setPhrase(generateRecoveryPhrase())}
              >
                Generate
              </button>
            </div>
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
        <p
          style={{
            fontSize: 13.5,
            fontFamily: N.ui,
            color: status.ok ? N.gold : "#E5736B",
            margin: "0 0 16px",
          }}
        >
          {status.message}
        </p>
      )}

      <div style={{ ...lcard, padding: 16, background: "transparent" }}>
        <p style={{ fontSize: 13, color: N.faint, lineHeight: 1.6, margin: 0, fontFamily: N.ui }}>
          ⚠ Your recovery phrase is the only key to your synced data. We can’t see it or recover it
          — if you lose it, the data can’t be decrypted. Keep a copy somewhere safe (your exported
          backup file is a good place).
        </p>
      </div>
    </div>
  );
}
