# UIKit

A curated gallery of production-ready UI kits, design systems, and web components — so building a UI with AI stops meaning "burn tokens and pray."

See [PLAN.md](./PLAN.md) for the full architecture.

## Three actors, one contract

- **Generator** — a Claude Code skill (`uikit-standard`) that produces kits in a standardized shape.
- **Platform** — this Turborepo monorepo: marketing site + gallery (search, listing, detail).
- **Consumer** — clones a kit repo, runs the `uikit` CLI, and the AI builds an app *with* the kit.

The glue is **`uikit.json`** — the manifest every kit carries. It is defined once in
[`packages/manifest`](./packages/manifest) and shared by the platform, the CLI, and the generator
so they never drift.

## Workspace

```text
apps/         web (gallery) · landing · admin   — TanStack Start → Cloudflare Workers
packages/     manifest · ingest · ui · db · preview · config
tooling/      cli  — the `uikit` command
```

## Develop

```bash
pnpm install
pnpm dev        # run apps
pnpm test       # run package tests
pnpm typecheck
```

## Status

Building in phases (see PLAN.md §9). **Phase 0 — the contract (`packages/manifest`) — is first.**
