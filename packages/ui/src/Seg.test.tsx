import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Seg } from "./Seg";

describe("Seg", () => {
  it("renders every option and reports the clicked value", async () => {
    const onChange = vi.fn();
    render(
      <Seg
        value="verse"
        onChange={onChange}
        options={[
          { value: "verse", label: "Verse" },
          { value: "reading", label: "Reading" },
          { value: "mushaf", label: "Mushaf" },
        ]}
      />,
    );

    for (const label of ["Verse", "Reading", "Mushaf"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole("button", { name: "Mushaf" }));
    expect(onChange).toHaveBeenCalledWith("mushaf");
  });

  it("supports plain string options", async () => {
    const onChange = vi.fn();
    render(<Seg value="a" onChange={onChange} options={["a", "b"]} />);

    await userEvent.click(screen.getByRole("button", { name: "b" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
