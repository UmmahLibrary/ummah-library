import { test, expect } from "@playwright/test";

test.describe("Hadith library", () => {
  test("filtering to a collection shows its hadiths", async ({ page }) => {
    // The browser prefetches each collection's static file and searches/filters
    // client-side (ADR 0022). Stub those fetches so the test owns the content:
    // Bukhārī carries our hadith; the rest come back empty.
    await page.route(/\/api\/v1\/hadith\/[^/]+$/, (route) => {
      const id = route.request().url().split("/").pop() ?? "";
      const hadiths =
        id === "eng-bukhari"
          ? [
              {
                collectionId: "eng-bukhari",
                number: 1,
                text: "Actions are judged by intentions.",
                grades: ["Sahih"],
                reference: { book: 1, hadith: 1 },
              },
            ]
          : [];
      route.fulfill({
        json: { collectionId: id, name: id, sections: { "1": "Revelation" }, hadiths },
      });
    });

    await page.goto("/hadith");

    // Collection cards render; open Bukhārī (sets the book filter).
    const bukhari = page.getByRole("button", { name: /Ṣaḥīḥ al-Bukhārī/ });
    await expect(bukhari).toBeVisible();
    await bukhari.click();

    // The filtered results list shows the stubbed hadith.
    await expect(page.getByText(/Actions are judged by intentions/)).toBeVisible();
  });
});
