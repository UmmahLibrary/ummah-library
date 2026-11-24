import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../lib/catalogue", () => ({
  fetchCatalogue: async () => [
    { id: "eng-mustafakhattaba", author: "Mustafa Khattab", language: "English" },
  ],
}));

const { TranslationNotice } = await import("./TranslationNotice");

afterEach(() => localStorage.clear());

describe("TranslationNotice", () => {
  it("after Keep, moves focus to what follows instead of losing it", async () => {
    render(
      <>
        <TranslationNotice />
        <button type="button">Play āyah 1</button>
      </>,
    );
    const keep = await screen.findByRole("button", { name: "Keep this" });
    keep.focus();
    await userEvent.click(keep);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Keep this" })).toBeNull());
    await waitFor(() => expect(screen.getByRole("button", { name: "Play āyah 1" })).toHaveFocus());
  });
});
