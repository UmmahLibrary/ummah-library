"use client";

import { useEffect, useRef, useState } from "react";
import type { MergeStrategy } from "@ummahlibrary/core";
import { clearAllData, collectLocalData, exportBackup, importBackup } from "../lib/backup";
import { N } from "./noor";

const lcard = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;

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

export function DataBackup() {
  const [strategy, setStrategy] = useState<MergeStrategy>("replace");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Read localStorage only after mount to avoid a server/client hydration mismatch.
  useEffect(() => {
    setItemCount(Object.keys(collectLocalData()).length);
  }, [status]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setStatus(importBackup(String(reader.result), strategy));
    reader.onerror = () => setStatus({ ok: false, message: "Couldn’t read that file." });
    reader.readAsText(file);
  }

  function onClear() {
    if (!confirm("Erase all Ummah Library data on this device? This can’t be undone.")) return;
    const n = clearAllData();
    setStatus({ ok: true, message: `Cleared ${n} items. Reload to start fresh.` });
  }

  const pill = (active: boolean) =>
    ({
      padding: "8px 16px",
      borderRadius: 999,
      border: `1px solid ${active ? N.gold : N.border}`,
      background: active ? N.goldSoft : "transparent",
      color: active ? N.gold : N.muted,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: N.ui,
    }) as const;

  return (
    <div>
      <p style={{ fontSize: 14.5, color: N.muted, lineHeight: 1.65, margin: "0 0 20px", fontFamily: N.ui }}>
        Everything you do here stays on this device — no account, no server. Export a backup file to
        move your data to another device or keep it safe; import it to restore.
      </p>

      <GroupLabel>Your data</GroupLabel>
      <div style={{ ...lcard, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={exportBackup}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 11,
              border: "1px solid transparent",
              background: N.goldGrad,
              color: N.ink,
              fontWeight: 700,
              fontSize: 14.5,
              cursor: "pointer",
              fontFamily: N.ui,
            }}
          >
            ⬇ Export my data
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 11,
              border: `1px solid ${N.border}`,
              background: N.cardHi,
              color: N.fg,
              fontWeight: 600,
              fontSize: 14.5,
              cursor: "pointer",
              fontFamily: N.ui,
            }}
          >
            ⬆ Import a backup
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={onFile} hidden />
        </div>
      </div>

      <GroupLabel>On import</GroupLabel>
      <div style={{ ...lcard, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={pill(strategy === "replace")} onClick={() => setStrategy("replace")}>
            Replace my data
          </button>
          <button type="button" style={pill(strategy === "keep-mine")} onClick={() => setStrategy("keep-mine")}>
            Keep mine on conflict
          </button>
        </div>
        <p style={{ fontSize: 13, color: N.faint, lineHeight: 1.6, margin: "14px 0 0", fontFamily: N.ui }}>
          {strategy === "replace"
            ? "The backup fully restores your data, overwriting what’s here."
            : "The backup only fills in things you don’t already have."}
        </p>
      </div>

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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>
          {itemCount ?? "—"} item{itemCount === 1 ? "" : "s"} stored on this device.
        </span>
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: `1px solid ${N.border}`,
            background: "transparent",
            color: "#E5736B",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: N.ui,
          }}
        >
          Erase all data
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 12.5, color: N.faint, marginTop: 28, fontFamily: N.ui }}>
        Ummah Library · local-first · Free &amp; open source
      </div>
    </div>
  );
}
