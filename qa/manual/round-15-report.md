# Manual E2E QA - Round 15 (2026-08-21)

Areas covered this round: Nearby Mosques (with a real mocked location) and
a deep investigation into an apparent tab-navigation lockup discovered
while exploring Reading Plans.

## Findings

None this round — the one apparent issue found (below) doesn't clear the
bar for a confirmed, fixable bug.

## Investigated, no bug found

- **Nearby Mosques:** with geolocation mocked to London and a 5 km radius
  selected, returned 30+ real OpenStreetMap mosque results correctly
  sorted by distance, each with an address and a "Directions" link, plus
  the required ODbL attribution line.
- **Apparent tab-navigation lockup on `PlansScreen` — traced to direct URL
  entry, not reachable through normal use:** navigating straight to
  `http://localhost:8090/plans` (typing the URL, as this Expo-web testing
  setup allows but a native iOS/Android build never would) landed on the
  Reading Plans screen correctly, but every subsequent tab-bar tap
  afterward updated the page `<title>`/tab-selected-indicator without ever
  changing the visibly rendered screen — confirmed with a real `computer`
  tool click (not a synthetic `.click()`) and reproduced cleanly across a
  full server restart, ruling out a stale-DOM or session-accumulation
  artifact. The browser console showed a repeating `TypeError:
  this.validatePath is not a function` (an unhandled promise rejection)
  on each failed tab press.
  Root-caused by comparing against the *normal* path to the same screen:
  the More menu's "Reading Plans" item calls `navigation.getParent()
  ?.navigate("Read", { screen: "Plans" })` (`toRead("Plans")` in
  `MoreMenuScreen.tsx`) — a deliberate cross-tab push, since `PlansScreen`
  lives on the *Read* stack's `ReadStackParamList`, not the *More* stack it's
  launched from. Reproducing via that real in-app path (Home → More →
  Reading Plans, then tapping every other tab in turn) worked correctly
  every time — each tab switch genuinely changed the visible screen, with
  the tab-selected indicator matching. Only loading `/plans` as a **raw,
  freshly-typed URL** left the app's linking/navigation state unable to
  reconcile subsequent tab presses. Since this app is a React Native/Expo
  app whose only "web" form here is a local testing scaffold
  (`expo start --web`), and native iOS/Android builds have no address bar
  for a user to type an arbitrary path into, this doesn't represent a path
  a real user of the *shipped* app would hit — not fixed, and not counted
  as a confirmed bug, but recorded here in case the project ever exposes
  deep-linking as a supported feature (e.g. a PWA install or `expo-router`
  web deep links), at which point this would need proper investigation
  into the app's linking config's path-validation logic.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was
  needed beyond round 13's (last round with a code change), which remains
  green.
- All checks above were live re-verifications, including a full dev-server
  restart specifically to rule out session-accumulated state as the cause
  of the tab-navigation investigation.

## Verdict

Zero new *confirmed* bugs found — round 2 of the 3-in-a-row stop condition
(following round 14's clean round). Continuing to round 16.
