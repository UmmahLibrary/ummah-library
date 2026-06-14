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

    // The Hifz dashboard now lists it as due, with a review CTA.
    await page.goto("/hifz");
    await expect(page.getByText(/1 āyah ready for review/)).toBeVisible();

    // Start the review session — the fresh card is due now.
    await page.getByRole("link", { name: /Start review/ }).click();
    await expect(page.getByText(/0 \/ 1/)).toBeVisible();

    // Reveal and rate it — the queue empties.
    await page.getByRole("button", { name: /Reveal/ }).click();
    await page.getByRole("button", { name: "Good" }).click();
    await expect(page.getByText(/All caught up/)).toBeVisible();
  });
});
