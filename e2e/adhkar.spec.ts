import { test, expect } from "@playwright/test";

test.describe("Adhkar counter", () => {
  test("counts a dhikr, persists it across reload, and switches sets", async ({ page }) => {
    await page.goto("/adhkar");

    const firstCard = page.locator("button.adhkar-card").first();
    await expect(firstCard).toContainText(/0 \/ \d+/);

    // Tapping the card advances its tally.
    await firstCard.click();
    await expect(firstCard).toContainText(/1 \/ \d+/);

    // The tally survives a reload (kept on-device).
    await page.reload();
    await expect(page.locator("button.adhkar-card").first()).toContainText(/1 \/ \d+/);

    // The Evening tab selects the evening set.
    const evening = page.getByRole("tab", { name: /Evening/ });
    await evening.click();
    await expect(evening).toHaveAttribute("aria-selected", "true");
  });
});
