import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReaderToolbar } from "./ReaderToolbar";

describe("ReaderToolbar — Text panel placement", () => {
  it("lines up with the button's inline end on every screen size, so it opens inward", () => {
    const { container } = render(
      <ReaderToolbar
        surahNumber={1}
        reciters={[]}
        tafsirs={[]}
        segValue="translation"
        segOptions={[{ value: "translation", label: "Verse by verse" }]}
        onSeg={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Text" }));

    const panel = screen.getByText("Text size").parentElement as HTMLElement;
    expect(panel.style.insetInlineEnd).toBe("0");
    // No phone-only override pinning it to the left edge (it ran off-screen).
    expect(panel.className).not.toMatch(/pop-sm-left/);
    expect(container.querySelector(".noor-pop-sm-left")).toBeNull();
  });

  it("closes on Escape and gives focus back to the Text button", () => {
    render(
      <ReaderToolbar
        surahNumber={1}
        reciters={[]}
        tafsirs={[]}
        segValue="translation"
        segOptions={[{ value: "translation", label: "Verse by verse" }]}
        onSeg={() => {}}
      />,
    );
    const btn = screen.getByRole("button", { name: "Text" });
    btn.focus();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(window, { key: "Escape" });

    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveFocus();
  });
});
