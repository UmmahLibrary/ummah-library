import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollBehavior } from "./motion";

afterEach(() => {
  document.documentElement.classList.remove("comfort-reduce-motion");
  vi.restoreAllMocks();
});

describe("scrollBehavior", () => {
  it("scrolls smoothly by default", () => {
    expect(scrollBehavior()).toBe("smooth");
  });

  it("jumps instead when Reduce motion is on in Settings", () => {
    document.documentElement.classList.add("comfort-reduce-motion");
    expect(scrollBehavior()).toBe("auto");
  });

  it("jumps instead when the device asks for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as unknown as MediaQueryList);
    expect(scrollBehavior()).toBe("auto");
  });
});
