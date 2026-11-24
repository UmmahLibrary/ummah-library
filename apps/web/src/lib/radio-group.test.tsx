import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onRadioGroupKeyDown, radioTabIndex } from "./radio-group";

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
