import { describe, expect, it } from "vitest";
import {
  BACKUP_APP,
  BACKUP_KEY_PREFIX,
  BACKUP_VERSION,
  buildBackup,
  isBackupKey,
  mergeBackups,
  validateBackup,
} from "./backup";

describe("isBackupKey", () => {
  it("matches only the shared local-first prefix", () => {
    expect(BACKUP_KEY_PREFIX).toBe("ul.");
    expect(isBackupKey("ul.readingPlan")).toBe(true);
    expect(isBackupKey("ul.editions")).toBe(true);
    expect(isBackupKey("theme")).toBe(false);
    expect(isBackupKey("other.key")).toBe(false);
  });

  it("excludes the device-local sync sidecar (never export the E2EE secret or clone a node id)", () => {
    expect(isBackupKey("ul.sync.secret")).toBe(false); // the E2EE account root
    expect(isBackupKey("ul.sync.node")).toBe(false); // per-device HLC tiebreaker
    expect(isBackupKey("ul.sync.meta")).toBe(false);
    expect(isBackupKey("ul.sync.enabled")).toBe(false);
  });
});

describe("buildBackup", () => {
  it("wraps data in a versioned, timestamped envelope", () => {
    const b = buildBackup({ "ul.theme": "dark" }, new Date("2026-06-07T10:00:00Z"));
    expect(b).toEqual({
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: "2026-06-07T10:00:00.000Z",
      data: { "ul.theme": "dark" },
    });
  });
});

describe("validateBackup", () => {
  const valid = buildBackup({ "ul.bookmarks": "[]" }, new Date());
  it("accepts a well-formed backup", () => {
    expect(validateBackup(valid)).toEqual([]);
  });
  it("rejects non-objects and foreign files", () => {
    expect(validateBackup(null).length).toBeGreaterThan(0);
    expect(validateBackup({ app: "something-else", version: 1, data: {} }).length).toBeGreaterThan(0);
  });
  it("rejects a newer backup version", () => {
    expect(validateBackup({ ...valid, version: BACKUP_VERSION + 1 }).length).toBeGreaterThan(0);
  });
  it("rejects malformed (non-string) data values", () => {
    expect(validateBackup({ ...valid, data: { "ul.x": 5 } }).length).toBeGreaterThan(0);
  });
  it("rejects an array as data (would spread numeric indices into bare keys on import)", () => {
    // typeof [] === "object", so an array slips the plain-object check; on import
    // it would write keys "0","1" outside the ul. namespace that can never be reclaimed.
    expect(validateBackup({ ...valid, data: ["a", "b"] }).length).toBeGreaterThan(0);
  });
});

describe("mergeBackups", () => {
  const mine = { "ul.theme": "light", "ul.scale": "1.2" };
  const incoming = { "ul.theme": "dark", "ul.bookmarks": "[1]" };

  it("replace lets the backup win and adds new keys", () => {
    expect(mergeBackups(mine, incoming, "replace")).toEqual({
      "ul.theme": "dark",
      "ul.scale": "1.2",
      "ul.bookmarks": "[1]",
    });
  });
  it("keep-mine only fills keys I don't have", () => {
    expect(mergeBackups(mine, incoming, "keep-mine")).toEqual({
      "ul.theme": "light",
      "ul.scale": "1.2",
      "ul.bookmarks": "[1]",
    });
  });
});
