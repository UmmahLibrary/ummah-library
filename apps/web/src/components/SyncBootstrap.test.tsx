import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { SyncBootstrap } from "./SyncBootstrap";

const syncIfEnabled = vi.fn(async () => null);
vi.mock("../lib/sync/sync-runtime", () => ({
  syncIfEnabled: () => syncIfEnabled(),
}));

beforeEach(() => syncIfEnabled.mockClear());
afterEach(() => vi.restoreAllMocks());

describe("SyncBootstrap", () => {
  it("runs a sync on mount and renders nothing", () => {
    const { container } = render(<SyncBootstrap />);
    expect(syncIfEnabled).toHaveBeenCalledOnce();
    expect(container).toBeEmptyDOMElement();
  });

  it("syncs again when the tab becomes visible", () => {
    render(<SyncBootstrap />);
    syncIfEnabled.mockClear();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(syncIfEnabled).toHaveBeenCalled();
  });
});
