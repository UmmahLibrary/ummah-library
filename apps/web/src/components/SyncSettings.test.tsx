import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SyncSettings } from "./SyncSettings";

const syncIfEnabled = vi.fn(async () => ({ pushed: 5, pulled: 5, applied: 2 }));
vi.mock("../lib/sync/sync-runtime", () => ({
  syncIfEnabled: () => syncIfEnabled(),
  resetSyncRuntime: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  syncIfEnabled.mockClear();
  syncIfEnabled.mockResolvedValue({ pushed: 5, pulled: 5, applied: 2 });
});
afterEach(() => localStorage.clear());

function generate(): string {
  fireEvent.click(screen.getByText("Generate"));
  return (screen.getByLabelText("Recovery phrase") as HTMLInputElement).value;
}

/** Generate a phrase, turn on sync, and wait for that first sync round to finish. */
async function enableViaUI(): Promise<string> {
  const phrase = generate();
  fireEvent.click(screen.getByText("Turn on sync"));
  await waitFor(() =>
    expect(screen.getByText(/your other devices|safe on this device/)).toBeInTheDocument(),
  );
  return phrase;
}

describe("SyncSettings", () => {
  it("shows the setup state by default", () => {
    render(<SyncSettings />);
    expect(screen.getByText("Set up sync")).toBeInTheDocument();
    expect(screen.getByText("Turn on sync")).toBeInTheDocument();
  });

  it("generate fills a recovery phrase", () => {
    render(<SyncSettings />);
    expect((screen.getByLabelText("Recovery phrase") as HTMLInputElement).value).toBe("");
    expect(generate().length).toBeGreaterThan(10);
  });

  it("turning on syncs, stores the secret, and shows the active state", async () => {
    render(<SyncSettings />);
    await enableViaUI();
    expect(syncIfEnabled).toHaveBeenCalled();
    expect(localStorage.getItem("ul.sync.enabled")).toBe("1");
    expect(localStorage.getItem("ul.sync.secret")).toBeTruthy();
    expect(screen.getByText(/brought in from your other devices/)).toBeInTheDocument();
    expect(screen.getByText("Sync is on")).toBeInTheDocument();
  });

  it("reveals the stored phrase on demand", async () => {
    render(<SyncSettings />);
    const phrase = await enableViaUI();
    fireEvent.click(screen.getByText("Show phrase"));
    expect(screen.getByText(phrase)).toBeInTheDocument();
  });

  it("'Sync now' reports an up-to-date result", async () => {
    render(<SyncSettings />);
    await enableViaUI();
    syncIfEnabled.mockResolvedValueOnce({ pushed: 5, pulled: 5, applied: 0 });
    fireEvent.click(screen.getByText("Sync now"));
    await waitFor(() => expect(screen.getByText(/Up to date/)).toBeInTheDocument());
  });

  it("surfaces a server error without losing local data", async () => {
    render(<SyncSettings />);
    syncIfEnabled.mockRejectedValueOnce(new Error("boom"));
    await enableViaUI();
    expect(screen.getByText(/safe on this device/)).toBeInTheDocument();
    expect(screen.getByText("Sync is on")).toBeInTheDocument(); // still enabled locally
  });

  it("copies the revealed phrase to the clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    render(<SyncSettings />);
    await enableViaUI();
    fireEvent.click(screen.getByText("Show phrase"));
    fireEvent.click(screen.getByText("Copy"));
    expect(writeText).toHaveBeenCalled();
  });

  it("turning off forgets the secret and returns to setup", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SyncSettings />);
    await enableViaUI();
    fireEvent.click(screen.getByText("Turn off sync"));
    await waitFor(() => expect(screen.getByText("Set up sync")).toBeInTheDocument());
    expect(localStorage.getItem("ul.sync.secret")).toBeNull();
  });
});
