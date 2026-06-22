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
import { existsSync, statSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // apps/web
const PUBLIC = join(ROOT, "public");
const SIBLINGS = join(ROOT, "../../.."); // …/personal (apps/web → apps → uikit → personal)
const FALLBACK = join(ROOT, ".preview-out");

// Trim the first frames off each clip: recordVideo starts at page creation, so
// the webm opens on a blank frame while the SPA mounts. The font cache is warmed
// before recording (no FOUT), so by ~0.15s the page is fully styled — drop the
// lead-in so the looping card starts on the finished UI, not the load.
const LEAD_IN_SECONDS = 0.6;

/** Locate Playwright's bundled ffmpeg in the ms-playwright browser cache. */
function findFfmpeg() {
  const base =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === "darwin"
      ? join(homedir(), "Library/Caches/ms-playwright")
      : process.platform === "win32"
        ? join(homedir(), "AppData/Local/ms-playwright")
        : join(homedir(), ".cache/ms-playwright"));
  try {
    const dir = readdirSync(base).find((d) => d.startsWith("ffmpeg-"));
    if (!dir) return null;
    const bin = readdirSync(join(base, dir)).find((f) => f.startsWith("ffmpeg"));
    return bin ? join(base, dir, bin) : null;
  } catch {
    return null;
  }
}

const FFMPEG = findFfmpeg();

/** Re-encode `src` into `dest` dropping the first `seconds`. Returns success. */
function trimLeadIn(src, dest, seconds) {
  if (!FFMPEG) return false;
  const r = spawnSync(
    FFMPEG,
    ["-y", "-ss", String(seconds), "-i", src, "-c:v", "libvpx", "-b:v", "1M", "-an", dest],
    { stdio: "ignore" },
  );
  return r.status === 0;
}

// Each kit demo lives at /demos/<id>/. `repo` is the kit's own checkout dir
// (sibling of this repo); the clip is written to its screenshots/. Kits with no
// local repo (e.g. sada lives in KernelCode/sada-uikit) record to FALLBACK.
// `lang` records the clip in that locale (the demos default to EN); `langKey`
// is the kit's own localStorage locale key (each kit namespaces it), seeded
// before the app mounts. uikit.studio is an Arabic-first gallery, so all clips
// are recorded in Arabic + RTL.
const KITS = [
  { id: "aurora", repo: "aurora-uikit", lang: "ar", langKey: "aurora-lang" },
  { id: "lime", repo: "lime-uikit", lang: "ar", langKey: "lime-lang" },
  { id: "spark", repo: "spark-uikit", lang: "ar", langKey: "spark-lang" },
  { id: "sada", repo: "thamanayh-uikit/my-kit", lang: "ar", langKey: "base-lang" }, // KernelCode/sada-uikit checkout
  { id: "admax", repo: "admax-uikit", lang: "ar", langKey: "admax-lang" },
  { id: "verdant", repo: "verdant-uikit", lang: "ar", langKey: "verdant-lang" },
  { id: "chomp", repo: "chomp-uikit", lang: "ar", langKey: "crux-lang" },
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
    await context.addInitScript(
      ({ key, lang }) => {
        try {
          localStorage.setItem(key, lang);
        } catch {
          /* storage unavailable — fall back to demo default */
        }
      },
      { key: kit.langKey ?? "base-lang", lang: kit.lang },
    );
  }
  // Warm the context cache (fonts + assets) on a throw-away page first, so the
  // RECORDED page paints fully-styled from its very first frame. Without this
  // the clip opens on a ~1–2s flash of unstyled text (FOUT) while webfonts
  // load — and because the gallery card loops the clip, that flash shows every
  // loop. The warm page caches the woff2s; the record page then loads instantly.
  const warm = await context.newPage();
  await warm.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });
  await warm.evaluate(() => document.fonts.ready);
  await warm.close();

  const page = await context.newPage();

  console.log(`▶ ${id}${kit.lang ? ` [${kit.lang}]` : ""}: ${demoUrl}`);
  await page.goto(demoUrl, { waitUntil: "networkidle", timeout: 60000 });
  // Hide the floating "back to uikit.studio" pill if present.
  await page.evaluate(() => {
    const el = document.getElementById("uikit-back");
    if (el) el.style.display = "none";
  });
  // Don't record until webfonts are loaded AND applied (cached → near-instant).
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700); // settle layout/animations

  await scrollThrough(page, 7000); // ~7s clip
  await page.waitForTimeout(400);

  const video = page.video();
  await context.close(); // finalizes the webm
  const src = await video.path();

  const finalPath = join(outDir, "preview.webm");
  await rm(finalPath, { force: true });
  // Trim the blank mount lead-in; fall back to the raw clip if ffmpeg is absent.
  if (!trimLeadIn(src, finalPath, LEAD_IN_SECONDS)) {
    if (!FFMPEG) console.warn("  ⚠ ffmpeg not found — clip not trimmed; first frames may show the load.");
    await rename(src, finalPath).catch(() => copyFile(src, finalPath)); // cross-device fallback
  }
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
