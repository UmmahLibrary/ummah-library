import { test, expect } from "@playwright/test";

test.describe("Hadith library", () => {
  test("drilling into a collection shows its hadiths", async ({ page }) => {
    // Stub the internal hadith API so the test owns the content.
    await page.route(/\/api\/v1\/hadith\/.+\/sections\//, (route) =>
      route.fulfill({
        json: {
          collectionId: "eng-bukhari",
          section: 1,
          name: "Revelation",
          hadiths: [
            { number: 1, text: "Actions are judged by intentions.", grades: ["Sahih"], reference: { book: 1, hadith: 1 } },
          ],
        },
      }),
    );

    await page.goto("/hadith");

    // Collection cards render; open Bukhari.
    const bukhari = page.getByRole("button", { name: /Ṣaḥīḥ al-Bukhārī/ });
    await expect(bukhari).toBeVisible();
    await bukhari.click();

    // Drilled-in view: a back link + the stubbed hadith.
    await expect(page.getByRole("button", { name: /Collections/ })).toBeVisible();
    await expect(page.getByText(/Actions are judged by intentions/)).toBeVisible();
  });
});
