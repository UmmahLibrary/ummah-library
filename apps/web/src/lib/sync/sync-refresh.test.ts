import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MANAGED_KEYS } from "@ummahlibrary/core";
import { REFRESH_EVENTS, refreshForKey, wireSyncRefresh } from "./sync-refresh";
import { SYNC_CHANGE_EVENT } from "./web-sync-state-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("REFRESH_EVENTS", () => {
  it("maps every managed key, so adding a key forces a refresh decision", () => {
    for (const key of MANAGED_KEYS) expect(Object.hasOwn(REFRESH_EVENTS, key)).toBe(true);
  });
});

describe("refreshForKey", () => {
  it("dispatches the feature re-read event for a synced tracker key (name differs from the key)", () => {
    const onTracker = vi.fn();
    window.addEventListener("ul.prayerTracker", onTracker);
    refreshForKey("ul.prayerLog");
    expect(onTracker).toHaveBeenCalledOnce();
    window.removeEventListener("ul.prayerTracker", onTracker);
  });

  it("re-applies a synced theme to the document live", () => {
    localStorage.setItem("ul.theme", "emerald");
    refreshForKey("ul.theme");
    expect(document.documentElement.dataset.theme).toBe("emerald");
  });

  it("is a no-op (no throw) for a key with no live listener", () => {
    expect(() => refreshForKey("ul.bookmarks")).not.toThrow();
  });
});

describe("wireSyncRefresh", () => {
  it("re-reads the affected feature when a sync change is announced", () => {
    const unwire = wireSyncRefresh();
    const onReading = vi.fn();
    window.addEventListener("ul.reading", onReading);
    window.dispatchEvent(new CustomEvent(SYNC_CHANGE_EVENT, { detail: { key: "ul.readingLog" } }));
    expect(onReading).toHaveBeenCalledOnce();
    window.removeEventListener("ul.reading", onReading);
    unwire();
  });

  it("stops listening after the returned unsubscribe runs", () => {
    wireSyncRefresh()();
    const onTracker = vi.fn();
    window.addEventListener("ul.prayerTracker", onTracker);
    window.dispatchEvent(new CustomEvent(SYNC_CHANGE_EVENT, { detail: { key: "ul.prayerLog" } }));
    expect(onTracker).not.toHaveBeenCalled();
    window.removeEventListener("ul.prayerTracker", onTracker);
  });
});
