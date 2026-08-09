import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MosqueFinder } from "./MosqueFinder";

const COORDS_KEY = "ul.prayerCoords";
const london = { latitude: 51.5074, longitude: -0.1278 };

const PLACES_RESPONSE = {
  coordinates: london,
  radiusMeters: 5000,
  attribution: "© OpenStreetMap contributors",
  places: [
    {
      id: "osm:node:1",
      name: "East London Mosque",
      coordinates: { latitude: 51.51, longitude: -0.12 },
      address: "82 Whitechapel Road, London",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (navigator as { geolocation?: unknown }).geolocation;
});

describe("MosqueFinder", () => {
  it("prompts for a location when none is saved", () => {
    render(<MosqueFinder />);

    expect(screen.getByRole("button", { name: /Use my location/ })).toBeInTheDocument();
    expect(screen.queryByText(/East London Mosque/)).not.toBeInTheDocument();
  });

  it("always shows the OpenStreetMap attribution", () => {
    render(<MosqueFinder />);
    expect(screen.getByText(/OpenStreetMap contributors/)).toBeInTheDocument();
  });

  it("loads nearby mosques from a saved location", async () => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(london));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(PLACES_RESPONSE) }),
    );

    render(<MosqueFinder />);

    expect(await screen.findByText("East London Mosque")).toBeInTheDocument();
    expect(screen.getByText(/82 Whitechapel Road, London/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Directions/ })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps/dir"),
    );
  });

  it("locates the user and fetches nearby mosques on demand", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: london } as GeolocationPosition),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(PLACES_RESPONSE) }),
    );

    render(<MosqueFinder />);
    await userEvent.click(screen.getByRole("button", { name: /Use my location/ }));

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(await screen.findByText("East London Mosque")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(COORDS_KEY)!)).toMatchObject(london);
  });

  it("shows an empty state distinct from an error when nothing is nearby", async () => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(london));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ...PLACES_RESPONSE, places: [] }) }),
    );

    render(<MosqueFinder />);
    expect(await screen.findByText(/No mosques found within/)).toBeInTheDocument();
  });

  it("shows a distinct error state when the request fails", async () => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(london));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    render(<MosqueFinder />);
    expect(await screen.findByText(/Couldn’t load nearby mosques/)).toBeInTheDocument();
  });

  it("shows an offline message without attempting a request", async () => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(london));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    render(<MosqueFinder />);
    await waitFor(() => expect(screen.getByText(/You’re offline/)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("denies gracefully when geolocation permission is refused", async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error?: PositionErrorCallback) =>
        error?.({ code: 1 } as GeolocationPositionError),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<MosqueFinder />);
    await userEvent.click(screen.getByRole("button", { name: /Use my location/ }));

    expect(await screen.findByText(/Location permission was denied/)).toBeInTheDocument();
  });
});
