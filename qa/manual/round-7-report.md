# Manual E2E QA - Round 7 (2026-08-21)

First round targeting the **mobile app** (`apps/mobile`, Expo/React Native),
continuing the QA loop after rounds 1-6 covered the web app. Since this
environment doesn't have iOS/Android simulators wired up, the app was run
via `expo start --web` (react-native-web) and driven through the Browser
pane like a normal web page — a new `.claude/launch.json` entry ("mobile",
port 8090) and `.claude/mobile-web-dev.cmd` were added for this. Covered
this round: onboarding, the Home/Read/Tools/Memorize/More tab bar, the
Surah reader (transliteration, bookmarking/collections), and the Zakat
calculator.

## Findings

### 1. Zakat "Reset amounts" wipes the gold/silver prices - FIXED

- **Where:** [apps/mobile/src/screens/ZakatScreen.tsx](../../apps/mobile/src/screens/ZakatScreen.tsx)
- **Symptom:** Set "Gold per gram" to 75 and "Cash & bank balances" to 500,
  then tapped "Reset amounts" — both the entered cash amount *and* the
  researched gold price were wiped back to empty, forcing the price to be
  looked up and re-entered again.
- **Root cause:** The reset handler was `update({ ...DEFAULT, currency:
  state.currency })` — it replaced the whole state with `DEFAULT` (empty
  prices, `nisabBasis: "silver"`, empty assets), preserving only the
  currency symbol. This is the exact bug already found and fixed on web in
  [apps/web/src/components/ZakatCalculator.tsx](../../apps/web/src/components/ZakatCalculator.tsx)
  (commit `71b7b67`) — but the mobile screen is a separate component that
  never received the equivalent fix, so the same bug shipped independently
  on this platform.
- **Fix:** Mirrored web's `reset()` pattern: only clear `assets` (back to
  `EMPTY_ASSETS`) and `liabilities`; leave `currency`, `goldPricePerGram`,
  `silverPricePerGram`, and `nisabBasis` untouched.
- **Verification:** `pnpm --filter @ummahlibrary/mobile typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (102/102, unrelated to this
  screen), `pnpm lint` (0 errors, 12 pre-existing warnings). Live
  re-verification against the Expo web dev server: set gold=75, cash=500,
  tapped Reset — gold stayed `75`, both `Total assets` and every asset
  field (including cash) correctly went back to empty/`$0.00`.
- **Regression test:** None added. This codebase's mobile app has no
  component-test harness at all today (`apps/mobile/vitest.config.ts` only
  includes `src/**/*.test.ts`, run in a plain Node environment; there is no
  `@testing-library/react-native` or equivalent dependency, and zero
  `.test.tsx` files exist anywhere under `apps/mobile/src`) — unlike the web
  app, which already has `@testing-library/react` + jsdom wired up. Adding a
  net-new testing framework and DOM-rendering environment just to cover one
  screen's reset handler is a bigger architectural decision than this fix
  warrants, so verification here relies on the live re-check described
  above instead. Worth flagging separately if the project wants
  component-level coverage for mobile screens going forward.

## Investigated, no bug found

- **"Duplicate" content across tab screens / the Save-āyah modal, seen via
  `read_page`/`get_page_text`:** repeatedly, the accessibility tree and
  flattened page text for one screen also included the *previous* tab's
  content (e.g. the Home screen's "Assalāmu ʿalaykum" card showing up
  while on the "Read" tab), and the "Save āyah" collection-picker modal's
  content kept appearing in text dumps even after tapping "Done" and
  switching tabs. Traced both to React Navigation / RN-Web's actual
  behavior, not app bugs:
  - Inactive tab screens stay mounted (for animation/perf) but are
    correctly marked `aria-hidden="true"` on an ancestor and pushed behind
    the active screen with `z-index: -1` — confirmed via
    `getComputedStyle`/`elementFromPoint` that the "duplicate" text is
    genuinely covered and non-interactive, and is properly hidden from
    assistive tech. `read_page`'s accessibility-tree walk and
    `get_page_text`'s `innerText` extraction don't respect `aria-hidden`,
    so they surface content a real user (sighted or screen-reader) never
    sees.
  - The Save-āyah modal, once dismissed, collapses its content container to
    `height: 0` and sets `pointer-events: none` on the full-screen
    wrapper — genuinely closed and non-interactive, just still present in
    the DOM (confirmed via `getBoundingClientRect`/`elementFromPoint`
    landing on the real underlying screen, not the modal).
  - **Methodology note for future mobile rounds:** don't trust
    `read_page`/`get_page_text` alone on this app to mean "visible" —
    cross-check with `getBoundingClientRect`, `getComputedStyle`
    (`display`/`visibility`/`opacity`/`pointer-events`), and
    `elementFromPoint` before concluding two screens are stacked/leaking
    into each other. A small helper that filters DOM leaves by actual
    visibility (used later in this round for the Bookmarks screen) is more
    reliable than raw text dumps for this codebase.
- **A tooling false alarm during the Zakat fix's own verification:**
  immediately after tapping "Reset amounts", reading the cash input's
  `.value` back *in the same script* still showed `"500"` — looked like the
  fix hadn't worked. A follow-up read (separate script call, so after
  React's re-render had flushed) showed the field correctly empty. Same
  read-before-flush race already documented in round 5 for the web app,
  now seen on mobile too.
- **Bookmark / collection flow:** saving 2:1 to a newly-created "Favorites"
  collection worked correctly end-to-end — the collection was created, the
  āyah appeared under Bookmarks with the correct reference, Arabic text,
  transliteration, and "Open in reader"/"Delete" actions.
- **Zakat negative-amount guard:** typing `-500` into "Cash & bank
  balances" was correctly stripped to `500` (not silently blanked) —
  `sanitizeDecimal` on mobile already has the equivalent of web's fix
  (`71b7b67`), so this half of the original web bug was never present here.
- **Surah reader:** opened Al-Baqara, toggled the "Transliteration" switch
  on — every āyah correctly gained a transliteration line without
  disturbing the Arabic or translation text. Reading progress correctly
  surfaced a "Continue reading" card back on the Home tab.

## Verification

- `pnpm --filter @ummahlibrary/mobile typecheck` — clean.
- `pnpm --filter @ummahlibrary/mobile test` — 102/102 passed (15 files).
- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated to this
  round's change).
- Live re-verification against the Expo web dev server (`expo start
  --web`), described above.
- No `pnpm build` run — mobile has no `build` script (turbo skips it), and
  the change doesn't affect web/other packages.

## Verdict

One real bug found and fixed this round (Zakat reset wiping prices on
mobile, mirroring an already-fixed web bug). Restarting the 3-in-a-row
clean-streak count at zero; continuing to round 8.
