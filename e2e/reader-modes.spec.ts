import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const readingMode = (page: Page) =>
  page.evaluate(() => document.documentElement.dataset.readingMode);

test.describe("Reader display modes", () => {
  test("switching Verse / Reading / Mushaf drives the document reading mode", async ({ page }) => {
    await page.goto("/surah/1");

    // Default view is verse-by-verse translation.
    await expect(page.getByRole("button", { name: "Verse" })).toBeVisible();
    await expect.poll(() => readingMode(page)).toBe("translation");

    // Mushaf → continuous Arabic with inline translations.
    await page.getByRole("button", { name: "Mushaf" }).click();
    await expect.poll(() => readingMode(page)).toBe("reading-tr");

    // Reading → continuous Arabic only.
    await page.getByRole("button", { name: "Reading" }).click();
    await expect.poll(() => readingMode(page)).toBe("reading");

    // The choice survives a reload (persisted to localStorage).
    await page.reload();
    await expect.poll(() => readingMode(page)).toBe("reading");
  });
});
