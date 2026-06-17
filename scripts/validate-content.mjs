#!/usr/bin/env node
/**
 * Validates every gallery entry in apps/web/content/kits/*.json — the PR gate.
 * Zero dependencies on purpose: CI can run `node scripts/validate-content.mjs`
 * with nothing installed. Checks shape + that assets (screenshots and the
 * optional preview video) live in the kit's own repo, referenced via pinned
 * CDN URLs — they are never mirrored into this repo.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KITS_DIR = join(root, "apps/web/content/kits");
const PUBLIC_DIR = join(root, "apps/web/public");

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;
const errors = [];

function check(cond, where, msg) {
  if (!cond) errors.push(`${where}: ${msg}`);
}
const isStr = (v) => typeof v === "string" && v.length > 0;
const isStrArr = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
const isBool = (v) => typeof v === "boolean";
// A user-facing text field: a plain string (same in both locales) OR a bilingual
// { en, ar? } object. `en` is required and is the canonical/fallback value.
const isLocalized = (v) =>
  isStr(v) || (v && typeof v === "object" && !Array.isArray(v) && isStr(v.en) && (v.ar === undefined || isStr(v.ar)));

/** A screenshot/demo URL is either a same-origin path (/…) or an absolute URL. */
function isAssetRef(v) {
  return typeof v === "string" && (v.startsWith("/") || /^https?:\/\//.test(v));
}
function localAssetExists(url) {
  if (!url.startsWith("/")) return true; // external — not our file
  if (url.startsWith("/kits/")) return true; // fetched at build from the kit repo
  return existsSync(join(PUBLIC_DIR, url.replace(/^\//, "")));
}
function parseRepo(url) {
  return /github\.com\/[^/]+\/[^/.]+/.test(url ?? "");
}

function validateEntry(file, k) {
  const w = file;
  const stem = file.replace(/\.json$/, "");
  check(k.id === stem, w, `id "${k.id}" must equal filename "${stem}"`);
  check(ID.test(k.id ?? ""), w, "id must be kebab-case");
  // Display text may be bilingual ({en, ar?}); the rest are plain strings.
  for (const f of ["name", "tagline", "description"])
    check(isLocalized(k[f]), w, `${f} must be a non-empty string or {en, ar?} object`);
  for (const f of ["version", "license", "styling", "prompt", "radius"])
    check(isStr(k[f]), w, `${f} must be a non-empty string`);
  check(k.source === "official" || k.source === "community", w, "source must be official|community");
  check(isBool(k.verified), w, "verified must be boolean");
  for (const f of ["primaryColor", "accentColor"]) check(HEX.test(k[f] ?? ""), w, `${f} must be a hex color`);
  check(Array.isArray(k.frameworks) && k.frameworks.length > 0, w, "frameworks must be a non-empty array");
  for (const f of ["categories", "tags", "buildSteps", "components", "blocks", "consumeSteps"])
    check(isStrArr(k[f]), w, `${f} must be a string array`);

  check(k.author && isStr(k.author.name) && isBool(k.author.official), w, "author.{name,official} required");
  check(k.fonts && isStr(k.fonts.display) && isStr(k.fonts.sans) && isStr(k.fonts.mono), w, "fonts.{display,sans,mono} required");

  for (const f of ["brandScale", "palette", "darkPalette"]) {
    const ok = Array.isArray(k[f]) && k[f].every((s) => isStr(s.name) && HEX.test(s.value ?? ""));
    check(ok, w, `${f} must be [{name, value:hex}]`);
  }
  check(Array.isArray(k.templates) && k.templates.every((t) => isStr(t.name)), w, "templates must be [{name, route}]");

  // Assets — screenshots + optional preview video live in the kit's OWN repo
  // (its screenshots/ dir) and are pulled into /kits/<id>/ at build time by
  // scripts/fetch-kit-assets.mjs. demoUrl points at this app's built-in /demos/.
  check(Array.isArray(k.screenshots), w, "screenshots must be an array");
  if (k.video != null) check(isAssetRef(k.video), w, `video "${k.video}" must be a /path or http(s) URL`);
  const refs = [...(k.screenshots ?? []).map((s) => s.url)];
  if (k.demoUrl != null) refs.push(k.demoUrl);
  if (k.video != null) refs.push(k.video);
  for (const url of refs) {
    check(isAssetRef(url), w, `asset "${url}" must be a /path or http(s) URL`);
    if (isAssetRef(url)) check(localAssetExists(url), w, `local asset not found: ${url}`);
  }

  // /kits/<id>/ assets are build-fetched from kit.repo, so that must be a GitHub URL.
  const buildFetched = refs.filter((u) => typeof u === "string" && u.startsWith(`/kits/${k.id}/`));
  if (buildFetched.length) check(parseRepo(k.repo), w, `assets under /kits/${k.id}/ need a github.com repo URL to fetch from (got "${k.repo}")`);
}

const files = existsSync(KITS_DIR) ? readdirSync(KITS_DIR).filter((f) => f.endsWith(".json")) : [];
if (files.length === 0) errors.push("no kit entries found in apps/web/content/kits");

for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(KITS_DIR, file), "utf8"));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  validateEntry(file, data);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s) in content/kits:\n` + errors.map((e) => `  • ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${files.length} kit entr${files.length === 1 ? "y" : "ies"} valid`);
