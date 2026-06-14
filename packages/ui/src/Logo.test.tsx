import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the wordmark and the Khatam star", () => {
    const { container } = render(<Logo />);

    // The wordmark splits "Ummah" + " Library" across nested spans.
    expect(container.textContent).toContain("Ummah");
    expect(container.textContent).toContain("Library");
    // The Khatam motif is an inline SVG.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("fires onClick when provided", async () => {
    const onClick = vi.fn();
    const { container } = render(<Logo onClick={onClick} />);

    await userEvent.click(container.firstElementChild as Element);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
