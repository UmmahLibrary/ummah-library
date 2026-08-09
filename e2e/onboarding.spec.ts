import { test, expect } from "@playwright/test";

// Every other spec starts pre-onboarded (see playwright.config.ts); this one
// opts back out to exercise the actual first-run experience.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("First-run onboarding", () => {
  test("shows on first visit, advances through slides, and doesn't reappear after finishing", async ({
    page,
  }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog", { name: "Welcome to Ummah Library" });
    await expect(dialog).toBeVisible();
    await expect(page.getByText("The Qur’ān, beautifully open")).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Memorize with confidence")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Your faith companion")).toBeVisible();

    await page.getByRole("button", { name: "Get started" }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(dialog).not.toBeAttached();
  });

  test("Skip dismisses the intro immediately", async ({ page }) => {
    await page.goto("/");

    const dialog = page.getByRole("dialog", { name: "Welcome to Ummah Library" });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(dialog).toBeHidden();
  });
});
