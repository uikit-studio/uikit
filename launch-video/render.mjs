// Frame-exact renderer. Serves the scene, drives the GSAP master timeline one
// frame at a time with Playwright (deterministic — no real-time recording), then
// stitches the PNG frames into an H.264 MP4 with the bundled static ffmpeg.
//
//   node render.mjs --format 16x9            -> out/uikit-launch-16x9.mp4
//   node render.mjs --format 9x16
//   node render.mjs --format 16x9 --audio track.mp3   (mux a music bed)
//   flags: --fps 60  --crf 17  --out <file>
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startServer } from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const FORMAT = arg("format", "16x9") === "9x16" ? "9x16" : "16x9";
const FPS = Number(arg("fps", "60"));
const CRF = arg("crf", "17");
const AUDIO = arg("audio", null);
const DIMS = FORMAT === "9x16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
const OUT = arg("out", join(here, "out", `uikit-launch-${FORMAT}.mp4`));
const framesDir = join(here, "assets", "frames");

const run = (bin, args) =>
  new Promise((res, rej) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${bin} exited ${c}`))));
  });

async function main() {
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  await mkdir(join(here, "out"), { recursive: true });

  const { url, close } = await startServer(here, 0);
  const browser = await chromium.launch({
    args: ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-lcd-text"],
  });
  const page = await browser.newPage({
    viewport: DIMS,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });

  console.log(`▶ ${FORMAT} ${DIMS.width}×${DIMS.height} @ ${FPS}fps`);
  await page.goto(`${url}/scene.html?format=${FORMAT}`, { waitUntil: "networkidle" });
  await page.waitForFunction("window.__ready === true", { timeout: 60000 });
  // settle webfonts one more beat
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const duration = await page.evaluate(() => window.__duration);
  const total = Math.ceil(duration * FPS);
  console.log(`  duration ${duration.toFixed(2)}s → ${total} frames`);

  const stageEl = page.locator("#stage");
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    await page.evaluate((tt) => window.__seek(tt), t);
    // let the browser paint the seeked frame (two rAFs)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await stageEl.screenshot({ path: join(framesDir, String(f).padStart(6, "0") + ".png") });
    if (f % 60 === 0 || f === total - 1) {
      const pct = (((f + 1) / total) * 100).toFixed(0);
      const eta = ((Date.now() - t0) / (f + 1)) * (total - f - 1) / 1000;
      process.stdout.write(`\r  capturing ${pct}%  (${f + 1}/${total})  eta ${eta.toFixed(0)}s   `);
    }
  }
  process.stdout.write("\n");

  await browser.close();
  await close();

  console.log("  encoding with ffmpeg…");
  const args = ["-y", "-framerate", String(FPS), "-i", join(framesDir, "%06d.png")];
  if (AUDIO) args.push("-i", AUDIO);
  args.push(
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", String(CRF), "-preset", "slow",
    "-movflags", "+faststart"
  );
  if (AUDIO) args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  args.push(OUT);
  await run(ffmpegPath, args);

  const { size } = await stat(OUT);
  console.log(`\n✓ ${OUT}  (${(size / 1e6).toFixed(1)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
