import { describe, expect, it } from "vitest";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  buildBackup,
  mergeBackups,
  validateBackup,
} from "./backup";

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
