import { test, expect } from "@playwright/test";

test.describe("Home navigation", () => {
  test("opening a surah from the home list lands in the reader", async ({ page }) => {
    await page.goto("/");

    // The surah index lists Al-Fātiḥah ("The Opening").
    const opening = page.getByRole("link", { name: /The Opening/ });
    await expect(opening).toBeVisible();
    await opening.click();

    // We land on the surah-1 reader, with its mode chrome present.
    await expect(page).toHaveURL(/\/surah\/1$/);
    await expect(page.getByRole("button", { name: "Verse" })).toBeVisible();
  });
});
