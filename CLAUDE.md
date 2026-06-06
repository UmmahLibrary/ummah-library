# CLAUDE.md

Guidance for Claude Code (and any agent) working in this repo. The full,
canonical rules are imported from `AGENTS.md` below — follow them.

## Orientation

- **Modular monolith, ports & adapters.** Dependencies point inward; **`core`
  imports nothing**; everything external sits behind a port. CI enforces the
  boundaries — do not loosen them to work around a violation.
- **Architecture map + data-flow diagrams:** [`ARCHITECTURE.md`](ARCHITECTURE.md).
- **Why the code is the way it is:** [`docs/adr/`](docs/adr/) (start at the index).
- **Where things go + the do/don't list:** see `AGENTS.md` (imported below).

## The loop (must pass before every commit)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

If you make or overturn an architectural decision, add/supersede an ADR in the
same change.

@AGENTS.md
