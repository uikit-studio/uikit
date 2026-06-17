// Spot-check the scene: render single frames at representative timestamps into
// out/probe/ so the design of each act can be eyeballed without a full render.
//   node probe.mjs [--format 16x9] [t1 t2 ...]
import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fmt = process.argv.includes("--format") ? process.argv[process.argv.indexOf("--format") + 1] : "16x9";
const DIMS = fmt === "9x16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
const times = process.argv.slice(2).filter((a) => /^[\d.]+$/.test(a)).map(Number);
const TS = times.length ? times : [1.0, 2.0, 3.2, 5.0, 7.6, 12.6, 17.8, 22.6, 28.0, 33.2];

const outDir = join(here, "out", "probe");
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const { url, close } = await startServer(here, 0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: DIMS, deviceScaleFactor: 1 });
await page.goto(`${url}/scene.html?format=${fmt}`, { waitUntil: "networkidle" });
await page.waitForFunction("window.__ready === true", { timeout: 60000 });
const dur = await page.evaluate(() => window.__duration);
console.log(`duration ${dur.toFixed(2)}s`);

const stage = page.locator("#stage");
for (const t of TS) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const name = `t${String(t).replace(".", "_")}.png`;
  await stage.screenshot({ path: join(outDir, name) });
  console.log("  " + name);
}
await browser.close();
await close();
