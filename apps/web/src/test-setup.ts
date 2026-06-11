import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Render next/link as a plain anchor in tests (no test relies on its internals).
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ children, href, ...rest }: { children: unknown; href: unknown }) =>
      createElement(
        "a",
        { href: typeof href === "string" ? href : "#", ...rest },
        children as never,
      ),
  };
});

// jsdom doesn't implement matchMedia — stub it so components that read it don't throw.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

// Unmount React trees and reset per-device state between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
