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

  it("every managed key now has at least one live listener (theme is the sole non-event special case)", () => {
    for (const key of MANAGED_KEYS) {
      if (key === "ul.theme") continue;
      expect(REFRESH_EVENTS[key]!.length).toBeGreaterThan(0);
    }
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

  it("is a no-op (no throw) for a key this build doesn't manage", () => {
    expect(() => refreshForKey("ul.doesNotExist")).not.toThrow();
  });

  it("dispatches ul.prayerSettings for every prayer-settings key, and ul.prayerCoords additionally for coords", () => {
    for (const key of ["ul.prayerMethod", "ul.prayerMadhab", "ul.prayerHighLat"]) {
      const onSettings = vi.fn();
      window.addEventListener("ul.prayerSettings", onSettings);
      refreshForKey(key);
      expect(onSettings).toHaveBeenCalledOnce();
      window.removeEventListener("ul.prayerSettings", onSettings);
    }

    const onSettings = vi.fn();
    const onCoords = vi.fn();
    window.addEventListener("ul.prayerSettings", onSettings);
    window.addEventListener("ul.prayerCoords", onCoords);
    refreshForKey("ul.prayerCoords");
    expect(onSettings).toHaveBeenCalledOnce();
    expect(onCoords).toHaveBeenCalledOnce();
    window.removeEventListener("ul.prayerSettings", onSettings);
    window.removeEventListener("ul.prayerCoords", onCoords);
  });

  it("dispatches ul.bookmarks, ul.hifz, ul.asmaLearned, ul.lastRead, ul.scale, ul.loop, ul.readingMode and ul.badges (they gained live listeners)", () => {
    for (const key of [
      "ul.bookmarks",
      "ul.hifz",
      "ul.asmaLearned",
      "ul.lastRead",
      "ul.scale",
      "ul.loop",
      "ul.readingMode",
      "ul.badges",
    ]) {
      const onChange = vi.fn();
      window.addEventListener(key, onChange);
      refreshForKey(key);
      expect(onChange).toHaveBeenCalledOnce();
      window.removeEventListener(key, onChange);
    }
  });

  it("dispatches ul.collections for a synced ul.ayahNotes change (they share the collections view's event)", () => {
    const onCollections = vi.fn();
    window.addEventListener("ul.collections", onCollections);
    refreshForKey("ul.ayahNotes");
    expect(onCollections).toHaveBeenCalledOnce();
    window.removeEventListener("ul.collections", onCollections);
  });

  it("carries the key's raw stored value as `detail` (ul.reciter/ul.tafsir need it, not just a bare signal)", () => {
    localStorage.setItem("ul.reciter", "alafasy");
    const onReciter = vi.fn();
    window.addEventListener("ul.reciter", onReciter);
    refreshForKey("ul.reciter");
    expect(onReciter).toHaveBeenCalledOnce();
    expect((onReciter.mock.calls[0]![0] as CustomEvent).detail).toBe("alafasy");
    window.removeEventListener("ul.reciter", onReciter);
  });

  it("a bare-signal listener (re-reads storage itself) is unaffected by the extra detail", () => {
    localStorage.setItem("ul.editions", '["eng-sahih"]');
    const onEditions = vi.fn();
    window.addEventListener("ul.editions", onEditions);
    refreshForKey("ul.editions");
    expect(onEditions).toHaveBeenCalledOnce();
    window.removeEventListener("ul.editions", onEditions);
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
