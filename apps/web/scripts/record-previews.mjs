/**
 * Record short, scrolling preview clips (.webm) of each kit demo for the
 * homepage gallery cards. Playwright records webm natively (no ffmpeg needed).
 *
 *   node scripts/record-previews.mjs [kitId ...]
 *
 * Serves apps/web/public so the demos' absolute asset paths (/demos/<id>/…)
 * resolve, drives a 4:3 page through a smooth top→bottom scroll, and writes
 * the clip into the kit's OWN repo (../../../<kit>-uikit/screenshots/preview.webm),
 * never into this repo — the gallery references it via CDN from there. Kits whose
 * repo isn't cloned locally fall back to .preview-out/<id>/ with a warning.
 */
import { createServer } from "node:http";
import { readFile, mkdir, rm, rename, copyFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // apps/web
const PUBLIC = join(ROOT, "public");
const SIBLINGS = join(ROOT, "../../.."); // …/personal (apps/web → apps → uikit → personal)
const FALLBACK = join(ROOT, ".preview-out");

// Each kit demo lives at /demos/<id>/. `repo` is the kit's own checkout dir
// (sibling of this repo); the clip is written to its screenshots/. Kits with no
// local repo (e.g. sada lives in KernelCode/sada-uikit) record to FALLBACK.
const KITS = [
  { id: "aurora", repo: "aurora-uikit" },
  { id: "lime", repo: "lime-uikit" },
  { id: "spark", repo: "spark-uikit" },
  // Arabic-first kit: capture the preview in Arabic + RTL (the demo defaults to
  // EN via localStorage, so `lang` seeds `base-lang` before the app mounts).
  { id: "sada", repo: "thamanayh-uikit/my-kit", lang: "ar" }, // KernelCode/sada-uikit checkout
];

/** Where a kit's preview.webm should land: its repo screenshots/, else fallback. */
function outDirFor(kit) {
  const repoShots = join(SIBLINGS, kit.repo, "screenshots");
  return existsSync(join(SIBLINGS, kit.repo)) ? repoShots : join(FALLBACK, kit.id);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".md": "text/markdown; charset=utf-8",
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let pathname = decodeURIComponent(url.pathname);
      // Block traversal, default directory → index.html.
      let filePath = normalize(join(PUBLIC, pathname));
      if (!filePath.startsWith(PUBLIC)) {
        res.writeHead(403).end();
        return;
      }
      if (pathname.endsWith("/")) filePath = join(filePath, "index.html");
      if (!existsSync(filePath)) {
        res.writeHead(404).end("not found");
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
      res.end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

// Smooth top→bottom→top scroll inside the page so the clip shows the layout.
async function scrollThrough(page, ms) {
  await page.evaluate(async (duration) => {
    const max = Math.max(0, document.body.scrollHeight - window.innerHeight);
    if (max === 0) {
      await new Promise((r) => setTimeout(r, duration));
      return;
    }
    const hold = 700; // linger at top before moving
    const down = duration - hold;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    await new Promise((resolve) => {
      function frame(now) {
        const elapsed = now - start;
        if (elapsed < hold) {
          requestAnimationFrame(frame);
          return;
        }
        const t = Math.min(1, (elapsed - hold) / down);
        window.scrollTo(0, ease(t) * max);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }, ms);
}

async function recordKit(browser, port, kit) {
  const { id } = kit;
  const demoUrl = `http://127.0.0.1:${port}/demos/${id}/`;
  const outDir = outDirFor(kit);
  const tmpDir = join(ROOT, ".preview-tmp", id);
  await mkdir(outDir, { recursive: true });
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  const viewport = { width: 1200, height: 900 }; // 4:3 to match the card
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: tmpDir, size: viewport },
  });
  // Seed the kit's locale before any app JS runs, so it mounts in that language
  // (and RTL, for Arabic). The demo reads `base-lang` from localStorage on init.
  if (kit.lang) {
    await context.addInitScript((lang) => {
      try {
        localStorage.setItem("base-lang", lang);
      } catch {
        /* storage unavailable — fall back to demo default */
      }
    }, kit.lang);
  }
  const page = await context.newPage();

  console.log(`▶ ${id}${kit.lang ? ` [${kit.lang}]` : ""}: ${demoUrl}`);
  await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });
  // Hide the floating "back to uikit.studio" pill if present.
  await page.evaluate(() => {
    const el = document.getElementById("uikit-back");
    if (el) el.style.display = "none";
  });
  await page.waitForTimeout(900); // settle fonts/animations

  await scrollThrough(page, 7000); // ~7s clip
  await page.waitForTimeout(400);

  const video = page.video();
  await context.close(); // finalizes the webm
  const src = await video.path();

  const finalPath = join(outDir, "preview.webm");
  await rm(finalPath, { force: true });
  await rename(src, finalPath).catch(() => copyFile(src, finalPath)); // cross-device fallback
  await rm(tmpDir, { recursive: true, force: true });
  const rel = finalPath.replace(SIBLINGS + "/", "");
  console.log(`✓ ${id}: ${rel} (${(statSync(finalPath).size / 1024).toFixed(0)} KB)`);
  if (!existsSync(join(SIBLINGS, kit.repo))) {
    console.warn(`  ⚠ ${kit.repo} not cloned — wrote to .preview-out; add it to that repo manually.`);
  }
}

async function main() {
  const want = process.argv.slice(2);
  const kits = want.length ? KITS.filter((k) => want.includes(k.id)) : KITS;
  const missing = kits.filter((k) => !existsSync(join(PUBLIC, "demos", k.id, "index.html")));
  if (missing.length) {
    console.warn(`⚠ no demo for: ${missing.map((k) => k.id).join(", ")} — skipping`);
  }
  const runnable = kits.filter((k) => !missing.includes(k));

  const { server, port } = await startServer();
  const browser = await chromium.launch();
  try {
    for (const kit of runnable) await recordKit(browser, port, kit);
  } finally {
    await browser.close();
    server.close();
    await rm(join(ROOT, ".preview-tmp"), { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
