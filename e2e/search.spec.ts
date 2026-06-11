import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("loads suggestions and returns matching verses", async ({ page }) => {
    // Stub the two index sources so the test owns the corpus (no external deps).
    await page.route(/\/api\/v1\/search\/corpus/, (route) =>
      route.fulfill({ json: { verses: [{ s: 112, a: 1, t: "قُلْ هُوَ اللَّهُ أَحَدٌ" }] } }),
    );
    await page.route(/eng-mustafakhattaba/, (route) =>
      route.fulfill({
        json: { quran: [{ chapter: 112, verse: 1, text: "Say, He is Allah, the One." }] },
      }),
    );

    await page.goto("/search");

    // Suggested pills appear once the index is ready.
    await expect(page.getByRole("button", { name: "Mercy" })).toBeVisible();

    // A query matching the fixture returns a result.
    await page.getByRole("searchbox").fill("Allah");
    await expect(page.getByText(/result/)).toBeVisible();
    await expect(page.getByText(/He is Allah/)).toBeVisible();
  });
});
