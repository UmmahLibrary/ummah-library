import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AyahActions } from "./AyahActions";

afterEach(() => vi.restoreAllMocks());

function moreButton() {
  return screen.getByRole("button", { name: /more/i });
}

describe("AyahActions — More menu", () => {
  it("lists its actions as menu items and closes on Escape", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);

    await userEvent.click(moreButton());
    expect(moreButton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Copy verse" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens upwards when the āyah sits just above the bottom dock", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    const btn = moreButton();
    const nearBottom = window.innerHeight - 60;
    vi.spyOn(btn, "getBoundingClientRect").mockReturnValue({
      top: nearBottom - 20,
      bottom: nearBottom,
    } as DOMRect);

    await userEvent.click(btn);
    const menu = screen.getByRole("menu");
    expect(menu.style.bottom).toBe("100%");
    expect(menu.style.top).toBe("");
  });

  it("opens downwards when there is room below", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    const btn = moreButton();
    vi.spyOn(btn, "getBoundingClientRect").mockReturnValue({ top: 80, bottom: 100 } as DOMRect);

    await userEvent.click(btn);
    expect(screen.getByRole("menu").style.top).toBe("100%");
  });

  it("opens toward the side with room when the button is near the screen edge", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    const btn = moreButton();
    const w = window.innerWidth;
    vi.spyOn(btn, "getBoundingClientRect").mockReturnValue({
      top: 80,
      bottom: 100,
      left: w - 70,
      right: w - 20,
    } as DOMRect);

    await userEvent.click(btn);
    const menu = screen.getByRole("menu");
    expect(menu.style.right).toBe("0px");
    expect(menu.style.left).toBe("");
  });

  it("opens in the reading direction when there is room", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    const btn = moreButton();
    vi.spyOn(btn, "getBoundingClientRect").mockReturnValue({
      top: 80,
      bottom: 100,
      left: 40,
      right: 90,
    } as DOMRect);

    await userEvent.click(btn);
    expect(screen.getByRole("menu").style.left).toBe("0px");
  });
});
