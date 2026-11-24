import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionsView } from "./CollectionsView";

beforeEach(() => {
  localStorage.setItem("ul.collections", JSON.stringify([{ id: "c1", name: "My", ayahs: [] }]));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
});
afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

const stored = () => JSON.parse(localStorage.getItem("ul.collections")!)[0].name;

describe("CollectionsView — renaming", () => {
  it("keeps spaces while typing and saves on Enter", async () => {
    render(<CollectionsView />);
    const box = await screen.findByRole("textbox", { name: "Collection name" });
    await userEvent.type(box, " favourites{Enter}");
    expect(box).toHaveValue("My favourites");
    await waitFor(() => expect(stored()).toBe("My favourites"));
  });

  it("lets the name be cleared to retype, and restores it if left empty", async () => {
    render(<CollectionsView />);
    const box = await screen.findByRole("textbox", { name: "Collection name" });
    await userEvent.clear(box);
    expect(box).toHaveValue("");
    await userEvent.tab(); // blur with nothing typed
    expect(box).toHaveValue("My");
    expect(stored()).toBe("My");
  });
});
