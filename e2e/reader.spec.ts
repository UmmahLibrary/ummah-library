import { test, expect } from "@playwright/test";

test.describe("Surah reader", () => {
  test("offers every reciter and wires the selected one to playback", async ({ page }) => {
    // Never hit a real CDN: stub the quran.com timing API and any audio file.
    await page.route(/api\.quran\.com\/.*by_key/, (route) =>
      route.fulfill({
        json: { verse: { audio: { url: "Alafasy/mp3/001001.mp3", segments: [] } } },
      }),
    );
    await page.route(/\.mp3(\?.*)?$/, (route) =>
      route.fulfill({ status: 200, contentType: "audio/mpeg", body: "" }),
    );

    await page.goto("/surah/1");

    // Reader chrome is present.
    await expect(page.getByRole("button", { name: "Verse" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mushaf" })).toBeVisible();

    // The audio dock's reciter selector lists all 8 reciters. (A select's text
    // content includes its option labels, so filter by one reciter's name.)
    const reciter = page.locator("select").filter({ hasText: "Mishary Rashid Alafasy" });
    await expect(reciter.locator("option")).toHaveCount(8);

    // Selecting a reciter persists the choice...
    await reciter.selectOption({ label: "Saud Al-Shuraim" });
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("ul.reciter")))
      .toBe("shuraym");

    // ...and playing an āyah wires THAT reciter to playback. The player prefers
    // the bundled quran-align word-timings over the live quran.com API for covered
    // reciters like Shuraim (ADR 0036), so it loads Shuraim's bundled timings.
    const timingRequest = page.waitForRequest(
      /\/api\/v1\/recitations\/shuraym\/surahs\/\d+\/timings/,
    );
    await page.locator("[data-play-one]").first().click();
    await timingRequest;
  });
});
