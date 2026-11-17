import { test, expect } from "@playwright/test";

// Every other spec starts pre-onboarded (see playwright.config.ts); this one
// opts back out to exercise the actual first-run experience.
test.use({ storageState: { cookies: [], origins: [] } });

// The setup (ADR 0041) is six short steps: language, script, translation, text
// size, theme, and how the reader takes in the Quran. The dialog is named by the
// current step's question.
const STEP_TITLES = [
  "Choose your language",
  "Which looks like your mushaf?",
  "Which translation would you like?",
  "Make the text comfortable",
  "Light or dark?",
  "How do you usually take in the Quran?",
];

test.describe("First-run onboarding", () => {
  test("shows on first visit, walks through every step, and doesn't reappear after finishing", async ({
    page,
  }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (const [n, title] of STEP_TITLES.entries()) {
      await expect(dialog).toHaveAccessibleName(title);
      await expect(dialog.getByText(`Step ${n + 1} of ${STEP_TITLES.length}`)).toBeVisible();
      const last = n === STEP_TITLES.length - 1;
      await dialog.getByRole("button", { name: last ? "Start reading" : "Next" }).click();
    }
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.getByRole("dialog")).not.toBeAttached();
  });

  test("Skip dismisses the setup immediately", async ({ page }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog", { name: STEP_TITLES[0] });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Skip, use these settings" }).click();
    await expect(dialog).toBeHidden();
  });
});
