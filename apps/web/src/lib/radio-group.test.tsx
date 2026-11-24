import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onRadioGroupKeyDown, onTabListKeyDown, radioTabIndex } from "./radio-group";

function Group() {
  const [v, setV] = useState("b");
  const opts = ["a", "b", "c"];
  return (
    <div role="radiogroup" aria-label="Pick" onKeyDown={onRadioGroupKeyDown}>
      {opts.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={v === o}
          tabIndex={radioTabIndex(v === o, i, true)}
          onClick={() => setV(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

describe("radio group keyboard", () => {
  it("is one tab stop, and arrows move and select (wrapping)", async () => {
    render(
      <>
        <Group />
        <button type="button">after</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "b" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "c" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "c" })).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "a" })).toHaveAttribute("aria-checked", "true");
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });
});

describe("tab list keyboard", () => {
  it("moves between tabs with the arrow keys", async () => {
    function Tabs() {
      const [v, setV] = useState("x");
      return (
        <div role="tablist" aria-label="Tabs" onKeyDown={onTabListKeyDown}>
          {["x", "y"].map((o) => (
            <button
              key={o}
              type="button"
              role="tab"
              aria-selected={v === o}
              tabIndex={v === o ? 0 : -1}
              onClick={() => setV(o)}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    render(<Tabs />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "y" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "y" })).toHaveAttribute("aria-selected", "true");
  });
});
