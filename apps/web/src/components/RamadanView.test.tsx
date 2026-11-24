import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RamadanView } from "./RamadanView";

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("RamadanView", () => {
  it("offers the daily worship checklist only during Ramaḍān", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 24, 12)); // 13 Jumādā al-Ākhirah 1448
    const { unmount } = render(<RamadanView />);
    expect(await screen.findByText(/Fasting · Ramaḍān 1447/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tarāwīḥ/ })).toBeNull();
    unmount();

    vi.setSystemTime(new Date(2027, 1, 15, 12)); // in Ramaḍān 1448
    render(<RamadanView />);
    expect(await screen.findByRole("button", { name: /Tarāwīḥ/ })).toBeInTheDocument();
  });
});
