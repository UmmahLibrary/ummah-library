import { test, expect } from "@playwright/test";

test.describe("Bookmarks", () => {
  test("renders a stored collection and persists a rename", async ({ page }) => {
    // Seed a collection + note before the app loads.
    await page.addInitScript(() => {
      localStorage.setItem(
        "ul.collections",
        JSON.stringify([{ id: "c1", name: "Favourites", ayahs: [{ sura: 1, aya: 1 }] }]),
      );
      localStorage.setItem("ul.ayahNotes", JSON.stringify({ "1:1": "The opening" }));
    });

    await page.goto("/bookmarks");

    // The seeded collection + its āyah + note render.
    const nameInput = page.locator("input.collection-name");
    await expect(nameInput).toHaveValue("Favourites");
    await expect(page.getByText("1:1")).toBeVisible();
    await expect(page.getByText("The opening")).toBeVisible();

    // Renaming round-trips back to localStorage.
    await nameInput.fill("My Favourites");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const cols = JSON.parse(localStorage.getItem("ul.collections") ?? "[]");
          return cols[0]?.name;
        }),
      )
      .toBe("My Favourites");
  });
});
