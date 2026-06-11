import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HijriToday } from "./HijriToday";

describe("HijriToday", () => {
  it("renders today's Hijri date as a link to the calendar", () => {
    render(<HijriToday />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/calendar");
    expect(link).toHaveTextContent("🌙");
    // The formatted label carries a Hijri year (3–4 digits).
    expect(link).toHaveTextContent(/\d{3,4}/);
  });
});
