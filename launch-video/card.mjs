// Shoot a static card (default linkedin.html) to a crisp PNG.
//   node card.mjs                       -> out/linkedin-1200.png  (1200×1200 @2x)
//   node card.mjs --page linkedin.html --w 1200 --h 1200 --out out/foo.png
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const PAGE = arg("page", "linkedin.html");
const W = Number(arg("w", "1200"));
const H = Number(arg("h", "1200"));
const OUT = arg("out", join(here, "out", `linkedin-${W}.png`));

await mkdir(join(here, "out"), { recursive: true });
const { url, close } = await startServer(here, 0);
const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto(`${url}/${PAGE}`, { waitUntil: "networkidle" });
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.locator("#card").screenshot({ path: OUT });
console.log("✓ " + OUT);
await browser.close();
await close();
