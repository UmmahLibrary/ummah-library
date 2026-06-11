import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QiblaCompass } from "./QiblaCompass";

const COORDS_KEY = "ul.prayerCoords";
const london = { latitude: 51.5074, longitude: -0.1278 };

afterEach(() => {
  // Remove any geolocation stub a test installed.
  delete (navigator as { geolocation?: unknown }).geolocation;
});

describe("QiblaCompass", () => {
  it("prompts for a location when none is saved", () => {
    render(<QiblaCompass />);

    expect(screen.getByRole("button", { name: /Use my location/ })).toBeInTheDocument();
    expect(screen.queryByText("Qibla direction")).not.toBeInTheDocument();
  });

  it("renders the qibla bearing from a saved location", () => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(london));
    render(<QiblaCompass />);

    expect(screen.getByText("Qibla direction")).toBeInTheDocument();
    // Bearing renders as "<degrees>° <cardinal>", e.g. "119° ESE".
    expect(screen.getByText(/^\d+° [NESW]+$/)).toBeInTheDocument();
    // The Kaaba marker sits on the needle.
    expect(screen.getByText("🕋")).toBeInTheDocument();
  });

  it("locates the user and persists the coordinates on demand", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: london } as GeolocationPosition),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<QiblaCompass />);
    await userEvent.click(screen.getByRole("button", { name: /Use my location/ }));

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(screen.getByText("Qibla direction")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(COORDS_KEY)!)).toMatchObject(london);
  });
});
