import { test, expect } from "@playwright/test";

test.describe("Home navigation", () => {
  test("opening a surah from the home list lands in the reader", async ({ page }) => {
    // A cold `next dev` compile of /surah/[number] under CI load can be slow, so
    // give this navigation a generous budget.
    test.slow();
    await page.goto("/");

    // The surah index row for Al-Fātiḥah ("The Opening"). The home page also shows
    // a "Start reading" card linking to the same surah (it defaults to Al-Fātiḥah
    // when there's no last-read), so match the index row's distinctive "· N ayahs"
    // subtitle — the card reads "· Juzʾ N" instead — to keep the locator unique.
    const opening = page.getByRole("link", { name: /The Opening · \d+ ayahs/ });
    await expect(opening).toBeVisible({ timeout: 30_000 });
    await opening.click();

    // Poll the URL (no `load`-event dependency — a client-side nav never fires
    // one). A cold /surah/[number] compile under CI load can be slow, so allow
    // 45s. If the first click was swallowed before the App Router hydrated (the
    // anchor's default nav is prevented but the client nav doesn't fire, leaving
    // us on "/"), click once more — only after that long wait, so we never
    // interrupt a slow-but-real navigation (re-clicking mid-nav would livelock it).
    const surah1 = /\/surah\/1$/;
    const landed = await expect(page)
      .toHaveURL(surah1, { timeout: 45_000 })
      .then(() => true, () => false);
    if (!landed) {
      await opening.click().catch(() => {});
      await expect(page).toHaveURL(surah1, { timeout: 45_000 });
    }

    // Reader chrome confirms we landed (the cold /surah/[number] compile can be slow).
    await expect(page.getByRole("button", { name: "Verse" })).toBeVisible({ timeout: 60_000 });
  });
});
