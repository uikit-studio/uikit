// Capture tall full-page screenshots of each live demo (in Arabic) so the video's
// browser mock can scroll through the real page like a fast playthrough.
// Output: assets/pages/<id>.png  (consumed by build-data.mjs → themes.json)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const webPublic = join(here, "..", "apps", "web", "public");
const pagesOut = join(here, "assets", "pages");
const KITS = ["sada", "lime", "aurora", "spark"];

await mkdir(pagesOut, { recursive: true });
const { url, close } = await startServer(webPublic, 0);
const browser = await chromium.launch();

for (const id of KITS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  // each kit reads its locale from localStorage "<id>-lang" — force Arabic + RTL
  await page.addInitScript((kid) => {
    try { localStorage.setItem(kid + "-lang", "ar"); } catch {}
  }, id);
  await page.goto(`${url}/demos/${id}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  // step-scroll to the bottom to trigger any reveal-on-scroll sections, then back up
  await page.evaluate(
    () =>
      new Promise((res) => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += 700;
          if (y < document.body.scrollHeight) setTimeout(step, 25);
          else { window.scrollTo(0, 0); setTimeout(res, 250); }
        };
        step();
      })
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(pagesOut, `${id}.png`), fullPage: true });
  const h = await page.evaluate(() => document.body.scrollHeight);
  console.log(`✓ ${id}  (page height ~${h}px)`);
  await page.close();
}

await browser.close();
await close();
