/**
 * Gallery data — pure git, no backend. Every kit is a JSON entry in
 * `apps/web/content/kits/*.json`, baked into the build via import.meta.glob.
 * Assets (screenshots + the preview clip) live in each kit's own repo and are
 * pulled into /kits/<id>/ at build time from kit.repo (scripts/fetch-kit-assets.mjs)
 * — never committed here. JSON references them as /kits/<id>/… paths. Curation =
 * PR review; CI validates the shape (scripts/validate-content.mjs). Adding a kit
 * means adding one JSON file.
 */

import type { Locale } from "./i18n";

export interface Swatch {
  name: string;
  value: string;
}

/**
 * A user-facing text field that may be authored in both languages. A bare
 * string is treated as the same text in EN and AR; an object localizes it.
 * Used for `name`, `tagline` and `description` so an Arabic visitor reads the
 * kit's own Arabic copy, not the English source. See `prompts/build.md`.
 */
export type Localized = string | { en: string; ar?: string };

/** Resolve a localized field for display (AR falls back to EN; string → itself). */
export function L(value: Localized | undefined | null, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return (locale === "ar" ? value.ar : value.en) || value.en || value.ar || "";
}

/** Canonical EN form — for machine surfaces (SEO meta, JSON-LD, agent specs) and sorting. */
export function enOf(value: Localized | undefined | null): string {
  if (value == null) return "";
  return typeof value === "string" ? value : value.en || value.ar || "";
}

/** Both locales flattened, so search matches whichever language the user types. */
export function searchOf(value: Localized | undefined | null): string {
  if (value == null) return "";
  return typeof value === "string" ? value : [value.en, value.ar].filter(Boolean).join(" ");
}

export interface GalleryKit {
  id: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  version: string;
  source: "official" | "community";
  verified: boolean;
  primaryColor: string;
  accentColor: string;
  frameworks: string[];
  categories: string[];
  tags: string[];
  demoUrl: string | null;
  repo: string | null;
  homepage: string | null;
  license: string;
  styling: string;
  author: { name: string; github: string | null; url: string | null; official: boolean };
  fonts: { display: string; sans: string; mono: string };
  radius: string;
  brandScale: Swatch[];
  palette: Swatch[];
  darkPalette: Swatch[];
  prompt: string;
  buildSteps: string[];
  components: string[];
  blocks: string[];
  templates: { name: string; route: string }[];
  installCmd: string | null;
  skillName: string | null;
  /** Optional brand mark shown on the card identity (else the color dot). */
  logo?: string | null;
  consumeSteps: string[];
  screenshots: { kind: string; url: string }[];
  /** Optional looping preview clip (webm). Falls back to the first screenshot. */
  video?: string | null;
}

export interface GalleryCard {
  id: string;
  name: Localized;
  tagline: Localized;
  source: "official" | "community";
  verified: boolean;
  primaryColor: string;
  accentColor: string;
  frameworks: string[];
  categories: string[];
  tags: string[];
  author: { name: string };
  thumb: string | null;
  video: string | null;
  /** Swatches shown on the card's resting face. */
  palette: Swatch[];
  /** Kit logo (the demo's favicon) for the card identity; null → color dot. */
  logo: string | null;
}

// Baked at build time — each JSON file becomes a bundled module. No runtime fetch.
const modules = import.meta.glob<GalleryKit>("../../content/kits/*.json", {
  eager: true,
  import: "default",
});

// Curated lead order — these kits are pinned to the front of the gallery, in
// this exact sequence. Everything else follows by the default rule below.
const PINNED = ["sada", "lime"];
const rankOf = (id: string) => {
  const i = PINNED.indexOf(id);
  return i === -1 ? Number.POSITIVE_INFINITY : i;
};

const GALLERY: GalleryKit[] = Object.values(modules).sort((a, b) => {
  // Pinned kits first, in PINNED order; then verified/official, then alphabetical.
  const ra = rankOf(a.id);
  const rb = rankOf(b.id);
  if (ra !== rb) return ra - rb;
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  return enOf(a.name).localeCompare(enOf(b.name));
});

function toCard(k: GalleryKit): GalleryCard {
  return {
    id: k.id,
    name: k.name,
    tagline: k.tagline,
    source: k.source,
    verified: k.verified,
    primaryColor: k.primaryColor,
    accentColor: k.accentColor,
    frameworks: k.frameworks,
    categories: k.categories,
    tags: k.tags,
    author: { name: k.author.name },
    thumb: k.screenshots[0]?.url ?? null,
    video: k.video ?? null,
    // Prefer the named brand palette; fall back to primary/accent.
    palette: (k.palette?.length ? k.palette : k.brandScale)?.slice(0, 6) ?? [
      { name: "primary", value: k.primaryColor },
      { name: "accent", value: k.accentColor },
    ],
    logo: k.logo ?? null,
  };
}

export async function getGalleryKits(): Promise<GalleryCard[]> {
  return GALLERY.map(toCard);
}

export async function getGalleryKit(id: string): Promise<GalleryKit | null> {
  return GALLERY.find((k) => k.id === id) ?? null;
}

/** Distinct categories across the gallery, for the filter row. */
export async function getCategories(): Promise<string[]> {
  return [...new Set(GALLERY.flatMap((k) => k.categories))].sort();
}
