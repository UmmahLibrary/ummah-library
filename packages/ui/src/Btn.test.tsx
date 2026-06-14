import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Btn } from "./Btn";

describe("Btn", () => {
  it("renders its children and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>Open the app</Btn>);

    await userEvent.click(screen.getByRole("button", { name: /Open the app/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders an icon alongside the label when given one", () => {
    render(
      <Btn icon="book" variant="ghost">
        Start reading
      </Btn>,
    );
    const button = screen.getByRole("button", { name: /Start reading/ });
    expect(button.querySelector("svg")).not.toBeNull();
  });
});
