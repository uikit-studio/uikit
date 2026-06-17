# uikit.studio — launch video

A ~14s Arabic-first animated launch teaser, built with **GSAP + HTML** and
rendered **frame-exact** to MP4. It tours all four kits — **Sada**, **Lime**,
**Aurora**, **Spark** — straight from the registry, so the video never drifts
from the real kits.

It matches the **uikit.studio** brand: warm off-white canvas, near-black ink,
**Outfit** (Latin) + **Thmanyah Sans** (Arabic, self-hosted from the site's
`/public/fonts`), and the rose→coral accent — all pulled from
`apps/web/app/styles/app.css`. Every demo is RTL with the kit's Arabic tagline
as the hero.

The scene is one **paused GSAP master timeline**. The renderer seeks it one frame
at a time with Playwright and stitches the frames with a bundled static ffmpeg —
no real-time screen recording, so the result is perfectly smooth and repeatable.

## Setup

```bash
cd launch-video
npm run setup          # npm install + playwright chromium + build-data
```

`setup` runs three things you can also run on their own:

```bash
npm install
npx playwright install chromium
node build-data.mjs    # reads ../apps/web/content/kits/*.json + copies screenshots → assets/
```

Re-run `node build-data.mjs` whenever a kit changes (new screenshot, new color,
or a 5th kit added) — the video picks it up automatically.

## Preview (real time, in your browser)

```bash
node serve.mjs
```

Open the printed URL. Append `?autoplay=1` to auto-play; `space` pause/play,
`←/→` scrub, `Home` restart. Use `?format=9x16` for the vertical layout.

## Render

```bash
npm run render            # → out/uikit-launch-16x9.mp4   (1920×1080, 60fps)
npm run render:vertical   # → out/uikit-launch-9x16.mp4   (1080×1920, 60fps)
npm run render:all        # both

# spot-check single frames without a full render:
node probe.mjs 7.6 17.8 28   # → out/probe/*.png
```

Flags: `--format 16x9|9x16` · `--fps 60` · `--crf 17` (lower = higher quality) ·
`--out <file>` · `--audio <file>` to mux a music bed.

```bash
node render.mjs --format 16x9 --audio music.mp3
```

> A music track makes a big difference for a launch clip but can't be generated
> here. Drop a royalty-free track (e.g. from Pixabay Music, Uppbeat, or YouTube
> Audio Library) next to this folder and pass it with `--audio`. The timeline is
> paced with a hook → reveal → 4-theme tour → CTA so a ~120bpm bed lands well.

## Storyboard

| t | act |
|------|-----|
| 0.0–3.5s | **Hook** — typed prompt → generic wireframe shatters → *"Building UI with AI shouldn't mean burning tokens & praying."* |
| 3.5–6.0s | **Promise** — `uikit.studio` wordmark · *a gallery of runnable UI kits* |
| 6.0–26.0s | **Theme tour** — Aurora → Spark → Sada (RTL) → Lime, 5s each, real screenshots in browser mocks |
| 26.0–31.0s | **Payoff** — `npx uikit-cli add …` cascade · *your AI builds a real product with it* |
| 31.0–35.2s | **Outro** — wordmark · uikit.studio · Open in Claude Code |

## Files

```
scene.html / scene.css / scene.js   the animated stage + GSAP master timeline
build-data.mjs                       registry → assets/themes.json + screenshots
server.mjs / serve.mjs               static server (preview)
render.mjs                           Playwright seek-per-frame → ffmpeg → MP4
probe.mjs                            capture single frames for spot-checks
assets/  (generated)                 themes.json, screenshots/, vendor/gsap.min.js
out/     (generated)                 rendered mp4s
```
