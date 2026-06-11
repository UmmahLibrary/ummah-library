import { test, expect } from "@playwright/test";

test.describe("Tasbih counter", () => {
  test("counts taps and remembers them across reloads", async ({ page }) => {
    await page.goto("/tasbih");

    // The dial is a button whose accessible name tracks the running count.
    const dial = page.getByRole("button", { name: /Count/ });
    await dial.click();
    await dial.click();
    await dial.click();
    await expect(page.getByRole("button", { name: /Count.*3 of/ })).toBeVisible();

    // The count survives a reload (persisted to localStorage).
    await page.reload();
    await expect(page.getByRole("button", { name: /Count.*3 of/ })).toBeVisible();
  });
});
