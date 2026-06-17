// Builds assets/themes.json (the single source of truth for the scene) by reading
// the kit registry + copying the real screenshots and the vendored GSAP bundle.
// Re-run whenever the kits change. Everything the scene needs lives under assets/
// so the renderer can load it over file:// with no network for app content.
import { readFile, writeFile, mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const kitsDir = join(here, "..", "apps", "web", "content", "kits");
const publicKits = join(here, "..", "apps", "web", "public", "kits");
const assets = join(here, "assets");
const shotsOut = join(assets, "screenshots");
const vendorOut = join(assets, "vendor");
const fontsOut = join(assets, "fonts");
const siteFonts = join(here, "..", "apps", "web", "public", "fonts");

// Sada + Lime first (the community kits), then the official ones.
const ORDER = ["sada", "lime", "aurora", "spark"];

// What you actually GET with each kit (not what the template "is") — Khaleeji-friendly.
const FEATURES = {
  sada: "مكوّنات، صفحات وأغلفة — نظام تصميم تحريري جاهز",
  lime: "مكوّنات، صفحات ولوحة تحكم — نظام تصميم كامل",
  aurora: "لوحة تحكم، مكوّنات وصفحات — نظام تصميم SaaS",
  spark: "مكوّنات، صفحات ولوحة تحكم — نظام تسويق جاهز",
};

const pick = (v, lang = "en") => (v && typeof v === "object" ? v[lang] ?? v.en : v);
const scaleValues = (s) => (s || []).map((x) => x.value);

async function main() {
  await rm(shotsOut, { recursive: true, force: true });
  await mkdir(shotsOut, { recursive: true });
  await mkdir(vendorOut, { recursive: true });
  await mkdir(fontsOut, { recursive: true });

  // self-host Thmanyah Sans (uikit.studio's Arabic display face) so the video
  // matches the site's branding and renders offline
  for (const w of [300, 400, 500, 700, 900]) {
    const f = `thmanyah-sans-${w}.woff2`;
    if (existsSync(join(siteFonts, f))) await copyFile(join(siteFonts, f), join(fontsOut, f));
  }

  const themes = [];
  for (const id of ORDER) {
    const kit = JSON.parse(await readFile(join(kitsDir, `${id}.json`), "utf8"));

    // copy every screenshot this kit ships, keyed by kind
    const srcDir = join(publicKits, id);
    await mkdir(join(shotsOut, id), { recursive: true });
    const shots = {};
    for (const s of kit.screenshots || []) {
      const file = s.url.split("/").pop();
      const from = join(srcDir, file);
      if (existsSync(from)) {
        await copyFile(from, join(shotsOut, id, file));
        // first of each kind wins; keep an explicit landing + a usable alt
        shots[s.kind] = shots[s.kind] || `screenshots/${id}/${file}`;
        shots[`__file_${file}`] = `screenshots/${id}/${file}`;
      }
    }
    const landing = shots.landing || Object.values(shots).find(Boolean);
    // tall full-page capture (from shots.mjs) for the scrolling preview
    const pageShot = existsSync(join(assets, "pages", `${id}.png`)) ? `pages/${id}.png` : null;
    const alt =
      shots["__file_landing-dark.png"] ||
      shots.dashboard ||
      shots.components ||
      shots.other ||
      landing;

    const palette = Object.fromEntries((kit.palette || []).map((p) => [p.name, p.value]));
    const darkPalette = Object.fromEntries((kit.darkPalette || []).map((p) => [p.name, p.value]));

    themes.push({
      id,
      name: pick(kit.name),
      nameAr: pick(kit.name, "ar"),
      tagline: pick(kit.tagline),
      taglineAr: pick(kit.tagline, "ar"),
      verified: !!kit.verified,
      primary: kit.primaryColor,
      accent: kit.accentColor,
      background: palette.background,
      foreground: palette.foreground,
      darkBg: darkPalette.background,
      darkFg: darkPalette.foreground,
      brandScale: scaleValues(kit.brandScale),
      displayFont: kit.fonts?.display,
      tags: (kit.tags || []).slice(0, 4),
      frameworks: kit.frameworks || [],
      feature: FEATURES[id] || pick(kit.tagline),
      installCmd: kit.installCmd,
      rtl: id === "sada", // Arabic-first kit -> show off RTL in its beat
      landing,
      alt,
      page: pageShot,
    });
  }

  await writeFile(join(assets, "themes.json"), JSON.stringify(themes, null, 2));

  // vendor GSAP so the scene needs no CDN at render time
  const gsapSrc = join(here, "node_modules", "gsap", "dist", "gsap.min.js");
  if (existsSync(gsapSrc)) {
    await copyFile(gsapSrc, join(vendorOut, "gsap.min.js"));
  } else {
    console.warn("⚠  gsap not installed yet — run `npm install` then re-run this.");
  }

  console.log(`✓ themes.json (${themes.length} kits): ${themes.map((t) => t.id).join(", ")}`);
  const copied = (await readdir(shotsOut)).length;
  console.log(`✓ screenshots copied into assets/screenshots/ (${copied} kit folders)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
