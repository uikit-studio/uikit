// Capture the DASHBOARD page of given demos (Arabic, 4:3 viewport) for the card.
// Output: assets/pages/<id>-dash.png
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const webPublic = join(here, "..", "apps", "web", "public");
const pagesOut = join(here, "assets", "pages");
const KITS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const list = KITS.length ? KITS : ["aurora", "spark"];

await mkdir(pagesOut, { recursive: true });
const { url, close } = await startServer(webPublic, 0);
const browser = await chromium.launch();

for (const id of list) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1.5 });
  await page.addInitScript((kid) => { try { localStorage.setItem(kid + "-lang", "ar"); } catch {} }, id);
  await page.goto(`${url}/demos/${id}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // navigate to the dashboard via the in-app link (SPA routing)
  const link = page.locator('a[href*="dashboard"]').first();
  if (await link.count()) {
    await link.click();
    await page.waitForTimeout(900);
  } else {
    console.warn(`⚠  ${id}: no dashboard link found`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(pagesOut, `${id}-dash.png`), clip: { x: 0, y: 0, width: 1440, height: 1080 } });
  console.log(`✓ ${id}-dash.png`);
  await page.close();
}
await browser.close();
await close();
