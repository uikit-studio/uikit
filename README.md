# uikit.studio

A curated gallery of **production-ready, runnable UI kits** — so building a UI
with AI stops meaning "burn tokens and pray." Browse → clone a kit → let your AI
build a real product **with** it

**[uikit.studio →](https://uikit.studio)**

## Pure git, no backend

This is a **static** gallery: no database, no server, no admin. Every kit is a
JSON entry in [`apps/web/content/kits/`](./apps/web/content/kits), baked into the
build. Curation is **PR review**; CI validates each entry
([`scripts/validate-content.mjs`](./scripts/validate-content.mjs)); merge to
`main` deploys to Cloudflare Workers.

Listing a kit = adding one JSON file. See **[uikit.studio/submit](https://uikit.studio/submit)**.

- **Verified** kits mirror their screenshots into the repo (can't rot).
- **Community** kits set `verified:false` and reference their own repo's assets
  (pinned jsDelivr URLs).

## The kits

### [Aurora](https://uikit.studio/kit/aurora) — glassy SaaS kit · React

[![Aurora](https://uikit.studio/kits/aurora/landing.png)](https://uikit.studio/kit/aurora)

Cool slate + blue, Sora display, glassmorphism, light + dark, EN/AR + RTL.
→ [`uikit-studio/aurora-uikit`](https://github.com/uikit-studio/aurora-uikit)

### [Spark](https://uikit.studio/kit/spark) — bold marketing kit · React / Vue / Web Components

[![Spark](https://uikit.studio/kits/spark/landing.png)](https://uikit.studio/kit/spark)

Big type, cream + ink + orange, grotesk display, light + dark, EN/AR + RTL.
→ [`uikit-studio/spark-uikit`](https://github.com/uikit-studio/spark-uikit)

## The toolchain (separate public repo)

The `uikit` CLI, the `uikit.json` contract, and the `uikit-standard` generator
live in **[uikit-studio/uikit-cli](https://github.com/uikit-studio/uikit-cli)**
and ship to npm as **[`uikit-cli`](https://www.npmjs.com/package/uikit-cli)**:

```bash
npx uikit-cli new https://github.com/uikit-studio/aurora-uikit my-app
cd my-app && npx uikit-cli add dashboard
```

## Develop

```bash
pnpm install
pnpm --filter @uikit/web dev        # run the gallery locally
node scripts/validate-content.mjs   # validate the registry entries
pnpm --filter @uikit/web deploy     # build + ship to Cloudflare
```

```text
apps/web/         the gallery (TanStack Start → Cloudflare Workers)
apps/web/content/ the registry — one JSON entry per kit
packages/config/  shared TS config
scripts/          content validator (the PR gate)
```

MIT © uikit.studio
