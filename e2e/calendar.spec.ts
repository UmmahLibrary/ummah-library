import { test, expect } from "@playwright/test";

test.describe("Hijri calendar", () => {
  test("renders the current month and navigates between months", async ({ page }) => {
    await page.goto("/calendar");

    // Scope to the nav row holding the Prev/Next buttons so we target the month
    // heading — not the app header's (unchanging) "today" Hijri label.
    const navRow = page
      .locator("div")
      .filter({ has: page.getByRole("button", { name: "Next month" }) })
      .filter({ has: page.getByRole("button", { name: "Previous month" }) })
      .last();
    const heading = navRow.getByText(/\d{3,4} AH/);

    await expect(heading).toBeVisible();
    const before = (await heading.textContent())!;

    // Stepping forward a month changes the heading.
    await page.getByRole("button", { name: "Next month" }).click();
    await expect.poll(async () => await heading.textContent()).not.toBe(before);

    // Stepping back returns to where we started.
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect.poll(async () => await heading.textContent()).toBe(before);
  });
});
