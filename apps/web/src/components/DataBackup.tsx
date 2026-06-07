"use client";

import { useRef, useState } from "react";
import type { MergeStrategy } from "@ummahlibrary/core";
import { clearAllData, collectLocalData, exportBackup, importBackup } from "../lib/backup";

export function DataBackup() {
  const [strategy, setStrategy] = useState<MergeStrategy>("replace");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const itemCount = typeof window === "undefined" ? 0 : Object.keys(collectLocalData()).length;

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

  return (
    <div className="backup">
      <p className="backup-intro">
        Everything you do here stays on this device — no account, no server. Export a backup file to
        move your data to another device or keep it safe; import it to restore.
      </p>

      <div className="backup-actions">
        <button type="button" className="audio-play" onClick={exportBackup}>
          ⬇️ Export my data
        </button>
        <button type="button" className="chip" onClick={() => fileInput.current?.click()}>
          ⬆️ Import a backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
      </div>

      <fieldset className="zakat-group backup-strategy">
        <legend>On import</legend>
        <div className="hijri-adjust-row">
          <button
            type="button"
            className={strategy === "replace" ? "chip chip--active" : "chip"}
            onClick={() => setStrategy("replace")}
          >
            Replace my data
          </button>
          <button
            type="button"
            className={strategy === "keep-mine" ? "chip chip--active" : "chip"}
            onClick={() => setStrategy("keep-mine")}
          >
            Keep mine on conflict
          </button>
        </div>
        <p className="hifz-muted backup-note">
          {strategy === "replace"
            ? "The backup fully restores your data, overwriting what’s here."
            : "The backup only fills in things you don’t already have."}
        </p>
      </fieldset>

      {status && (
        <p className={status.ok ? "backup-status backup-status--ok" : "backup-status backup-status--err"}>
          {status.message}
        </p>
      )}

      <p className="hifz-muted">{itemCount} items stored on this device.</p>
      <button type="button" className="chip backup-danger" onClick={onClear}>
        Erase all data
      </button>
    </div>
  );
}
