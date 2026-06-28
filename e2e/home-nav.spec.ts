import { test, expect } from "@playwright/test";

test.describe("Home navigation", () => {
  test("opening a surah from the home list lands in the reader", async ({ page }) => {
    // A cold `next dev` compile of "/" and then /surah/[number] under CI load can
    // be slow; triple the budget so this navigation doesn't flake near a tight
    // timeout (it was occasionally exceeding the old 30s waits).
    test.slow();
    await page.goto("/");

    // The surah index row for Al-Fātiḥah ("The Opening"). The home page also shows
    // a "Start reading" card linking to the same surah (it defaults to Al-Fātiḥah
    // when there's no last-read), so match the index row's distinctive "· N ayahs"
    // subtitle — the card reads "· Juzʾ N" instead — to keep the locator unique.
    const opening = page.getByRole("link", { name: /The Opening · \d+ ayahs/ });
    await expect(opening).toBeVisible({ timeout: 30_000 });
    await opening.click();

    // We land on the surah-1 reader, with its mode chrome present. Generous
    // timeouts so a cold dev-server compile of /surah/[number] doesn't flake.
    await page.waitForURL(/\/surah\/1$/, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: "Verse" })).toBeVisible({ timeout: 60_000 });
  });
});
