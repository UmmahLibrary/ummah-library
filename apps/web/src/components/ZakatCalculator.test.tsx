import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZakatCalculator } from "./ZakatCalculator";

describe("ZakatCalculator", () => {
  it("computes 2.5% on net wealth once prices set the niṣāb", async () => {
    render(<ZakatCalculator />);

    await userEvent.type(screen.getByPlaceholderText("e.g. 75"), "75"); // gold price / gram
    await userEvent.type(screen.getByPlaceholderText("e.g. 0.85"), "0.85"); // silver price / gram
    await userEvent.type(screen.getAllByPlaceholderText("0")[0]!, "10000"); // cash & bank

    expect(screen.getByText("$250.00")).toBeInTheDocument(); // 2.5% of 10,000
    // Total assets and Net zakatable both read $10,000.00 (no liabilities).
    expect(screen.getAllByText("$10,000.00").length).toBeGreaterThan(0);
  });

  it("keeps the gold/silver prices and niṣāb basis when Reset amounts is clicked", async () => {
    render(<ZakatCalculator />);

    await userEvent.type(screen.getByPlaceholderText("e.g. 75"), "75");
    await userEvent.type(screen.getByPlaceholderText("e.g. 0.85"), "0.85");
    await userEvent.type(screen.getAllByPlaceholderText("0")[0]!, "10000");
    await userEvent.click(screen.getByRole("button", { name: "Gold (higher)" }));

    await userEvent.click(screen.getByRole("button", { name: "Reset amounts" }));

    expect(screen.getByPlaceholderText("e.g. 75")).toHaveValue("75");
    expect(screen.getByPlaceholderText("e.g. 0.85")).toHaveValue("0.85");
    expect(screen.getByText("Niṣāb (gold)")).toBeInTheDocument(); // basis stayed "gold", not reset to "silver"
    expect(screen.getAllByPlaceholderText("0")[0]).toHaveValue("");
  });

  it("blocks a minus sign in an amount field instead of silently ignoring it", async () => {
    render(<ZakatCalculator />);

    await userEvent.type(screen.getAllByPlaceholderText("0")[0]!, "-500");

    expect(screen.getAllByPlaceholderText("0")[0]).toHaveValue("500");
  });
});
