/**
 * Gallery data — pure git, no backend. Every kit is a JSON entry in
 * `apps/web/content/kits/*.json`, baked into the build via import.meta.glob.
 * Assets (screenshots + the preview clip) live in each kit's own repo and are
 * pulled into /kits/<id>/ at build time from kit.repo (scripts/fetch-kit-assets.mjs)
 * — never committed here. JSON references them as /kits/<id>/… paths. Curation =
 * PR review; CI validates the shape (scripts/validate-content.mjs). Adding a kit
 * means adding one JSON file.
 */

export interface Swatch {
  name: string;
  value: string;
}

export interface GalleryKit {
  id: string;
  name: string;
  tagline: string;
  description: string;
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
  consumeSteps: string[];
  screenshots: { kind: string; url: string }[];
  /** Optional looping preview clip (webm). Falls back to the first screenshot. */
  video?: string | null;
}

export interface GalleryCard {
  id: string;
  name: string;
  tagline: string;
  source: "official" | "community";
  verified: boolean;
  primaryColor: string;
  accentColor: string;
  frameworks: string[];
  categories: string[];
  tags: string[];
  thumb: string | null;
  video: string | null;
}

// Baked at build time — each JSON file becomes a bundled module. No runtime fetch.
const modules = import.meta.glob<GalleryKit>("../../content/kits/*.json", {
  eager: true,
  import: "default",
});

const GALLERY: GalleryKit[] = Object.values(modules).sort((a, b) => {
  // Verified/official first, then alphabetical.
  if (a.verified !== b.verified) return a.verified ? -1 : 1;
  return a.name.localeCompare(b.name);
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
    thumb: k.screenshots[0]?.url ?? null,
    video: k.video ?? null,
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
