import { test, expect } from "@playwright/test";

test.describe("Hifz memorization", () => {
  test("adding an āyah from the reader makes it due, and rating clears it", async ({ page }) => {
    await page.goto("/surah/1");

    // Track the first āyah for memorization; the button flips state.
    const add = page.getByRole("button", { name: /Hifz/ }).first();
    await add.click();
    await expect(page.getByRole("button", { name: /Memorizing/ }).first()).toBeVisible();

    // It now appears on the review page, due immediately (a fresh card is due now).
    await page.goto("/hifz");
    await expect(page.getByText(/Reviewing 1 \/ 1 due/)).toBeVisible();

    // Reveal and rate it — the queue empties.
    await page.getByRole("button", { name: /Reveal/ }).click();
    await page.getByRole("button", { name: "Good" }).click();
    await expect(page.getByText(/All caught up/)).toBeVisible();
  });
});
