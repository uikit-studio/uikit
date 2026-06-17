#!/usr/bin/env node
/**
 * Generates the AGENT-READY layer for the gallery — the files an AI agent reads
 * when a developer says "build me a website with this design: <kit url>".
 *
 * Source of truth: apps/web/content/kits/*.json (the same JSON the gallery bakes).
 * Output (committed, served as static assets by the Worker — no backend):
 *   public/llms.txt                     index of every kit (the /llms.txt convention)
 *   public/llms-full.txt                every kit brief concatenated (deep-ingest dump)
 *   public/kit/<id>/llms.txt            self-contained markdown design brief
 *   public/kit/<id>/manifest.json       machine-readable design system
 *
 * Zero dependencies on purpose (mirrors scripts/validate-content.mjs): CI / the
 * build can run `node apps/web/scripts/gen-agent-manifests.mjs` with nothing installed.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(here, ".."); // apps/web
const KITS_DIR = join(WEB, "content/kits");
const PUBLIC_DIR = join(WEB, "public");
const SITE = "https://uikit.studio";

const kits = readdirSync(KITS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(KITS_DIR, f), "utf8")))
  .sort((a, b) => a.id.localeCompare(b.id));

const abs = (u) => (!u ? u : /^https?:\/\//.test(u) ? u : SITE + u);
// name/tagline/description may be bilingual ({en, ar}); the agent spec is
// canonical English (LLMs read it; EN is the registry's source of truth).
const en = (v) => (v && typeof v === "object" ? (v.en ?? v.ar ?? "") : (v ?? ""));
const swatches = (arr) => (arr ?? []).map((s) => `- \`--color-${s.name}\`: \`${s.value}\``).join("\n");
const tokenObj = (arr) => Object.fromEntries((arr ?? []).map((s) => [s.name, s.value]));

/** The copy-paste prompt a developer hands to their agent. */
function agentPrompt(k) {
  return (
    `Build me a website styled exactly like the "${en(k.name)}" design from uikit.studio.\n` +
    `Design spec (agent-readable): ${SITE}/kit/${k.id}/llms.txt\n` +
    `Machine manifest: ${SITE}/kit/${k.id}/manifest.json\n` +
    (k.repo ? `Reference kit (clone to copy the real components/tokens): ${k.repo}\n` : "") +
    `Match its color tokens (light + dark), fonts, radius and component set. Keep full dark mode and responsive layout.`
  );
}

/** The self-contained markdown brief for one kit. */
function kitLlms(k) {
  const fonts = k.fonts ?? {};
  const lines = [];
  lines.push(`# ${en(k.name)} — uikit.studio design spec`);
  lines.push("");
  lines.push(`> ${en(k.tagline)}`);
  lines.push("");
  lines.push(en(k.description));
  lines.push("");
  lines.push(
    `This file is **agent-readable**. If a developer asked you to build a site with the "${en(k.name)}" ` +
      `design, reproduce the design system below exactly — tokens, fonts, radius and components — ` +
      `in their stack, with full dark mode and a responsive layout.`,
  );
  lines.push("");
  lines.push("## Identity");
  lines.push(`- **id**: ${k.id}`);
  lines.push(`- **source**: ${k.source}${k.verified ? " (verified)" : ""}`);
  lines.push(`- **license**: ${k.license}`);
  if (k.repo) lines.push(`- **repo**: ${k.repo}`);
  if (k.demoUrl) lines.push(`- **live demo**: ${abs(k.demoUrl)}`);
  lines.push(`- **gallery**: ${SITE}/kit/${k.id}`);
  lines.push(`- **styling**: ${k.styling}`);
  lines.push(`- **frameworks**: ${(k.frameworks ?? []).join(", ")}`);
  lines.push("");
  lines.push("## Design intent (prompt)");
  lines.push(k.prompt ?? "");
  lines.push("");
  lines.push("## Typography");
  lines.push(`- **display**: ${fonts.display ?? "—"}`);
  lines.push(`- **sans / body**: ${fonts.sans ?? "—"}`);
  lines.push(`- **mono**: ${fonts.mono ?? "—"}`);
  lines.push("");
  lines.push("## Radius");
  lines.push(`- base \`--radius\`: \`${k.radius}\``);
  lines.push("");
  if (k.brandScale?.length) {
    lines.push("## Brand scale");
    lines.push(k.brandScale.map((s) => `- \`${s.name}\`: \`${s.value}\``).join("\n"));
    lines.push("");
  }
  lines.push("## Color tokens — light");
  lines.push(swatches(k.palette));
  lines.push("");
  lines.push("## Color tokens — dark");
  lines.push(swatches(k.darkPalette));
  lines.push("");
  if (k.components?.length) {
    lines.push("## Components");
    lines.push(k.components.map((c) => `- ${c}`).join("\n"));
    lines.push("");
  }
  if (k.blocks?.length) {
    lines.push("## Blocks");
    lines.push(k.blocks.map((b) => `- ${b}`).join("\n"));
    lines.push("");
  }
  if (k.templates?.length) {
    lines.push("## Pages");
    lines.push(k.templates.map((t) => `- ${t.name} → \`${t.route}\``).join("\n"));
    lines.push("");
  }
  lines.push("## How to reproduce this design");
  lines.push(
    "**Option A — clone the kit (fastest, exact):**" +
      (k.repo
        ? `\n\`\`\`bash\ngit clone ${k.repo} my-app\ncd my-app/react && pnpm install && pnpm dev\n\`\`\`\n` +
          `The real tokens live in \`design/theme.css\` + \`design/tokens.json\`; components in \`react/src/components\`. ` +
          `Build the developer's pages against those.`
        : "\n(No public repo — use Option B.)"),
  );
  lines.push("");
  lines.push(
    "**Option B — apply the design system directly:** set the light + dark color tokens above as CSS " +
      "variables, load the three fonts, use the base radius, and build the listed components and pages. " +
      "Keep dark mode and EN/AR + RTL parity if the target needs it.",
  );
  if (k.installCmd) {
    lines.push("");
    lines.push(`**Option C — add via CLI:** \`${k.installCmd}\`${k.skillName ? ` (Claude Code skill: \`${k.skillName}\`)` : ""}`);
  }
  lines.push("");
  return lines.join("\n");
}

/** The machine-readable manifest for one kit. */
function kitManifest(k) {
  return {
    $schema: `${SITE}/agent-manifest.schema.json`,
    id: k.id,
    name: en(k.name),
    tagline: en(k.tagline),
    description: en(k.description),
    version: k.version,
    source: k.source,
    verified: k.verified,
    license: k.license,
    repo: k.repo,
    demo: abs(k.demoUrl),
    gallery: `${SITE}/kit/${k.id}`,
    spec: `${SITE}/kit/${k.id}/llms.txt`,
    styling: k.styling,
    frameworks: k.frameworks,
    prompt: k.prompt,
    fonts: k.fonts,
    radius: k.radius,
    tokens: { light: tokenObj(k.palette), dark: tokenObj(k.darkPalette) },
    brandScale: tokenObj(k.brandScale),
    components: k.components,
    blocks: k.blocks,
    templates: k.templates,
    install: k.installCmd,
    skill: k.skillName,
    agentPrompt: agentPrompt(k),
  };
}

let count = 0;
for (const k of kits) {
  const dir = join(PUBLIC_DIR, "kit", k.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "llms.txt"), kitLlms(k));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(kitManifest(k), null, 2) + "\n");
  count++;
}

// Root index — the /llms.txt convention.
const index = [
  "# uikit.studio",
  "",
  "> A curated gallery of runnable, **agent-ready** UI kits. Point any AI agent (Claude Code, Cursor, Codex) at a kit URL and it can reproduce that exact design.",
  "",
  "Paste into your agent: *“build me a website with this design: " + SITE + "/kit/<id>”*. Each kit exposes a full design spec and a machine manifest.",
  "",
  "## Kits",
  ...kits.map(
    (k) =>
      `- [${en(k.name)}](${SITE}/kit/${k.id}/llms.txt): ${en(k.tagline)}. ` +
      `Spec: ${SITE}/kit/${k.id}/llms.txt · Manifest: ${SITE}/kit/${k.id}/manifest.json` +
      (k.repo ? ` · Repo: ${k.repo}` : ""),
  ),
  "",
  "## Full",
  `- [llms-full.txt](${SITE}/llms-full.txt): every kit's design brief in one file.`,
  "",
].join("\n");
writeFileSync(join(PUBLIC_DIR, "llms.txt"), index);

// Full dump.
const full = [
  "# uikit.studio — all kit design specs",
  "",
  `Generated from ${kits.length} kit${kits.length === 1 ? "" : "s"}. Each section is a self-contained, agent-readable design brief.`,
  "",
  ...kits.flatMap((k) => ["", "---", "", kitLlms(k)]),
].join("\n");
writeFileSync(join(PUBLIC_DIR, "llms-full.txt"), full);

console.log(`✓ agent manifests: ${count} kit(s) → public/kit/<id>/{llms.txt,manifest.json} + public/llms.txt + public/llms-full.txt`);
