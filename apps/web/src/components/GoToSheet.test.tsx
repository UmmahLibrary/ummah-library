import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoToSheet } from "./GoToSheet";

const names = [
  { number: 1, name: "الفاتحة", transliteration: "Al-Faatiha", englishName: "The Opening" },
  { number: 2, name: "البقرة", transliteration: "Al-Baqara", englishName: "The Cow" },
];

describe("GoToSheet", () => {
  it("pressing Enter on an unrecognised place explains why nothing happened", async () => {
    const onGo = vi.fn();
    render(<GoToSheet open onClose={() => {}} names={names} onGo={onGo} />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "2:999{Enter}");

    expect(onGo).not.toHaveBeenCalled();
    expect(screen.getByText(/isn't a place in the Quran/)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("pressing Enter on a valid place goes there", async () => {
    const onGo = vi.fn();
    const onClose = vi.fn();
    render(<GoToSheet open onClose={onClose} names={names} onGo={onGo} />);

    await userEvent.type(screen.getByRole("textbox"), "2:255{Enter}");

    expect(onGo).toHaveBeenCalledWith(expect.objectContaining({ sura: 2, aya: 255 }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("GoToSheet layout on phones", () => {
  it("keeps the sheet's grid column no wider than the screen", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const css = readFileSync(join(__dirname, "../app/noor-everyone.css"), "utf8");
    const root = css.match(/\.goto-root \{[^}]*\}/)?.[0] ?? "";
    // An auto track grew to the content's min width (466px on a 375px phone in
    // Arabic), pushing Close, Go and the Page tab off screen.
    expect(root).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    const sheet = css.match(/\.goto-sheet \{[^}]*\}/)?.[0] ?? "";
    expect(sheet).toMatch(/min-width:\s*0/);
  });
});
