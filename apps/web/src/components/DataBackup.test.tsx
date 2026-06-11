import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataBackup } from "./DataBackup";

describe("DataBackup", () => {
  it("explains the merge strategy and switches copy when toggled", async () => {
    render(<DataBackup />);

    // Defaults to "replace".
    expect(screen.getByText(/fully restores your data/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Keep mine on conflict" }));

    expect(screen.getByText(/only fills in things you don/)).toBeInTheDocument();
    expect(screen.queryByText(/fully restores your data/)).not.toBeInTheDocument();
  });

  it("counts only the ul.* items stored on this device", async () => {
    localStorage.setItem("ul.alpha", "1");
    localStorage.setItem("ul.beta", "2");
    localStorage.setItem("other.key", "ignored"); // not ul.* — excluded from the count

    render(<DataBackup />);

    // The count is read after mount to avoid a hydration mismatch.
    expect(await screen.findByText(/2 items stored on this device/)).toBeInTheDocument();
  });
});
