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
// theme; `fullPage` overrides the kit default per shot.
// `langKey` is the kit's own localStorage locale key (each kit namespaces it).
//
// SIZING CONTRACT: the gallery card and the README embed `landing.png` as the
// poster for `preview.webm`, so the poster MUST share the video's 4:3 aspect
// (1200×900) or `object-fit: cover` crops it — and in RTL that clips the
// right-aligned headline. Hence every `landing.png` is a 4:3 1200×900 @2x shot
// (2400×1800), matching the 1200×900 video. Full-page detail shots (sada's
// editorial pages) opt in per shot with `fullPage: true`.
const KITS = [
  {
    id: "sada",
    repo: "thamanayh-uikit/my-kit", // KernelCode/sada-uikit checkout
    lang: "ar",
    langKey: "base-lang",
    viewport: { width: 1200, height: 900 }, // 4:3, matches preview.webm
    scale: 2,
    fullPage: false,
    shots: [
      { file: "landing.png", route: "" }, // poster → 4:3
      { file: "landing-dark.png", route: "", dark: true, fullPage: true },
      { file: "components.png", route: "components/", fullPage: true },
      { file: "podcasts.png", route: "podcasts/", fullPage: true },
    ],
  },
  // aurora/spark/lime: 4:3 above-the-fold shots so the landing poster matches
  // the 4:3 video (was 16:10, which cropped the RTL headline on the card).
  {
    id: "aurora",
    repo: "aurora-uikit",
    lang: "ar",
    langKey: "aurora-lang",
    viewport: { width: 1200, height: 900 },
    scale: 2,
    fullPage: false,
    shots: [
      { file: "landing.png", route: "" },
      { file: "dashboard.png", route: "dashboard/" },
      { file: "components.png", route: "components/" },
    ],
  },
  {
    id: "spark",
    repo: "spark-uikit",
    lang: "ar",
    langKey: "spark-lang",
    viewport: { width: 1200, height: 900 },
    scale: 2,
    fullPage: false,
    shots: [
      { file: "landing.png", route: "" },
      { file: "dashboard.png", route: "dashboard/" },
      { file: "components.png", route: "components/" },
    ],
  },
  {
    id: "lime",
    repo: "lime-uikit",
    lang: "ar",
    langKey: "lime-lang",
    viewport: { width: 1200, height: 900 },
    scale: 2,
    fullPage: false,
    shots: [
      { file: "landing.png", route: "" },
      { file: "dashboard.png", route: "dashboard/" },
      { file: "components.png", route: "components/" },
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

  const viewport = kit.viewport ?? { width: 1200, height: 900 };
  const scale = kit.scale ?? 2;
  const fullPage = kit.fullPage ?? true;
  const langKey = kit.langKey ?? "base-lang";
  const themeKey = kit.themeKey ?? "base-theme";
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale });
  // Seed locale before any app JS runs (each kit namespaces its locale key).
  if (kit.lang) {
    await context.addInitScript(
      ({ key, lang }) => {
        try {
          localStorage.setItem(key, lang);
        } catch {
          /* storage unavailable */
        }
      },
      { key: langKey, lang: kit.lang },
    );
  }

  for (const shot of kit.shots) {
    const page = await context.newPage();
    if (shot.dark) {
      await page.addInitScript((key) => {
        try {
          localStorage.setItem(key, "dark");
        } catch {
          /* storage unavailable */
        }
      }, themeKey);
    }
    const target = `http://127.0.0.1:${port}/demos/${id}/${shot.route}`;
    await page.goto(target, { waitUntil: "networkidle", timeout: 60000 });
    // Hide the floating "back to uikit.studio" pill if the host injected one.
    await page.evaluate(() => {
      const el = document.getElementById("uikit-back");
      if (el) el.style.display = "none";
    });
    // Don't shoot until webfonts are loaded AND applied, or the PNG captures a
    // flash of unstyled text (FOUT) instead of the kit's real type.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700); // settle animations
    const outPath = join(outDir, shot.file);
    await page.screenshot({ path: outPath, fullPage: shot.fullPage ?? fullPage });
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
