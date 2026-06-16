#!/usr/bin/env node
/**
 * Generates the SEO sitemap from the kit registry — pure git, no backend.
 *
 * Source of truth: apps/web/content/kits/*.json (the same JSON the gallery bakes).
 * Output (committed, served as a static asset by the Worker):
 *   public/sitemap.xml   home + /submit + every /kit/<id>
 *
 * robots.txt + favicon + web manifest are static (public/). Zero dependencies,
 * mirrors scripts/gen-agent-manifests.mjs so CI / the build can run it with
 * nothing installed.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
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

const today = new Date().toISOString().slice(0, 10);

/** One <url> entry. Two hreflang alternates (ar/en) — the gallery is bilingual. */
function urlEntry(loc, priority) {
  return [
    "  <url>",
    `    <loc>${SITE}${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>weekly</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="ar" href="${SITE}${loc}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${loc}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${loc}" />`,
    "  </url>",
  ].join("\n");
}

const entries = [
  urlEntry("/", "1.0"),
  urlEntry("/submit", "0.7"),
  ...kits.map((k) => urlEntry(`/kit/${k.id}`, "0.8")),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  entries.join("\n"),
  "</urlset>",
  "",
].join("\n");

writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), xml);
console.log(`✓ sitemap.xml — ${entries.length} urls (${kits.length} kits)`);
