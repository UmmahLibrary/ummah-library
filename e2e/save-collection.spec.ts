import { test, expect } from "@playwright/test";

test.describe("Saving an āyah", () => {
  test("creating a collection from the reader shows it in bookmarks", async ({ page }) => {
    await page.goto("/surah/1");

    // Open the save panel on the first āyah.
    await page.getByRole("button", { name: /☆ Save/ }).first().click();

    // Create a new collection — this also saves the current āyah into it.
    await page.getByPlaceholder(/New collection/).first().fill("Reflections");
    await page.getByRole("button", { name: "Add", exact: true }).first().click();

    // The action now reflects the saved state.
    await expect(page.getByRole("button", { name: /★ Saved/ }).first()).toBeVisible();

    // The collection and its āyah appear on the bookmarks page.
    await page.goto("/bookmarks");
    await expect(page.locator("input.collection-name")).toHaveValue("Reflections");
    await expect(page.getByText("1:1")).toBeVisible();
  });
});
