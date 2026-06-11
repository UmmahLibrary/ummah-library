import { test, expect } from "@playwright/test";

test.describe("Settings — data backup", () => {
  test("exports a backup file and imports it back", async ({ page }) => {
    // Seed some local-first data so there's something to back up.
    await page.addInitScript(() => {
      localStorage.setItem("ul.readingGoal", "5");
      localStorage.setItem("ul.theme", "dark");
    });

    await page.goto("/settings");

    // The card reports how many items are stored on this device.
    await expect(page.getByText(/\d+ items? stored on this device/)).toBeVisible();

    // Export → capture the downloaded JSON file.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Export my data/ }).click(),
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();

    // Re-import the same file via the (hidden) file input → success status.
    await page.locator('input[type="file"]').setInputFiles(path);
    await expect(page.getByText(/Restored \d+ items/)).toBeVisible();
  });
});
