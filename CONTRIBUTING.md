# Contributing to Ummah Library

Jazākum Allāhu khayran for wanting to help. This project is a community
**Sadaqah Jariyah** — every fix, test, and translation is a contribution that
keeps benefiting people long after it's merged.

## Setup

```bash
corepack enable          # provides pnpm
pnpm install
pnpm dev                 # web at http://localhost:3000
```

Requirements: **Node ≥ 20**, **pnpm** (pinned via `packageManager` in the root
`package.json`, so Corepack uses the right version automatically).

## Before you open a PR

Run the same checks CI runs:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm format` autoformats with Prettier.

## Module boundaries (please read)

This repo enforces a dependency direction so it can scale without rewrites:

- `apps/*` may depend on `packages/*`.
- `packages/*` may **never** depend on `apps/*`.
- `packages/core` depends on **nothing** — no Next.js, no Expo, no DB driver.
- Every external tool (DB, AI, audio, storage) sits behind an **adapter**.

PRs that violate these will be asked to refactor.

## Understand the architecture first

Before a non-trivial change, read the **[Architecture Decision Records](docs/adr/)**
— they are the canonical explanation of _why_ the codebase is shaped the way it
is (data sourcing, static-first delivery, the plugin system, local-first state,
audio timing, mobile wiring…). The [index](docs/adr/README.md) is a one-screen
overview. If your change makes or overturns an architectural decision, add or
supersede an ADR in the same PR.

## Branches & commits

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): e.g.
  `feat(core): add juz boundary lookup`.
- Keep PRs focused. Reference the issue they close.

## Islamic content

Quran text, translations, Tafsir, and Hadith are sacred trusts. They must be:

- **Attributed** to their source (license notices travel with the data).
- **Scholar-reviewed** before release — use the `needs-scholar-review` label.

When in doubt, open an issue first and ask.

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
