/**
 * Build-time asset fetch. Every kit's screenshots + preview clip live ONLY in
 * the kit's own repo (its screenshots/ dir) — never committed here. Before the
 * build, this pulls each asset referenced as /kits/<id>/<file> from that repo
 * into apps/web/public/kits/<id>/ (gitignored), so production serves them from
 * uikit.studio's own CDN with no third-party runtime dependency.
 *
 *   node scripts/fetch-kit-assets.mjs [--force]
 *
 * Source per kit: the JSON `repo` (GitHub URL) at ref `assetsRef` (default
 * "main"). Missing assets warn and are skipped (the card falls back to its
 * poster/photo) rather than failing the build — e.g. a preview.webm not yet
 * pushed to the kit repo.
 */
import { readdir, readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // apps/web
const KITS_DIR = join(ROOT, "content/kits");
const PUBLIC = join(ROOT, "public");
const FORCE = process.argv.includes("--force");

/** Parse owner/name from a github.com repo URL. */
function parseRepo(url) {
  const m = /github\.com\/([^/]+)\/([^/.]+)/.exec(url ?? "");
  return m ? { owner: m[1], name: m[2] } : null;
}

/** Candidate CDN URLs for screenshots/<file> — raw first, jsDelivr as fallback. */
function sources({ owner, name }, ref, file) {
  return [
    `https://raw.githubusercontent.com/${owner}/${name}/${ref}/screenshots/${file}`,
    `https://cdn.jsdelivr.net/gh/${owner}/${name}@${ref}/screenshots/${file}`,
  ];
}

async function download(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* try next source */
    }
  }
  return null;
}

async function main() {
  const files = existsSync(KITS_DIR) ? (await readdir(KITS_DIR)).filter((f) => f.endsWith(".json")) : [];
  let fetched = 0;
  let skipped = 0;
  const failures = [];

  for (const file of files) {
    const kit = JSON.parse(await readFile(join(KITS_DIR, file), "utf8"));
    const refs = [...(kit.screenshots ?? []).map((s) => s.url), kit.video].filter(Boolean);
    const local = refs.filter((u) => typeof u === "string" && u.startsWith(`/kits/${kit.id}/`));
    if (local.length === 0) continue;

    const repo = parseRepo(kit.repo);
    if (!repo) {
      failures.push(`${kit.id}: references /kits/ assets but has no GitHub repo URL`);
      continue;
    }
    const ref = kit.assetsRef ?? "main";

    for (const url of local) {
      const out = join(PUBLIC, url.replace(/^\//, ""));
      if (!FORCE && existsSync(out) && (await stat(out)).size > 0) {
        skipped++;
        continue;
      }
      const buf = await download(sources(repo, ref, basename(url)));
      if (!buf) {
        failures.push(`${kit.id}: ${basename(url)} not found in ${repo.owner}/${repo.name}@${ref}/screenshots/`);
        continue;
      }
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, buf);
      fetched++;
      console.log(`✓ ${url}  ←  ${repo.owner}/${repo.name}@${ref} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
  }

  if (skipped) console.log(`• ${skipped} asset(s) already present (use --force to refetch)`);
  console.log(`✓ fetched ${fetched} kit asset(s)`);
  if (failures.length) {
    // Non-fatal: the gallery falls back to poster/photo for anything missing.
    console.warn(`⚠ ${failures.length} asset(s) unavailable (cards fall back):`);
    for (const f of failures) console.warn(`  • ${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
