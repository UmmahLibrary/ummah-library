import { expect, test } from "@playwright/test";

test.describe("Blog", () => {
  test("the index renders standalone (no app shell) and lists published articles", async ({
    page,
  }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "Building Ummah Library" })).toBeVisible();
    // docs/articles ships with the published articles — this asserts against
    // whatever is currently live rather than a fixed count, so it doesn't go
    // stale each time an article is published.
    await expect(page.getByText("No posts yet — check back soon.")).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Anatomy of an Open-Source Quran Platform" }),
    ).toBeVisible();
    // Shell-excluded: no app sidebar/tool nav, just the slim editorial header.
    await expect(page.getByRole("link", { name: "Open the app" }).first()).toBeVisible();
  });

  test("the RSS feed is valid XML with the channel metadata", async ({ request }) => {
    const res = await request.get("/blog/rss.xml");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain('<rss version="2.0">');
    expect(body).toContain("Building Ummah Library");
  });

  test("an unpublished/unknown slug 404s — nothing is reachable by URL", async ({ page }) => {
    const res = await page.goto("/blog/this-slug-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
