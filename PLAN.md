# UIKit — Implementation Plan

> A curated gallery of production-ready UI kits, design systems, and web components — so that building a UI with AI stops meaning "burn tokens and pray." Instead of generating from scratch every time, you pick a kit, get the tokens + components + dashboard + landing page, and ship.

---

## 1. The Core Idea (in one paragraph)

There are **three actors** connected by **one contract**:

1. **The Generator** — a Claude Code skill ("UIKit Standard") used by *authors/admins* to produce a UI kit in a **standardized shape**, in its **own GitHub repo**.
2. **The Platform** — a Turborepo monorepo that hosts the marketing site and the gallery (search, categories, listing, detail pages). It does *not* contain the UI kits themselves; it ingests them.
3. **The Consumer** — an *end user* who wants to build their app with a kit. They **clone the kit repo → add the kit's bundled skill → run our CLI → the AI builds a meaningful app** using that kit's components and tokens, correctly, because the skill teaches it how.

The glue is **the Contract** — a manifest file (`uikit.json`) every kit repo carries. It describes the kit's tech, prompts, screenshots, components, tokens, demos, **and how to consume it**. The platform ingests this manifest to list/render the kit; the CLI reads it to install the kit into a consumer's project. Anyone can host a kit anywhere and plug into the system via its manifest.

```text
   AUTHOR                          CONSUMER
     │ runs                          │ 1. clone repo
     ▼                               │ 2. uikit add / init  (CLI)
┌──────────────┐   emits   ┌─────────┴──────────┐   3. AI uses kit skill
│  GENERATOR   │ ────────> │   KIT REPO (own    │ ────────────────────────►  meaningful app
│  CC skill    │           │   GitHub)          │      + components + tokens
│ uikit-       │           │  /design /react    │
│ standard     │           │  /vue /web         │
└──────────────┘           │  .claude/skills/   │  ← consumer skill ships IN the kit
                           │  uikit.json        │
                           └─────────┬──────────┘
                                     │ ingested via uikit.json
                                     ▼
                     ┌───────────────────────────────────┐
                     │   PLATFORM (Turborepo)            │
                     │   apps/web  — search/list/detail  │
                     │   apps/landing — marketing        │
                     │   apps/admin — import/curate      │
                     │   tooling/cli — clone/add/build   │
                     └───────────────────────────────────┘
```

> **Two skills, don't confuse them.** The **Generator skill** (`uikit-standard`) lives in the platform and *creates* kits. The **Consumer skill** ships *inside each kit repo* (`.claude/skills/`) and teaches the AI to *build with* that specific kit. The CLI is what wires the consumer skill into a user's project.

---

## 2. What "a UI Kit" Contains

Every kit (whether generated or hand-built) ships these layers. The manifest enumerates which layers are present.

| Layer | What it is | Why it matters |
|-------|-----------|----------------|
| **Design tokens** | `tokens.json` — colors, fonts, spacing, radius, shadows (W3C DTCG format) | Single source of truth; framework-agnostic |
| **Tailwind preset** | `tailwind-preset.js` derived from tokens | Drop-in `presets: [uikit]` for consumers |
| **Theme CSS** | CSS variables build (`theme.css`) | Works without Tailwind too |
| **Components** | React + Vue + Web Components (same API surface) | Pick your framework, same look |
| **Blocks** | Composed sections (hero, pricing, navbar, stats) | Bigger than a button, smaller than a page |
| **Templates** | Full pages: **dashboard**, **landing page**, auth, settings | The "burn tokens" killers |
| **Prompts** | The prompts/skill used to build it + how to extend it | Reproducible, AI-native |
| **Consumer skill** | `.claude/skills/<kit>` — teaches an AI to build apps *with this kit* | The token-saver; ships in the repo |
| **Screenshots** | Typed images in the repo: **logo**, **landing** (required), **dashboard**, **other** (optional) | Card icon + thumbnail + preview carousel |

---

## 3. The Contract: `uikit.json`

This is the most important file in the whole system. It is the API between "anyone who builds a kit" and "the platform." Keep it strict and versioned.

```jsonc
{
  "$schema": "https://uikit.dev/schema/v1.json",
  "manifestVersion": 1,
  "id": "aurora",                       // globally unique slug
  "name": "Aurora",
  "version": "1.2.0",
  "description": "Clean SaaS kit with a glassy dashboard.",
  "author": { "name": "...", "github": "..." },
  "license": "MIT",
  "homepage": "https://aurora-demo.vercel.app",
  "repository": "https://github.com/user/aurora-uikit",

  "categories": ["saas", "dashboard", "dark-first"],
  "tags": ["glassmorphism", "blue", "inter"],

  "tech": {
    "frameworks": ["react", "vue", "web-components"],
    "styling": "tailwind",                // tailwind | css-vars | both
    "tailwindVersion": "^4.0.0",
    "icons": "lucide",
    "deps": ["@radix-ui/react-*"]
  },

  "design": {
    "tokens": "design/tokens.json",
    "tailwindPreset": "design/tailwind-preset.js",
    "themeCss": "design/theme.css",
    "fonts": [{ "family": "Inter", "source": "google" }],
    "palettes": [{ "name": "default", "primary": "#3B82F6" }],
    "modes": ["light", "dark"]
  },

  "surface": {
    "components": [
      { "name": "Button", "react": "react/Button.tsx", "vue": "...", "web": "..." }
    ],
    "blocks": [ { "name": "PricingTable", "preview": "..." } ],
    "templates": [
      { "name": "Dashboard", "route": "/dashboard", "preview": "screenshots/dashboard-dark.png" },
      { "name": "Landing",   "route": "/",          "preview": "screenshots/landing-light.png" }
    ]
  },

  "prompts": {
    "origin": "prompts/build.md",         // how the kit was generated
    "extend": "prompts/extend.md",        // how to add to it with AI
    "skillVersion": "uikit-standard@1.0"
  },

  "consume": {                            // how an END USER builds with this kit
    "skill": ".claude/skills/aurora",     // the kit's bundled Claude Code skill
    "skillName": "aurora-ui",
    "steps": [                            // shown on the gallery detail page
      "git clone https://github.com/user/aurora-uikit my-app",
      "cd my-app && npx uikit init",      // wires the skill into the user's project
      "Open in Claude Code and ask: 'build a billing dashboard using this kit'"
    ],
    "entry": "USAGE.md",                  // human-readable consumption guide
    "requires": ["node>=20", "tailwind>=4"]
  },

  "media": {
    "demoUrl": "https://aurora-demo.vercel.app",
    "screenshots": [                        // typed; only "landing" + "logo" are required
      { "kind": "logo",      "src": "screenshots/logo.svg" },
      { "kind": "landing",   "src": "screenshots/landing.png" },
      { "kind": "dashboard", "src": "screenshots/dashboard.png" },  // optional
      { "kind": "other",     "src": "screenshots/pricing.png", "label": "Pricing" }
    ]
  },

  "registry": {
    "install": "npx uikit add aurora",    // optional CLI install path
    "components": "registry/index.json"   // shadcn-style registry (optional)
  }
}
```

**Design decisions baked in:**
- `manifestVersion` is separate from kit `version` so the *contract* can evolve independently.
- Paths are repo-relative, so the platform can fetch raw files from GitHub without cloning.
- Everything optional except `id/name/version/tech` and the two required screenshots (`landing` + `logo`) → low barrier to import a simple kit, room to grow.
- **Screenshots are typed, not a flat list.** Each has a `kind` (`logo | landing | dashboard | other`). The gallery derives the card **thumbnail from `landing`** and the **icon from `logo`** — no separate thumbnail field to maintain.
- A JSON Schema (`schema/v1.json`) validates manifests at import time. Reject on invalid.

---

## 4. The Monorepo (Platform)

Turborepo + pnpm. Only the *platform* lives here — kits are external.

```text
uikit/
├─ apps/                # every app: TanStack Start → Cloudflare Workers (Wrangler)
│  ├─ web/            # the gallery: search, categories, listing, detail
│  ├─ landing/        # marketing site for UIKit itself
│  └─ admin/          # import/curate/approve kits
├─ packages/
│  ├─ manifest/       # uikit.json types + zod schema + validator        (the contract)
│  ├─ ingest/         # fetch + parse + normalize a kit from GitHub
│  ├─ ui/             # the platform's OWN design system (dogfood it)
│  ├─ db/             # Drizzle schema + client (Cloudflare D1)
│  ├─ preview/        # sandboxed iframe renderer for live component demos
│  └─ config/         # shared eslint/ts/tailwind + wrangler base config
├─ tooling/
│  └─ cli/            # `uikit` CLI: add/import/validate (used by consumers)
├─ turbo.json
└─ pnpm-workspace.yaml
```

Why three apps: `landing` sells the product, `web` is the gallery product, `admin` is internal curation. They share `packages/ui` (you eat your own dog food — the platform itself is a showcase kit).

**Deployment — all on Cloudflare.** Every app is a **TanStack Start** application deployed to **Cloudflare Workers via Wrangler**. Each app has its own `wrangler.toml` (extending `packages/config`), and `turbo run deploy` fans out `wrangler deploy` per app. SSR runs on the Worker; static assets ride Workers Assets. This keeps the whole platform on one edge runtime with no separate Node host.

---

## 5. The Generator Skill (`uikit-standard`)

A skill used by *authors* that, given a brief ("a dark fintech dashboard kit, indigo, Inter, glass cards"), scaffolds a complete, **manifest-valid** kit repo.

**What the skill does, in order:**
1. **Interview / parse brief** → category, vibe, palette, fonts, target frameworks.
2. **Generate tokens** (`tokens.json`) → derive `tailwind-preset.js` + `theme.css`.
3. **Generate components** for each requested framework, sharing one API spec so React/Vue/Web stay consistent.
4. **Compose blocks** then **assemble templates** (dashboard + landing minimum).
5. **Generate the kit's Consumer Skill** (`.claude/skills/<kit>`) — the per-kit skill that teaches an AI how to build apps *with this kit* (component list, import paths, token names, do/don'ts, example compositions). This is what makes consumption cheap.
6. **Write `uikit.json`** and **validate it against the schema** (the skill must produce a passing manifest — non-negotiable).
7. **Include screenshots in the repo** under `screenshots/` (light/dark, desktop/mobile), referenced by the manifest. The platform **never generates screenshots** — they live with the kit, authored by whoever built it.
8. **Write prompts + `USAGE.md`** (`prompts/build.md`, `prompts/extend.md`) so the kit is reproducible/extensible.
9. **Init git + push** to a new GitHub repo (or leave local for the user to push).

The skill ships as a directory: `SKILL.md` (instructions), `templates/` (scaffolds for both the kit *and* its bundled consumer skill), `schema/` (shared with the platform — single source of truth for the contract), and helper scripts. Crucially, the **same `packages/manifest` schema** is referenced by both this skill and the platform so they never drift.

---

## 5b. The Consumption Flow (the part you just added)

This is how an **end user turns a kit into a real app**. It's the payoff of the whole system — the AI doesn't guess, it follows the kit's own skill.

```text
1. Discover on the gallery → copy the install steps
2. git clone <kit repo> my-app
3. cd my-app && npx uikit init
      → CLI reads uikit.json → installs deps, wires the kit's
        .claude/skills/<kit> into the project, writes CLAUDE.md hints
4. Open in Claude Code:
      "build a billing dashboard for a SaaS using this kit"
      → the bundled skill gives the AI exact components, tokens,
        import paths, and composition rules → meaningful app, few tokens burned
```

**Kit repo layout (what the generator emits / what the CLI consumes):**

```text
aurora-uikit/
├─ uikit.json                  # the contract
├─ USAGE.md                    # human consumption guide
├─ .claude/
│  └─ skills/
│     └─ aurora/
│        ├─ SKILL.md           # "how to build with Aurora" (the consumer skill)
│        └─ reference/         # component API, token map, examples
├─ design/   tokens.json · tailwind-preset.js · theme.css
├─ react/    components · blocks · templates (dashboard, landing)
├─ vue/      …same surface
├─ web/      …web components
├─ registry/ index.json        # shadcn-style add targets (optional)
├─ prompts/  build.md · extend.md
└─ screenshots/  logo.svg · landing.png · dashboard.png · …
```

**The CLI (`tooling/cli`, published as `uikit`):**

| Command | Does |
| --- | --- |
| `uikit init` | In a cloned kit repo: install deps, wire the bundled skill into the project, write `CLAUDE.md` hints |
| `uikit add <id>` | Pull a component/block/template from a kit's registry into the current project (shadcn-style) |
| `uikit new <id> my-app` | Clone kit + `init` in one step (shortcut for the flow above) |
| `uikit validate` | Validate a `uikit.json` against the schema (authors run this before publishing) |
| `uikit info <id>` | Print a kit's tech, templates, and consume steps |

The CLI and the platform share `packages/manifest`, so "what the CLI installs" and "what the gallery shows" are guaranteed to match.

---

## 6. Import / Ingest Flow

How an external repo becomes a gallery entry:

```
admin pastes GitHub URL
        ↓
ingest: fetch uikit.json (raw.githubusercontent)
        ↓
manifest: validate against zod/JSON schema  ──fail──> reject + report errors
        ↓ ok
ingest: fetch referenced files (tokens, previews, registry)
        ↓
normalize → DB rows (kit, components, templates, tags, screenshots)
        ↓
admin reviews → approve → published to gallery
```

Re-ingest on a schedule (or GitHub webhook) keeps versions fresh. Store the resolved snapshot in DB; mirror screenshots to R2 for stability.

---

## 6b. Trust & Verification (community vs. official)

The gallery has **two tiers of kits**, and the distinction is visible everywhere:

| Tier | Who | Trust signal | Path in |
| --- | --- | --- | --- |
| **Official** | The UIKit team | "Official" mark + always verified | Built in-house with `uikit-standard`, auto-published |
| **Verified community** | Outside authors, reviewed by us | **✓ Verified** badge | Submitted → reviewed against the checklist → approved |
| **Community (unverified)** | Anyone | No badge; clearly labeled | Submitted → passes schema validation → listed as community |

**Verification is a platform decision, never self-declared.** A repo can't put `"verified": true` in its own `uikit.json` and be trusted — the flag lives only in our DB, set by an admin during review.

**What "verified" actually checks** (the review checklist `apps/admin` walks through):
- Manifest is valid and complete; demo URL loads.
- Screenshots in the repo match the live demo (no bait-and-switch).
- Components/templates exist at the manifest's paths and build.
- The bundled consumer skill is present and accurate.
- License is real and permissive enough to use; no obvious malware in install scripts.

**Submission flow:** anyone pastes a repo URL → schema validation gates entry → it lands as **community (unverified)**. The UIKit team can then promote it to **verified** after review. Official kits skip straight to verified. This keeps the door open (community can publish) while making trust earned and obvious.

---

## 7. Data Model (sketch)

```text
Kit         (id, slug, name, description, version, repo, demoUrl, license,
             status, source, verified, verifiedBy, verifiedAt)
Author      (id, name, github, official)   // official = the UIKit team
Category    (id, slug, name)         Kit *—* Category
Tag         (id, name)               Kit *—* Tag
TechFlag    (kitId, framework, styling, tailwindVersion)
Component   (id, kitId, name, frameworks[], previewUrl)
Template    (id, kitId, name, route, previewUrl)   // dashboard, landing, ...
Screenshot  (id, kitId, kind, url, label)  // kind: logo|landing|dashboard|other; url = repo source or R2 mirror
Manifest    (kitId, raw json, manifestVersion, ingestedAt, checksum)
```

- `source` ∈ `official | community` — who authored the kit.
- `verified` (bool) + `verifiedBy` / `verifiedAt` — set by the UIKit team during review. **Verification is platform-side and cannot be self-declared in the manifest** (you can't trust a repo to mark itself trusted).
- `status` ∈ `pending | published | rejected | archived` — the moderation lifecycle.

Search: start with **D1 FTS5** virtual tables on name/description/tags; add **Cloudflare Vectorize** for semantic "find me a kit like this" search when the gallery grows. Faceted filters map directly to `categories`, `tech.frameworks`, `design.modes`, `palettes`.

---

## 8. The `web` Gallery (UX surface)

- **Home / browse** — featured, newest, by category, by framework; **Verified** and **Community** as distinct rails.
- **Search** — query + facets (framework, style, color, light/dark, has-dashboard, **verified-only**, **official**).
- **Listing card** — **logo** as icon, **landing** screenshot as thumbnail, name, frameworks, palette dots, demo link, **verified ✓ badge** (and an "official" mark for UIKit-team kits).
- **Detail page** — screenshot carousel grouped by kind (landing → dashboard → other), live preview iframe (`packages/preview`), tokens viewer, component list, "copy install" (`npx uikit add <id>`), the prompts used, repo link.
- **Live preview** — sandboxed iframe rendering the kit's demo URL or a built bundle; never run untrusted code in the main app context.

---

## 9. Build Order (phased — each phase ships something usable)

**Phase 0 — Contract first.** Define `uikit.json` schema in `packages/manifest` (types + zod + JSON Schema + example fixtures). Nothing else can be right until this is. *Deliverable: validator that passes/fails example manifests.*

**Phase 1 — Monorepo skeleton.** Turborepo + pnpm, `apps/web` + `apps/landing` empty shells, shared `packages/config` + `packages/ui`. *Deliverable: `pnpm dev` runs both apps.*

**Phase 2 — One real kit by hand.** Build the "Aurora" reference kit (tokens → preset → React components → dashboard + landing) as its own repo with a valid `uikit.json` **and its bundled consumer skill** (`.claude/skills/aurora`). This proves the contract against reality and becomes the generator's gold standard. *Deliverable: 1 external kit repo someone could clone.*

**Phase 3 — CLI + consumption loop.** `tooling/cli` (`uikit init` / `add` / `validate`). Prove the end-user flow: clone Aurora → `uikit init` → ask Claude Code to build an app → it uses the bundled skill. *Deliverable: a real app built on Aurora with the skill, few tokens burned.*

**Phase 4 — Ingest + gallery.** `packages/ingest` fetches Aurora's manifest → DB → `web` lists it and renders a detail page with live preview + the copyable consume steps. *Deliverable: browse + view one kit end-to-end.*

**Phase 5 — Admin import + verification.** `apps/admin`: community submit (paste URL → schema-validate → listed as community) and the **review → verify** flow with the trust checklist. Re-ingest job. *Deliverable: import any compliant repo and promote it to verified.*

**Phase 6 — The Generator skill.** `uikit-standard` skill that scaffolds a new compliant kit *including its consumer skill* from a brief, reusing the Phase 0 schema. *Deliverable: generate a 2nd kit, import it, it appears in the gallery and is consumable.*

**Phase 7 — Polish.** Search facets, shadcn-style registry, webhooks for auto-refresh, landing page marketing, dark mode, analytics, paid kits/auth (if chosen).

---

## 10. Tech Choices (recommended defaults)

| Concern | Pick | Why |
| --- | --- | --- |
| Monorepo | Turborepo + pnpm | You already want Turbo; fast, cache-friendly |
| Apps | **TanStack Start** | SSR + type-safe routing; first-class Workers target |
| Deploy | **Cloudflare Workers via Wrangler** | One edge runtime for every app; `turbo run deploy` |
| Styling | Tailwind v4 | Kits are Tailwind-first; dogfood it |
| DB | **Cloudflare D1 + Drizzle** | SQLite at the edge, same runtime, Drizzle-typed |
| Search | **D1 FTS5** → Vectorize later | SQLite full-text on D1 day one; semantic search via Cloudflare Vectorize when needed |
| Media | **Cloudflare R2** | Screenshots out of the render path, same account |
| Cache/state | Workers KV / Durable Objects | Ingest cache, rate limits, sessions |
| Validation | Zod + JSON Schema | One contract, all consumers |
| Preview | Sandboxed iframe | Security for untrusted kit code |
| Screenshots | **Authored in the kit repo** | We never capture; manifest just references `screenshots/` |

**Cloudflare-specific notes:**
- **No Node-only deps in app runtime.** Ingest (GitHub fetch, manifest parse) runs entirely in the Worker via `fetch` — pure I/O + Zod, no Chromium, no image processing. This is now a non-issue since we don't generate media.
- **D1 instead of Postgres** changes Section 7's data model only at the driver level — Drizzle schema is portable; swap `pg` for `d1`. FTS5 virtual tables replace Postgres `tsvector`.
- **Screenshots** are served from their source (raw GitHub) and optionally **mirrored to R2** at ingest for CDN stability + to survive repo deletion; the DB stores the resolved URL/key either way.
- **Bindings** (`D1`, `R2`, `KV`, `Vectorize`) are declared per-app in `wrangler.toml` and typed into the app via `packages/db`.

---

## 11. Open Questions (need your calls before Phase 2)

1. **Component distribution** — copy-paste source (shadcn style) vs. published npm package per kit? (Recommend: copy-paste registry — AI-friendly, no version hell.)
2. **Kit hosting** — do *you* host demo deployments, or require authors to provide a `demoUrl`? (Recommend: require `demoUrl`, optionally auto-deploy later.)
3. **Monetization / access** — fully open gallery, or paid/premium kits + auth? (Affects DB + `admin` from the start.)
4. **Framework priority** — ship React-only first, add Vue/Web later? (Recommend yes — prove the loop with one framework.)

---

## 12. Build Status — all phases shipped ✅

Phases 0–6 are built and verified (typecheck + tests + SSR smoke tests all green).

| Phase | What shipped | Proof |
| --- | --- | --- |
| 0 · Contract | `packages/manifest` — Zod schema + types + JSON Schema + `validate()` + fixtures | 9 tests pass; `schema/v1.json` emitted |
| 1 · Monorepo | Turborepo + pnpm; `packages/config`, `packages/ui`; `apps/web` + `landing` + `admin` on TanStack Start → Workers | all build; web SSR verified |
| 2 · Aurora kit | External `aurora-uikit` repo: tokens · theme · React components · dashboard + landing · consumer skill · registry · screenshots · valid `uikit.json` | manifest validates; React typechecks |
| 3 · CLI | `tooling/cli` (`uikit`) — `init` · `add` · `new` · `validate` · `info` | loop proven: new → init → add dashboard (dep-resolved) |
| 4 · Ingest + gallery | `packages/ingest` (fetch+validate+normalize) · `packages/db` (D1 + Drizzle + migration) · web gallery list + detail + live preview | 6 ingest tests; gallery + detail SSR verified |
| 5 · Admin | `apps/admin` — submit (URL or manifest → validate → community/pending) · review→verify trust checklist | admin SSR verified; server fns built |
| 6 · Generator | `tooling/uikit-standard` skill (SKILL.md + reference + templates); generated a 2nd kit (`spark-uikit`) | Spark validates, typechecks, ingests, and is CLI-consumable |

**Layout:** the platform monorepo is `uikit/`; kits live in their own sibling repos
(`aurora-uikit/`, `spark-uikit/`) — exactly as the architecture intends.

**Not yet done (Phase 7 / production):** binding a real D1 in dev+prod (the gallery
falls back to a seed locally), R2 mirroring, FTS5/Vectorize search, auth/monetization,
and pushing the kit repos to GitHub. The ingest→D1 path is built and typed; wiring a
live binding is the remaining step to read the gallery from D1 instead of the seed.
