import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility regression gate.
 *
 * A Lighthouse sweep (qa/QA_LOG.md, 2026-06-30) found five WCAG failures spread
 * across every route — contrast on the faint token, unnamed icon-only buttons,
 * an unlabelled `<select>`. Those were fixed one at a time over the following
 * months, but nothing stopped them coming back: the audit was a one-off run by
 * hand, so the only record that a route was ever clean was a paragraph in a log.
 *
 * This spec turns that sweep into a gate. It asserts zero WCAG 2.1 A/AA
 * violations across a representative slice of the app — the reader, the tools,
 * the trackers and the content browsers — so a regression fails CI on the PR
 * that introduces it rather than surfacing in the next manual audit.
 *
 * Scope note: axe catches machine-checkable failures only (contrast, names,
 * roles, labels). It is a floor, not a substitute for keyboard and
 * screen-reader passes.
 */

/** A slice wide enough to cover every shared shell component and each distinct
 *  page shape, without paying for all ~1,560 prerendered routes. */
const ROUTES = [
  "/",
  "/surah/2",
  "/page/1",
  "/juz/1",
  "/search",
  "/hadith",
  "/tafsir",
  "/names",
  "/duas",
  "/adhkar",
  "/prayer-times",
  "/qibla",
  "/calendar",
  "/tracker",
  "/ramadan",
  "/zakat",
  "/tasbih",
  "/mosques",
  "/hifz",
  "/goals",
  "/plans",
  "/collections",
  "/bookmarks",
  "/profile",
  "/downloads",
  "/settings",
  "/tools",
  "/blog",
];

test.describe("Accessibility (axe, WCAG 2.1 A/AA)", () => {
  for (const route of ROUTES) {
    test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
      // A cold `next dev` compile of a heavy route under CI load can be slow.
      test.slow();
      await page.goto(route);

      // Client components hydrate after first paint and several of these routes
      // render their real content only then (trackers read localStorage, the
      // reader mounts its audio dock). Scanning before that measures a skeleton.
      //
      // Deliberately NOT `networkidle`: the reader routes never reach it. The
      // audio dock prefetches, translations stream in per ayah, and word timings
      // load lazily, so /surah, /juz and /tafsir keep a request in flight past
      // any timeout. Wait for `load`, then give hydration a bounded settle.
      await page.waitForLoadState("load");
      await page.waitForTimeout(2000);

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Name the rule and the offending markup in the failure message — an
      // assertion that only says "expected 0, got 3" costs a debugging round.
      const summary = violations.map(
        (v) =>
          `${v.id} [${v.impact}] ${v.nodes.length} node(s)\n` +
          v.nodes.map((n) => `      ${n.html.replace(/\s+/g, " ").slice(0, 160)}`).join("\n"),
      );
      expect(summary, `axe violations on ${route}:\n  ${summary.join("\n  ")}`).toEqual([]);
    });
  }
});
