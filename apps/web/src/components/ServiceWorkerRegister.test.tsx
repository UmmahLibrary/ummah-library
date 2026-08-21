import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("in dev, only drops the service worker's own caches — not unrelated Cache API users like offline audio downloads", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations: vi.fn().mockResolvedValue([]) },
    });
    const deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue(["ul-static-v1", "ul-pages-v1", "ul-audio-v1"]),
      delete: deleteCache,
    });

    render(<ServiceWorkerRegister />);
    await vi.waitFor(() => expect(deleteCache).toHaveBeenCalled());

    expect(deleteCache).toHaveBeenCalledWith("ul-static-v1");
    expect(deleteCache).toHaveBeenCalledWith("ul-pages-v1");
    expect(deleteCache).not.toHaveBeenCalledWith("ul-audio-v1");
  });
});
