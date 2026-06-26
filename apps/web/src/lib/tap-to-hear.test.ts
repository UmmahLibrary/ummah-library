import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAP_HEAR_KEY, readTapToHear, writeTapToHear } from "./tap-to-hear";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("tap-to-hear toggle", () => {
  it("defaults to off and round-trips with a change event", async () => {
    expect(await readTapToHear()).toBe(false);
    const handler = vi.fn();
    window.addEventListener(TAP_HEAR_KEY, handler);

    await writeTapToHear(true);
    expect(await readTapToHear()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect(localStorage.getItem("ul.tapToHear")).toBe("true");

    window.removeEventListener(TAP_HEAR_KEY, handler);
  });
});
