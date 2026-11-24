import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("AyahActions — keyboard", () => {
  it("moves focus into the More menu, arrows through it, and Escape returns to More", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    await userEvent.click(moreButton());

    expect(screen.getByRole("menuitem", { name: "Copy verse" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Copy link" })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Add a reflection" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Copy verse" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(moreButton()).toHaveFocus();
  });

  it("Escape closes the Save panel and gives focus back to Save", async () => {
    render(<AyahActions surah={1} aya={1} tafsirs={[]} />);
    const save = screen.getByRole("button", { name: "Save" });
    await userEvent.click(save);
    expect(screen.getByRole("dialog", { name: "Save āyah" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Save āyah" })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });
});

describe("AyahActions — Copy verse", () => {
  it("copies the Arabic and real translations, never the 'no translation' note", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <div id="7:1" className="ayah">
        <p className="ayah-ar">المص</p>
        <p className="ayah-tr">
          <span className="tr-missing">Irfan-ul-Quran has no translation for this āyah.</span>
        </p>
        <p className="ayah-tr">Alif-Lãm-Mĩm-Ṣãd.</p>
        <AyahActions surah={7} aya={1} tafsirs={[]} />
      </div>,
    );
    await userEvent.click(moreButton());
    await userEvent.click(screen.getByRole("menuitem", { name: "Copy verse" }));
    expect(writeText).toHaveBeenCalledWith("المص\nAlif-Lãm-Mĩm-Ṣãd.\n— 7:1");
  });
});

describe("AyahActions — confirmations", () => {
  it("keeps its live status mounted so 'Copied' is announced when it appears", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(
      <div id="1:1" className="ayah">
        <p className="ayah-ar">بسم</p>
        <AyahActions surah={1} aya={1} tafsirs={[]} />
      </div>,
    );
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await userEvent.click(moreButton());
    await userEvent.click(screen.getByRole("menuitem", { name: "Copy verse" }));
    await waitFor(() => expect(status).toHaveTextContent(/copied/i));
  });
});
