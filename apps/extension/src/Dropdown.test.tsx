import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Dropdown } from "./Dropdown";

const OPTIONS = [
  { value: "eng-khattab", label: "The Clear Quran" },
  { value: "eng-sahih", label: "Saheeh International" },
];

afterEach(cleanup);

describe("Dropdown", () => {
  it("shows the current selection on the trigger", () => {
    render(<Dropdown options={OPTIONS} value="eng-sahih" onChange={() => {}} ariaLabel="Translation" />);
    expect(screen.getByRole("button", { name: "Translation" })).toHaveTextContent("Saheeh International");
  });

  it("opens on click and reports the chosen value", () => {
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} value="eng-khattab" onChange={onChange} ariaLabel="Translation" />);

    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Translation" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Saheeh International" }));
    expect(onChange).toHaveBeenCalledWith("eng-sahih");
    expect(screen.queryByRole("listbox")).toBeNull(); // closes after choosing
  });

  it("closes when clicking outside", () => {
    render(
      <div>
        <Dropdown options={OPTIONS} value="eng-khattab" onChange={() => {}} ariaLabel="Translation" />
        <button>outside</button>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Translation" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
