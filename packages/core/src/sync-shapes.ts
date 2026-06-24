/**
 * Sync shape registry (#25, ADR 0034) — the pure, platform-neutral description of
 * how each managed key merges. A key is either `scalar` (v1 whole-value
 * last-writer-wins) or `map` (v2 element-level merge). For a map key, the shape
 * knows how to **explode** the parsed whole-value into per-element values and
 * **rebuild** the whole-value from surviving elements.
 *
 * The state stores use this to flatten a map key into one synced entry per element
 * (under a synthetic key `mapKey + SEP + elementId`), so the existing pure
 * `mergeEntries`/HLC engine merges per element with no change. Nothing here touches
 * storage, crypto, or the network — same discipline as `sync.ts`/`sync-keys.ts`.
 */

export type ElementId = string;

export interface ScalarShape {
  kind: "scalar";
}

export interface MapShape {
  kind: "map";
  /** Explode a parsed whole-value into `elementId → element-JSON`. Tolerates a wrong-shaped value (→ empty). */
  explode(whole: unknown): Map<ElementId, string>;
  /** Rebuild the whole-value JSON string from surviving elements, in a deterministic order. */
  rebuild(elements: Map<ElementId, string>): string;
}

export type SyncShape = ScalarShape | MapShape;

const SCALAR: ScalarShape = { kind: "scalar" };

/**
 * Separator between a map key and an element id in a synthetic key. NUL never
 * appears in a `ul.*` key or in any element id we produce (ayah `s:a`, ISO dates,
 * prayer-name enums, UUIDs, badge ids, integer indices), so it can't collide.
 */
export const ELEMENT_SEP = String.fromCharCode(0);

/** `mapKey` + the element id → the synthetic key that gets hashed into a wire entry id. */
export function explodeKey(mapKey: string, id: ElementId): string {
  return mapKey + ELEMENT_SEP + id;
}

/** Split a synthetic key back into `(mapKey, id)`, or `null` if it's a plain scalar key. */
export function parseElementKey(synthetic: string): { mapKey: string; id: ElementId } | null {
  const i = synthetic.indexOf(ELEMENT_SEP);
  if (i < 0) return null;
  return { mapKey: synthetic.slice(0, i), id: synthetic.slice(i + 1) };
}

/**
 * The decrypted plaintext of a map element carries its own identity (#25, ADR 0034
 * §2) so a device can resolve an element born on another device in one round —
 * without the server (which only sees ciphertext) learning the key name or element
 * id. Scalar entries keep their bare-value payload, so v1 clients interoperate.
 */
export interface ElementEnvelope {
  /** The map key, e.g. `ul.ayahNotes`. */
  mk: string;
  /** The element id within that map. */
  k: ElementId;
  /** The element's value, as a JSON string. */
  v: string;
}

/** Wrap a map element's value into its self-describing payload. */
export function wrapElement(mapKey: string, id: ElementId, value: string): string {
  const env: ElementEnvelope = { mk: mapKey, k: id, v: value };
  return JSON.stringify(env);
}

/** Parse a self-describing element payload, or `null` if it isn't one (a scalar/foreign value). */
export function unwrapElement(plaintext: string): ElementEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (typeof o.mk === "string" && typeof o.k === "string" && typeof o.v === "string") {
    return { mk: o.mk, k: o.k, v: o.v };
  }
  return null;
}

const byKeyAsc = (a: [string, string], b: [string, string]): number =>
  a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;

/** A map stored as `Record<id, V>` (e.g. `ul.ayahNotes`, `ul.qada`, `ul.asmaLearned`, `ul.ramadanFasts`). */
export function recordShape(): MapShape {
  return {
    kind: "map",
    explode: (whole) => {
      const out = new Map<ElementId, string>();
      if (whole !== null && typeof whole === "object" && !Array.isArray(whole)) {
        for (const [k, v] of Object.entries(whole as Record<string, unknown>)) {
          out.set(k, JSON.stringify(v));
        }
      }
      return out;
    },
    rebuild: (elements) => {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of [...elements.entries()].sort(byKeyAsc)) obj[k] = JSON.parse(v) as unknown;
      return JSON.stringify(obj);
    },
  };
}

/** A map stored as an array of objects keyed by one stable field (e.g. `ul.collections` by `id`, `ul.haid` by `start`). */
export function arrayKeyedShape(keyOf: (item: Record<string, unknown>) => unknown): MapShape {
  return {
    kind: "map",
    explode: (whole) => {
      const out = new Map<ElementId, string>();
      if (Array.isArray(whole)) {
        for (const item of whole) {
          if (item !== null && typeof item === "object") {
            const id = keyOf(item as Record<string, unknown>);
            if (typeof id === "string" && id.length > 0) out.set(id, JSON.stringify(item));
          }
        }
      }
      return out;
    },
    rebuild: (elements) =>
      JSON.stringify([...elements.entries()].sort(byKeyAsc).map(([, v]) => JSON.parse(v) as unknown)),
  };
}

/** A set stored as `string[]` (e.g. `ul.badges`, `ul.readingActive`); presence is the element, deletion a tombstone. */
export function setShape(): MapShape {
  return {
    kind: "map",
    explode: (whole) => {
      const out = new Map<ElementId, string>();
      if (Array.isArray(whole)) for (const s of whole) if (typeof s === "string") out.set(s, "1");
      return out;
    },
    rebuild: (elements) => JSON.stringify([...elements.keys()].sort()),
  };
}

/**
 * The shape of every map key (Phase 1, ADR 0034 §5 — bounded keys). Any key NOT
 * listed here is a scalar (v1 whole-value LWW). Phase 2 adds the date-keyed logs
 * (`ul.prayerLog`, `ul.readingLog`, `ul.ramadanWorship`); Phase 3 adds `ul.hifz`,
 * gated on the incremental-pull cursor.
 */
export const SYNC_SHAPES: Record<string, SyncShape> = {
  "ul.ayahNotes": recordShape(),
  "ul.qada": recordShape(),
  "ul.asmaLearned": recordShape(),
  "ul.ramadanFasts": recordShape(),
  "ul.collections": arrayKeyedShape((c) => c.id),
  "ul.haid": arrayKeyedShape((p) => p.start),
  "ul.badges": setShape(),
  "ul.readingActive": setShape(),
};

/** The merge shape of a key — scalar unless registered as a map. */
export function shapeOf(key: string): SyncShape {
  return SYNC_SHAPES[key] ?? SCALAR;
}

/** Whether a key is element-merged (a map) rather than whole-value LWW (a scalar). */
export function isMapKey(key: string): boolean {
  return shapeOf(key).kind === "map";
}
