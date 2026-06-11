import { test, expect } from "@playwright/test";

// Central London — used as the mocked device location.
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

test.describe("Location-aware tools", () => {
  test("prayer times render after granting location", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation(LONDON);

    await page.goto("/prayer-times");
    await page.getByRole("button", { name: /Use my location/ }).click();

    // The internal prayer-times API computes a schedule for the mocked location.
    await expect(page.getByText("Next prayer")).toBeVisible({ timeout: 15_000 });
  });

  test("qibla bearing renders after granting location", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation(LONDON);

    await page.goto("/qibla");
    await page.getByRole("button", { name: /Use my location/ }).click();

    // `exact` avoids also matching the <title> "Qibla direction · Ummah Library".
    await expect(page.getByText("Qibla direction", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\d+° [NESW]/).first()).toBeVisible(); // e.g. "119° SE"
  });
});
