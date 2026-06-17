/**
 * Capture full-page PNG screenshots of each kit demo for the gallery + detail
 * pages. Companion to record-previews.mjs — same serving model, same output
 * convention (writes into the kit's OWN repo screenshots/, never this repo).
 *
 *   node scripts/screenshot-kits.mjs [kitId ...]
 *
 * Serves apps/web/public so the demos' absolute asset paths (/demos/<id>/…)
 * resolve, then shoots each kit's named views at 1200px CSS width @2x
 * (= 2400px wide, matching the existing assets). Dark shots seed `base-theme`
 * and Arabic-first kits seed `base-lang` before the app mounts, so the page
 * renders in the right language + theme without touching the kit's source.
 */
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // apps/web
const PUBLIC = join(ROOT, "public");
const SIBLINGS = join(ROOT, "../../.."); // …/personal
const FALLBACK = join(ROOT, ".preview-out");

// Each kit's named shots. `route` is relative to /demos/<id>/; `dark` seeds the
// theme. `lang` (optional) seeds the demo locale for Arabic-first kits.
const KITS = [
  {
    id: "sada",
    repo: "thamanayh-uikit/my-kit", // KernelCode/sada-uikit checkout
    lang: "ar",
    shots: [
      { file: "landing.png", route: "" },
      { file: "landing-dark.png", route: "", dark: true },
      { file: "components.png", route: "components/" },
      { file: "podcasts.png", route: "podcasts/" },
    ],
  },
];

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
      const pathname = decodeURIComponent(url.pathname);
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

async function shootKit(browser, port, kit) {
  const { id } = kit;
  const outDir = outDirFor(kit);
  await mkdir(outDir, { recursive: true });

  // 1200 CSS px @2x → 2400px-wide PNGs, matching the existing assets.
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2,
  });
  // Seed locale (Arabic-first kits) before any app JS runs.
  if (kit.lang) {
    await context.addInitScript((lang) => {
      try {
        localStorage.setItem("base-lang", lang);
      } catch {
        /* storage unavailable */
      }
    }, kit.lang);
  }

  for (const shot of kit.shots) {
    const page = await context.newPage();
    if (shot.dark) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem("base-theme", "dark");
        } catch {
          /* storage unavailable */
        }
      });
    }
    const target = `http://127.0.0.1:${port}/demos/${id}/${shot.route}`;
    await page.goto(target, { waitUntil: "networkidle", timeout: 60000 });
    // Hide the floating "back to uikit.studio" pill if the host injected one.
    await page.evaluate(() => {
      const el = document.getElementById("uikit-back");
      if (el) el.style.display = "none";
    });
    await page.waitForTimeout(900); // settle fonts/animations
    const outPath = join(outDir, shot.file);
    await page.screenshot({ path: outPath, fullPage: true });
    const rel = outPath.replace(SIBLINGS + "/", "");
    console.log(`✓ ${id}: ${rel} (${(statSync(outPath).size / 1024).toFixed(0)} KB)`);
    await page.close();
  }

  await context.close();
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
    for (const kit of runnable) await shootKit(browser, port, kit);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
