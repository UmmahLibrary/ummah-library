import { test, expect } from "@playwright/test";

test.describe("Hifz memorization", () => {
  test("adding an āyah from the reader makes it due, and rating clears it", async ({ page }) => {
    await page.goto("/surah/1");

    // Track the first āyah for memorization via the per-āyah "More" menu.
    await page.getByRole("button", { name: "More" }).first().click();
    await page.getByRole("button", { name: "Memorize" }).click();
    // The action confirms, then the menu's entry flips to "Stop memorizing".
    await expect(page.getByText("Added to Hifz")).toBeVisible();
    await page.getByRole("button", { name: "More" }).first().click();
    await expect(page.getByRole("button", { name: "Stop memorizing" })).toBeVisible();

    // It now appears on the review page, due immediately (a fresh card is due now).
    await page.goto("/hifz");
    await expect(page.getByText(/Reviewing 1 \/ 1 due/)).toBeVisible();

    // Reveal and rate it — the queue empties.
    await page.getByRole("button", { name: /Reveal/ }).click();
    await page.getByRole("button", { name: "Good" }).click();
    await expect(page.getByText(/All caught up/)).toBeVisible();
  });
});
