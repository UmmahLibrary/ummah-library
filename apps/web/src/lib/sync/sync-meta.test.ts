import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clockFor, reconcile, setClock } from "./sync-meta";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

const NODE = "node-a";
const KEY = "ul.bookmarks";

describe("sync-meta", () => {
  it("stamps a new key as a first local write", () => {
    localStorage.setItem(KEY, "[1]");
    reconcile([KEY], new Date(1000), NODE);
    const hlc = clockFor(KEY, NODE);
    expect(hlc.node).toBe(NODE);
    expect(hlc.millis).toBe(1000);
  });

  it("bumps the clock when the value changes", () => {
    localStorage.setItem(KEY, "[1]");
    reconcile([KEY], new Date(1000), NODE);
    localStorage.setItem(KEY, "[1,2]");
    reconcile([KEY], new Date(2000), NODE);
    expect(clockFor(KEY, NODE).millis).toBe(2000);
  });

  it("does not bump when the value is unchanged", () => {
    localStorage.setItem(KEY, "[1]");
    reconcile([KEY], new Date(1000), NODE);
    reconcile([KEY], new Date(5000), NODE);
    expect(clockFor(KEY, NODE).millis).toBe(1000);
  });

  it("clockFor returns a fresh clock for an unknown key", () => {
    expect(clockFor("ul.unknown", NODE)).toEqual({ millis: 0, counter: 0, node: NODE });
  });

  it("setClock records the remote stamp and suppresses a false change", () => {
    setClock(KEY, "[9]", { millis: 42, counter: 0, node: "remote" });
    expect(clockFor(KEY, NODE)).toEqual({ millis: 42, counter: 0, node: "remote" });
    localStorage.setItem(KEY, "[9]"); // same value the remote installed
    reconcile([KEY], new Date(9999), NODE);
    expect(clockFor(KEY, NODE)).toEqual({ millis: 42, counter: 0, node: "remote" });
  });

  it("drops a structurally-corrupt clock from the sidecar rather than trusting it", () => {
    // A corrupt/peer-synced ul.sync.meta with a bad structural clock must not be
    // carried into clockFor → hlcCompare/hlcTick (where it produces NaN ordering).
    localStorage.setItem(
      "ul.sync.meta",
      JSON.stringify({ [KEY]: { hlc: { millis: "abc", counter: null, node: 42 }, hash: "h" } }),
    );
    expect(clockFor(KEY, NODE)).toEqual({ millis: 0, counter: 0, node: NODE }); // fresh, not garbage
  });

  it("preserves a large valid clock losslessly through setClock → clockFor", () => {
    // The legacy encoded-string form would round-trip a big millis/counter through
    // parseHlc; structural storage must preserve it exactly so an applied remote
    // entry is never re-applied (the cycle-1 infinite-re-apply regression).
    setClock(KEY, "[1]", { millis: 9_000_000_000_000_000, counter: 3, node: "remote-device" });
    expect(clockFor(KEY, NODE)).toEqual({
      millis: 9_000_000_000_000_000,
      counter: 3,
      node: "remote-device",
    });
  });

  it("a local write after a remote apply carries this node", () => {
    setClock(KEY, "[9]", { millis: 42, counter: 0, node: "remote" });
    localStorage.setItem(KEY, "[9,10]"); // genuine local change
    reconcile([KEY], new Date(50), NODE);
    const hlc = clockFor(KEY, NODE);
    expect(hlc.node).toBe(NODE);
    expect(hlc.millis).toBe(50);
  });

  it("leaves a never-seen absent key at the zero clock (a fresh device can't clobber)", () => {
    // KEY absent with no prior meta: absence is "unknown", not "deleted", so the
    // clock must stay at hlcInit — anything on the server then wins LWW.
    reconcile([KEY], new Date(9999), NODE);
    expect(clockFor(KEY, NODE)).toEqual({ millis: 0, counter: 0, node: NODE });
  });

  it("mints a tombstone when a key that had a value becomes null (real deletion)", () => {
    localStorage.setItem(KEY, "[1]");
    reconcile([KEY], new Date(1000), NODE);
    localStorage.removeItem(KEY); // genuine deletion of an existing value
    reconcile([KEY], new Date(2000), NODE);
    expect(clockFor(KEY, NODE).millis).toBe(2000); // advanced ⇒ deletion propagates
  });
});
