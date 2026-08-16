/**
 * Extension {@link SyncStateStore} (#25, ADR 0033). The extension keeps its prefs
 * under short `chrome.storage.sync` keys with native value types, while sync speaks
 * the shared `ul.*` key names and serialized string values (the contract in
 * `core/sync-keys.ts`). This store bridges the two: it maps only the keys the
 * extension actually has that overlap the contract — `ul.theme` and
 * `ul.hijriAdjust` — reading each as the same string the web app stores so the
 * values merge across platforms, and writing a remote winner back into the
 * extension's own storage. A presence-aware read reports a never-set pref as
 * `null` (not its default) so a fresh install never pushes a value the user never
 * chose, and never clobbers another device.
 */
import { MANAGED_KEYS, type SyncStateStore } from "@ummahlibrary/core";
import { getPref, setPref } from "../storage";
import { THEME_KEYS } from "../theme";
import { writeThemeMirror } from "../theme-store";
import { clockOf, loadMeta, reconcileMeta, saveMeta, setClockIn } from "./sync-meta";
import { getNodeId } from "./sync-node";

/** The project-wide Hijri adjustment domain (mirrors `apps/web/src/lib/hijri.ts`). */
const clampHijriAdjust = (n: number): number => Math.max(-2, Math.min(2, Math.trunc(n)));

/** A two-way bridge between one `ul.*` sync key and the extension's own storage. */
interface KeyBridge {
  /** The current value as the shared serialized string, or `null` if never set. */
  read(): Promise<string | null>;
  /** Apply a remote winner (or a deletion) into the extension's storage. */
  write(value: string | null): Promise<void>;
}

const BRIDGES: Record<string, KeyBridge> = {
  // Theme: web stores `ul.theme` as the raw ThemeKey string; the extension stores
  // the same string under `theme`. Store raw on apply — the popup validates the
  // key on read (unknown → default) and applies it pre-paint via the mirror.
  "ul.theme": {
    read: async () => (await getPref<string | undefined>("theme", undefined)) ?? null,
    write: async (value) => {
      if (value === null) return; // no "clear theme" affordance — leave the local choice
      // Reject an unknown ThemeKey from a non-conforming/peer value rather than
      // persisting and re-propagating garbage (the UI also validates on read).
      if (!(THEME_KEYS as readonly string[]).includes(value)) return;
      await setPref("theme", value);
      writeThemeMirror(value);
    },
  },
  // Hijri adjustment: web stores `ul.hijriAdjust` as `String(n)`; the extension
  // stores the number under `hijriAdjust`, clamped to the same [-2, 2] domain every
  // other consumer enforces (a non-conforming peer value would otherwise show a
  // Hijri date off by that many days).
  "ul.hijriAdjust": {
    read: async () => {
      const v = await getPref<number | undefined>("hijriAdjust", undefined);
      return v === undefined ? null : String(v);
    },
    write: async (value) => {
      if (value === null) return;
      const n = Number(value);
      if (Number.isFinite(n)) await setPref("hijriAdjust", clampHijriAdjust(n));
    },
  },
};

/** The `ul.*` keys this build syncs — a subset of the shared contract. */
export const EXT_MANAGED: readonly string[] = Object.keys(BRIDGES).filter((k) =>
  MANAGED_KEYS.includes(k),
);

export function createExtSyncStateStore(): SyncStateStore {
  return {
    all: async () => {
      const node = await getNodeId();
      const values = new Map<string, string | null>();
      for (const key of EXT_MANAGED) values.set(key, await BRIDGES[key]!.read());
      const meta = await loadMeta();
      if (reconcileMeta(meta, EXT_MANAGED, values, new Date(), node)) await saveMeta(meta);
      return EXT_MANAGED.map((key) => ({ key, value: values.get(key) ?? null, hlc: clockOf(meta, key, node) }));
    },
    apply: async (key, value, hlc) => {
      const bridge = BRIDGES[key];
      if (!bridge) return; // not a key this build manages
      await bridge.write(value);
      // Record the clock against what was ACTUALLY stored, not the incoming value:
      // the bridge may have clamped it, rejected an unknown theme, or no-op'd a
      // deletion (we keep the local choice). Hashing the incoming value instead
      // would make the next `all()` see a mismatch and spuriously re-push the old
      // value — resurrecting it and clobbering a peer under LWW.
      const stored = await bridge.read();
      const meta = await loadMeta();
      setClockIn(meta, key, stored, hlc);
      await saveMeta(meta);
    },
  };
}
