/* Ummah Library — engineering blog series content.
   Plain data (no JSX) so it can be shared between the index and article views.
   Body is a list of typed blocks the ArticleBody renderer in blogscreens.jsx
   maps over. Paragraph text can be a plain string or an array of
   (string | {ar, translit}) parts for inline Arabic-term treatment. */

// Series is just a name a post can belong to — null/absent is valid (a
// standalone post). Today all 12 share one series; nothing here assumes a
// fixed member count or a single series forever.
const SERIES_ENGINEERING = "The Ummah Library engineering series";

const ARTICLES = [
  {
    slug: "anatomy-of-an-open-source-quran-platform",
    order: 1,
    date: "2026-07-13",
    series: SERIES_ENGINEERING,
    title: "Anatomy of an Open-Source Quran Platform",
    description: "A tour of the whole system: how the monorepo is organized, what talks to what, and why the pieces are split the way they are.",
    tags: ["architecture", "typescript", "monorepo", "open-source", "software-design"],
    body: [
      { type: "p", text: "Ummah Library started as a single Next.js app. It is now a monorepo of nine packages, three shipped apps and a domain core that none of them are allowed to bypass. This post is the map — the one we wished existed before we opened the codebase for the first time." },
      { type: "h2", text: "The shape of the repo" },
      { type: "p", text: "Everything lives under one root: a domain package with no framework dependencies, a set of adapters that implement its ports, and three consumer apps — web, mobile and a browser extension — that compose those adapters differently for their platform." },
      { type: "ul", items: [
        "packages/domain — entities, use-cases, ports. Zero framework imports.",
        "packages/adapters-* — one package per external concern: storage, audio, search, licensing.",
        "apps/web, apps/mobile, apps/extension — thin shells that wire adapters into the domain.",
      ] },
      { type: "h3", text: "Why a monorepo at all" },
      { type: "p", text: "Three apps sharing one domain only works if changing the domain is a single, atomic commit. Split repos would mean versioning the core and waiting for three consumers to update — which, in practice, means the domain drifts three ways within a year." },
      { type: "diagram", caption: "apps → adapters → domain, dependencies pointing inward" },
      { type: "p", text: "The rest of this series works through that inward-pointing rule in detail — starting with the single lint rule, next post, that keeps it from becoming a suggestion." },
    ],
  },
  {
    slug: "the-one-rule-that-protects-everything",
    order: 2,
    date: null,
    series: SERIES_ENGINEERING,
    title: "The One Rule That Protects Everything",
    description: "One ESLint rule keeps the domain layer honest — and why hexagonal architecture lives or dies on enforcement, not good intentions.",
    tags: ["architecture", "hexagonal-architecture", "eslint", "typescript", "software-design"],
    body: [
      { type: "p", text: "Hexagonal architecture diagrams are easy to draw and easy to violate. The domain sits in the middle, ports define what it needs, adapters supply it — and then, eighteen months later, someone imports a browser API into a use-case because it was faster than adding a port. The diagram survives in the docs; the boundary doesn't survive in the code." },
      { type: "p", text: "We stopped trusting the diagram and started trusting a linter." },
      { type: "h2", text: "The rule" },
      { type: "p", text: "One ESLint rule — `no-restricted-imports` scoped by path — says the domain package may not import from adapters, apps, or any package tagged `platform`. That's the entire enforcement mechanism. No architecture-fitness test suite, no custom static analysis. One rule, checked on every commit and in CI." },
      { type: "code", lang: "js", code: `// .eslintrc.cjs — enforced in packages/domain only
module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        { group: ["**/adapters-*/**"], message: "Domain may not import adapters. Add a port instead." },
        { group: ["**/apps/**"], message: "Domain may not depend on an app shell." },
      ],
    }],
  },
};` },
      { type: "h3", text: "Why one rule is enough" },
      { type: "ul", items: [
        "It fails loudly, at commit time, in a language every contributor already reads.",
        "It has no exceptions list to maintain — the boundary is binary, not negotiable.",
        "It costs nothing to onboard a new contributor onto: the error message says what to do.",
      ] },
      { type: "p", text: "The other side of the rule is a checklist for adding a new capability without breaking it:" },
      { type: "ol", items: [
        "Define the port as an interface in the domain — the shape the domain needs, not what a library offers.",
        "Implement the port in a new or existing adapters-* package.",
        "Wire the concrete adapter at the app's composition root, never inside a use-case.",
      ] },
      { type: "quote", text: "The dependency rule is the overriding rule that makes this architecture work... source code dependencies can only point inwards.", cite: "Internal ADR-0003, quoting Robert C. Martin's Clean Architecture" },
      { type: "table", head: ["Layer", "May import", "May not import"], rows: [
        ["domain", "domain", "adapters-*, apps/*"],
        ["adapters-*", "domain, external libs", "apps/*"],
        ["apps/*", "domain, adapters-*", "— (composition root)"],
      ] },
      { type: "p", text: [
        "It's the same discipline as keeping the ", { ar: "قِبْلَة", translit: "qibla" }, " direction as a single computed value rather than letting every screen calculate its own bearing: one authority, everywhere else depends on it.",
      ] },
      { type: "hr" },
      { type: "p", text: "The next post pushes the same rule one layer deeper: not just what the domain can import, but what it's allowed to know about time." },
    ],
  },
  {
    slug: "a-pure-core-keeping-the-clock-out-of-your-domain",
    order: 3,
    date: null,
    series: SERIES_ENGINEERING,
    title: "A Pure Core: Keeping the Clock Out of Your Domain",
    description: "Why the domain never calls Date.now(), and how injecting time makes prayer calculations and streaks deterministic and testable.",
    tags: ["architecture", "testing", "typescript", "determinism", "software-design"],
    body: [
      { type: "p", text: "Prayer times, fasting streaks and reading-plan pacing all depend on \"now.\" That makes them the easiest place in the codebase to write a flaky test — unless \"now\" is a value the domain receives, not a global it reaches for." },
      { type: "h2", text: "The Clock port" },
      { type: "p", text: "Every use-case that needs the current time takes a `Clock` port as an argument. In production it's backed by `Date.now()`; in tests it's a fixed instant." },
      { type: "code", lang: "ts", code: `interface Clock {
  now(): Date;
}

function nextPrayer(times: PrayerTime[], clock: Clock): PrayerTime {
  const now = clock.now();
  return times.find((t) => t.at > now) ?? times[0];
}` },
      { type: "p", text: "This looks like ceremony for a one-line function. It stops looking like ceremony the first time a test needs to assert what happens at 11:58pm on the last day of Ramaḍān." },
      { type: "h3", text: "What it buys you" },
      { type: "ul", items: [
        "Tests run at any time of day, in any timezone, with no flakiness.",
        "Bug reports include the exact instant, so a fix can be verified against the same input.",
        "Streak and pacing logic can be simulated forward — useful for previewing a reading plan before committing to it.",
      ] },
      { type: "p", text: "The same pattern extends to anything else non-deterministic — random IDs, locale, geolocation. If a use-case's output can change between two runs with identical arguments, something impure is hiding inside it." },
    ],
  },
  {
    slug: "when-not-to-add-a-port",
    order: 4,
    date: null,
    series: SERIES_ENGINEERING,
    title: "When Not to Add a Port",
    description: "Ports and adapters are cheap to draw and expensive to maintain. A rule of thumb for when a port is worth it — and when it's just ceremony.",
    tags: ["architecture", "hexagonal-architecture", "software-design", "abstraction", "typescript"],
    body: [
      { type: "p", text: "Once a codebase has one port, it's tempting to reach for a port every time. Need to format a number? Port. Need to check if a string is empty? Port. This is how hexagonal architecture earns its reputation for ceremony." },
      { type: "h2", text: "The question that actually matters" },
      { type: "p", text: "Before adding a port, we ask one thing: could this dependency plausibly need a second implementation? Not \"is it technically external\" — `Intl.NumberFormat` is external and never gets a port. Not \"is it a library\" — `date-fns` helpers are pure functions and stay unwrapped." },
      { type: "ul", items: [
        "A second, real implementation is plausible → add a port. (Storage: IndexedDB today, a native SQLite adapter tomorrow.)",
        "It's a pure function with no I/O and one obvious implementation → import it directly, even in the domain.",
        "It's a platform capability the domain merely needs the *result* of → pass the result in, don't wrap the API.",
      ] },
      { type: "p", text: "That third case is the one people miss. The domain doesn't need a `GeolocationPort` — it needs a latitude and longitude. Passing the coordinates in as arguments is simpler than wrapping the Geolocation API in an interface the domain never directly touches anyway." },
      { type: "h3", text: "A smell to watch for" },
      { type: "p", text: "If an adapter interface has exactly one implementation eighteen months after it shipped, and no plan for a second, it's not a seam — it's indirection. We've deleted three such ports so far, each time replacing a `SomethingPort.doThing()` call with the plain function it wrapped." },
    ],
  },
  {
    slug: "no-account-no-server-no-tracking-local-first-software-people-own",
    order: 5,
    date: null,
    series: SERIES_ENGINEERING,
    title: "No Account, No Server, No Tracking: Local-First Software People Own",
    description: "Why Ummah Library has no login and no backend, and what that constraint forces onto the architecture.",
    tags: ["local-first", "architecture", "typescript", "software-design", "privacy"],
    body: [
      { type: "p", text: "There is no sign-up screen in Ummah Library, and there is no backend to sign up to. Bookmarks, ḥifẓ progress and reading streaks live entirely on-device. This wasn't a growth decision — it was a values decision that then had to become an architectural one." },
      { type: "h2", text: "What \"no server\" actually constrains" },
      { type: "ul", items: [
        "Persistence must work fully offline, from first launch — so storage is a first-class port, not a cache in front of an API.",
        "Anything that looks like sync between devices has to happen without a server that can read the payload (see the next post).",
        "There is nothing to A/B test server-side, no analytics pipeline to reason about, and no account-deletion flow — because there's no account.",
      ] },
      { type: "p", text: "The trade-off is real: no server-side backup means a wiped device is a wiped library unless the user exports their own data. We chose to make export/import a first-run-quality feature rather than compromise on the no-account premise." },
      { type: "h3", text: "Local-first, not offline-first" },
      { type: "p", text: "Offline-first usually still assumes a server exists somewhere and the app degrades gracefully without it. Local-first flips the default: the device is the source of truth, and anything server-shaped is optional, additive, and — as the next post covers — blind to the data it carries." },
    ],
  },
  {
    slug: "encrypting-data-you-can-never-read",
    order: 6,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Encrypting Data You Can Never Read",
    description: "Bookmarks and progress sync between devices without a server that can read them — the design behind zero-knowledge sync.",
    tags: ["distributed-systems", "cryptography", "local-first", "architecture", "typescript"],
    body: [
      { type: "p", text: "Sync was the one feature that seemed to require breaking the no-server premise. It doesn't — it just requires the server to be a courier for ciphertext it can't open." },
      { type: "h2", text: "The shape of it" },
      { type: "p", text: "A device-local key, derived from a passphrase the user never sends anywhere, encrypts the sync payload before it leaves the device. The relay stores and forwards opaque blobs keyed by an anonymous sync-group ID. It has no way to associate a blob with a person, and no way to read its contents." },
      { type: "code", lang: "ts", code: `async function encryptPayload(data: SyncPayload, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  return { iv, cipher };
}` },
      { type: "h3", text: "What the relay is trusted with" },
      { type: "table", head: ["Can the relay...", "Answer"], rows: [
        ["Read bookmark or progress content?", "No — AES-GCM ciphertext only"],
        ["Link a blob to an email or account?", "No — no accounts exist"],
        ["Know how many devices are in a sync group?", "Yes — blob count, not content"],
        ["Cause data loss if it disappears?", "No — local data is authoritative"],
      ] },
      { type: "p", text: "This is a smaller guarantee than end-to-end encrypted messaging makes, and we're careful not to oversell it — metadata like blob timing is still visible to the relay. But it means the one server Ummah Library does operate can be run, in principle, by anyone, without becoming a custodian of anyone's reading habits." },
    ],
  },
  {
    slug: "delete-the-database",
    order: 7,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Delete the Database",
    description: "How static generation replaced a database for Qur'ān and hadith text, and what got faster (and harder) as a result.",
    tags: ["architecture", "nextjs", "static-site-generation", "performance", "software-design"],
    body: [
      { type: "p", text: "The Qur'ān text, translations and hadith corpus don't change at runtime. Querying them from a database on every request was solving a problem we didn't have." },
      { type: "h2", text: "What moved to build time" },
      { type: "ul", items: [
        "Every surah, ayah, translation and tafsīr entry is generated to a static JSON asset at build time.",
        "Search indexes (see the post on Arabic search) are pre-built and shipped as static files, not queried live.",
        "The only runtime writes are user-local: bookmarks, progress, settings — none of which ever touch a server database.",
      ] },
      { type: "p", text: "The result is a content layer with no database to provision, back up, migrate or take down for maintenance. A new translation ships as a pull request that adds a data file and a rebuild — reviewable the same way a code change is." },
      { type: "h3", text: "What got harder" },
      { type: "p", text: "Anything that used to be \"just a query\" is now a build step. Adding a cross-cutting field to every ayah means regenerating the whole corpus, not writing one migration. We accepted that trade because the corpus changes rarely and the read path — which every user hits, constantly — gets to be a CDN cache hit instead of a database round trip." },
    ],
  },
  {
    slug: "one-domain-three-apps",
    order: 8,
    date: null,
    series: SERIES_ENGINEERING,
    title: "One Domain, Three Apps",
    description: "The same domain core powers the web app, the mobile app and the browser extension. Here's how the boundary makes that possible.",
    tags: ["architecture", "react-native", "design-systems", "monorepo", "typescript"],
    body: [
      { type: "p", text: "Web, mobile and the browser extension ship the same reading progress, the same prayer-time logic and the same ḥifẓ review algorithm — implemented once, in `packages/domain`, and consumed three times." },
      { type: "h2", text: "What's shared and what isn't" },
      { type: "table", head: ["Layer", "Web", "Mobile", "Extension"], rows: [
        ["Domain use-cases", "shared", "shared", "shared"],
        ["Storage adapter", "IndexedDB", "SQLite (React Native)", "extension storage API"],
        ["UI components", "web kit", "React Native kit", "web kit, constrained"],
        ["Design tokens", "shared", "shared", "shared"],
      ] },
      { type: "p", text: "The design tokens travelling unchanged across all three is what makes the interfaces feel like one product rather than three skins. The components don't — a card on web isn't a React Native card — but they render from the same colour, spacing and type tokens." },
      { type: "h3", text: "The test that keeps this honest" },
      { type: "p", text: "Each app's composition root is a small file whose only job is instantiating adapters and handing them to domain use-cases. If that file starts containing business logic, it's a sign a use-case leaked out of the domain — the same violation the ESLint rule from post two exists to catch." },
    ],
  },
  {
    slug: "plug-it-in-a-content-system-with-three-delivery-modes",
    order: 9,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Plug It In: A Content System with Three Delivery Modes",
    description: "Tafsīr, translations and audio all flow through one plugin interface, whether they ship in the bundle, fetch over the network, or load from disk.",
    tags: ["architecture", "plugin-systems", "typescript", "software-design", "extensibility"],
    body: [
      { type: "p", text: "A translation might be small enough to bundle. A tafsīr might be too large to bundle but fine to fetch on demand. An audio reciter's files are large enough that they need to be downloaded once and read from disk after that. Three very different delivery mechanisms — one `ContentProvider` interface." },
      { type: "code", lang: "ts", code: `interface ContentProvider<T> {
  readonly id: string;
  readonly mode: "bundled" | "remote" | "on-device";
  load(ref: ContentRef): Promise<T>;
}` },
      { type: "h2", text: "Why one interface, not three" },
      { type: "p", text: "A reading screen that wants a translation shouldn't need to know or care which of the three a given translation uses — that decision belongs to whoever registers the provider, and it can change later without touching the screen." },
      { type: "ol", items: [
        "A new translation ships bundled at first, for immediate availability.",
        "Once it's popular enough to matter for bundle size, its provider is swapped to \"remote\" — same interface, same call sites.",
        "No reading-screen code changes for that migration.",
      ] },
      { type: "h3", text: "The trade-off" },
      { type: "p", text: "A uniform interface across three delivery modes means the interface has to be the lowest common denominator — async, and content-ref based rather than assuming synchronous, in-memory access. Every provider pays a small `await` tax even the bundled ones don't strictly need, in exchange for every call site staying identical regardless of where the content actually lives." },
    ],
  },
  {
    slug: "searching-arabic-in-the-browser",
    order: 10,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Searching Arabic in the Browser",
    description: "Fast, diacritic-insensitive Arabic search, entirely client-side — the indexing and normalization tricks that make it work.",
    tags: ["search", "unicode", "typescript", "local-first", "algorithms"],
    body: [
      { type: "p", text: [
        "Search has to work with no server, which rules out anything that depends on a hosted index. It also has to handle the fact that most people typing a query don't include ",
        { ar: "تَشْكِيل", translit: "tashkeel" },
        " — the diacritic marks — even though the corpus stores them.",
      ] },
      { type: "h2", text: "Normalize before you index" },
      { type: "p", text: "Every ayah is indexed twice: once with full diacritics, once with them stripped to bare consonantal skeleton. A query is normalized the same way before matching, so \"رحمن\" finds \"رَحْمَٰن\" without the user ever needing to type a single tashkeel mark." },
      { type: "code", lang: "ts", code: `const DIACRITICS = /[\\u064B-\\u065F\\u0670]/g;

function normalizeArabic(text: string): string {
  return text
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .replace(/[إأآا]/g, "ا") // fold alif variants
    .replace(/ى/g, "ي");     // fold alif maqsura
}` },
      { type: "h3", text: "Keeping it client-side" },
      { type: "ul", items: [
        "The normalized index is pre-built at content-generation time and shipped as a static asset, not computed on first search.",
        "Matching runs against an in-memory inverted index — no network round trip, no server to keep warm.",
        "Highlighting re-maps normalized match offsets back onto the original, fully-diacritized text so results still look like the Qur'ān, not the search index.",
      ] },
      { type: "p", text: "The offset re-mapping is the fiddly part: stripping diacritics shortens the string, so a naive highlight would land on the wrong character. The index stores a position map alongside the normalized text specifically so highlighting can survive the round trip." },
    ],
  },
  {
    slug: "provenance-as-architecture-when-a-licence-decides-your-system-design",
    order: 11,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Provenance as Architecture: When a Licence Decides Your System Design",
    description: "Mixed-licence source texts forced a system boundary most apps never have to draw. How licensing became an architectural constraint.",
    tags: ["architecture", "open-source", "licensing", "data-engineering", "software-design"],
    body: [
      { type: "p", text: "The Qur'ān text itself is unambiguous. The translations, tafsīr and hadith gradings around it are not — each comes from a publisher with its own licence, some permissive, some requiring attribution, a small number requiring the content never be bundled with software under a different licence." },
      { type: "h2", text: "The constraint became a boundary" },
      { type: "p", text: "Rather than track licence terms in a spreadsheet and hope every contributor reads it, provenance became a field on the content model itself — every text asset carries its source, licence and permitted distribution modes, checked in CI before anything ships." },
      { type: "table", head: ["Field", "Example", "Enforced by"], rows: [
        ["source", "\"Sahih International\"", "schema validation"],
        ["licence", "\"CC-BY-NC-4.0\"", "build-time licence gate"],
        ["distribution", "\"bundle\" | \"remote-only\"", "ContentProvider mode (see post 9)"],
      ] },
      { type: "blockquote", text: "No text asset may reach the `bundled` distribution mode unless its licence field is on the pre-approved allow-list. This check may not be bypassed by configuration.", cite: "Internal ADR-0011" },
      { type: "h3", text: "Why this is architecture, not paperwork" },
      { type: "p", text: "A licence that forbids bundling isn't a legal footnote — it's the reason some translations use the \"remote\" delivery mode from the plugin-system post rather than the \"bundled\" one, even though bundling would be simpler and faster. The system's shape follows from what the content is legally allowed to do, which made provenance a first-class part of the domain model instead of an afterthought in a README." },
    ],
  },
  {
    slug: "your-first-contribution-to-ummah-library",
    order: 12,
    date: null,
    series: SERIES_ENGINEERING,
    title: "Your First Contribution to Ummah Library",
    description: "A practical, step-by-step guide to setting up the monorepo, finding a good first issue, and opening your first pull request.",
    tags: ["open-source", "contributing", "typescript", "monorepo", "software-design"],
    body: [
      { type: "p", text: "This is the last post in the series, and the most practical one: how to go from cloning the repo to an opened, reviewable pull request." },
      { type: "h2", text: "Set up the monorepo" },
      { type: "code", lang: "bash", code: `git clone https://github.com/ummah-library/ummah-library.git
cd ummah-library
pnpm install
pnpm dev --filter=web` },
      { type: "p", text: "That last command starts the web app with hot reload against the shared domain package — a change in `packages/domain` is reflected without a rebuild step." },
      { type: "h2", text: "Find something worth working on" },
      { type: "ul", items: [
        "Issues labelled `good-first-issue` are scoped to a single package and don't require touching the domain boundary.",
        "Issues labelled `content` are usually translation, tafsīr or hadith data additions — no TypeScript required.",
        "If nothing labelled fits, open a discussion before a PR — it's cheaper to align on approach before writing code than after.",
      ] },
      { type: "h2", text: "Before you open the PR" },
      { type: "ol", items: [
        "`pnpm lint` — this is where the boundary rule from post two will catch a misplaced import.",
        "`pnpm test` — domain tests should need no mocks beyond the `Clock` port from post three.",
        "`pnpm typecheck` — the monorepo is strict-mode TypeScript throughout.",
      ] },
      { type: "p", text: "None of this is gatekeeping for its own sake — every check exists because it once caught a real regression, and we'd rather a contributor's CI run catch it locally than a maintainer catch it in review." },
    ],
  },
];

Object.assign(window, { ARTICLES });

// ── Synthetic test data — for stress-testing pagination, grid density and
// filters at counts far beyond the real 12-article series. Gated behind the
// Tweaks panel's "Extra test posts" slider (default 0); never shown otherwise.
// Clearly self-identifies as placeholder content in its own description.
const TEST_SERIES = [SERIES_ENGINEERING, "Community Spotlights", "Release Notes", null];
const TEST_TAG_POOL = [
  "performance", "refactoring", "ci-cd", "accessibility", "i18n", "react",
  "testing", "postgres", "caching", "observability", "api-design", "security",
  "onboarding", "documentation", "tooling", "graphql", "webassembly",
];
function generateTestArticles(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const series = TEST_SERIES[i % TEST_SERIES.length];
    const tagCount = 3 + (i % 3);
    const tags = [];
    for (let j = 0; j < tagCount; j++) tags.push(TEST_TAG_POOL[(i * 5 + j) % TEST_TAG_POOL.length]);
    const d = new Date("2026-01-05T00:00:00");
    d.setDate(d.getDate() + i * 4);
    out.push({
      slug: `test-post-${n}`,
      order: 1000 + n,
      date: d.toISOString().slice(0, 10),
      series,
      title: `Test Post ${n}: Sample Entry for Layout Stress-Testing`,
      description: "Synthetic entry generated to stress-test the index grid, pagination and filters at higher post counts — not real editorial content.",
      tags: [...new Set(tags)],
      body: [
        { type: "p", text: "This is placeholder test content, generated only to stress-test the index grid, pagination and filter UI at higher post counts. It is not part of the real 12-article engineering series." },
        { type: "h2", text: "Why this exists" },
        { type: "p", text: "Use the Tweaks panel's \"Extra test posts\" slider to add or remove entries like this one, and confirm the grid, pagination and series/tag filters all hold up at scale." },
      ],
    });
  }
  return out;
}
Object.assign(window, { generateTestArticles });
