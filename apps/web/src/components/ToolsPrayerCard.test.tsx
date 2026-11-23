import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolsPrayerCard } from "./ToolsPrayerCard";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ToolsPrayerCard", () => {
  it("names the saved location's city, not the device's timezone", async () => {
    // London, whatever timezone the test machine runs in.
    localStorage.setItem(
      "ul.prayerCoords",
      JSON.stringify({ latitude: 51.5074, longitude: -0.1278 }),
    );
    const at = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
    const timings = {
      fajr: at(-6),
      sunrise: at(-5),
      dhuhr: at(1),
      asr: at(2),
      maghrib: at(3),
      isha: at(4),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ timings }), { status: 200 })),
    );

    render(<ToolsPrayerCard />);

    expect(await screen.findByText(/· London$/)).toBeInTheDocument();
  });
});
