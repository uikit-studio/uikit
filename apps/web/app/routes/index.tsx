import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgeCheck, Github, Layers, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { getCategories, getGalleryKits, type GalleryCard } from "~/lib/data";

export const Route = createFileRoute("/")({
  loader: async () => ({
    cards: await getGalleryKits(),
    categories: await getCategories(),
  }),
  component: GalleryHome,
});

function GalleryHome() {
  const { cards, categories } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((k) => {
      const inCat = active === "all" || k.categories.includes(active);
      if (!inCat) return false;
      if (!q) return true;
      const hay = [k.name, k.tagline, ...k.tags, ...k.categories, ...k.frameworks].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [cards, query, active]);

  return (
    <main className="mx-auto max-w-[1400px] px-5 sm:px-8">
      {/* Hero */}
      <section className="pt-20 pb-10 sm:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
          // curated UI kits for the AI era
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
          Production UI,
          <br />
          <span className="grad-text">ready to run.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Clone a kit — tokens, components, a dashboard and a landing page — then let your AI build a
          real product with it. Consistent, fast, few tokens spent.
        </p>

        {/* Big search */}
        <div className="mt-8 max-w-2xl">
          <label className="group flex h-14 items-center gap-3 rounded-2xl border border-line bg-surface/70 px-5 glass focus-within:border-brand/60 focus-within:glow">
            <Search className="h-5 w-5 text-faint group-focus-within:text-brand" />
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search kits — saas, marketing, dashboard, orange…"
              className="h-full flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint"
            />
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
              esc
            </kbd>
          </label>
        </div>

        {/* Stats strip */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs text-faint">
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-brand" /> {cards.length} kits
          </span>
          <span className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 text-success" /> verified + community
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-2" /> react · vue · web components
          </span>
        </div>
      </section>

      {/* Filter row */}
      <section className="sticky top-16 z-30 -mx-5 mb-8 border-y border-line/70 bg-bg/80 px-5 py-3 glass sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            <Chip label="All" active={active === "all"} onClick={() => setActive("all")} />
            {categories.map((c) => (
              <Chip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
            ))}
          </div>
          <span className="hidden shrink-0 font-mono text-xs text-faint sm:block">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      {/* Grid */}
      <section>
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line py-24 text-center">
            <p className="text-muted">No kits match “{query}”.</p>
            <button
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
              className="mt-3 font-mono text-xs text-brand hover:underline"
            >
              clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((kit) => (
              <KitCard key={kit.id} kit={kit} />
            ))}
          </div>
        )}
      </section>

      {/* Submit CTA */}
      <section id="submit" className="mt-20 scroll-mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface/60 p-8 glass sm:p-12">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built a kit? <span className="grad-text">Ship it here.</span>
            </h2>
            <p className="mt-3 text-muted">
              Add one <code className="font-mono text-sm text-fg">.json</code> file and open a PR.
              CI validates it against the schema, a maintainer merges, and it's live — pure git, no
              accounts, no forms.
            </p>
            <Link
              to="/submit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 font-medium text-bg transition-opacity hover:opacity-90"
            >
              <Github className="h-4 w-4" /> Submit a kit
            </Link>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-brand), transparent 70%)" }}
          />
        </div>
      </section>
    </main>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors ${
        active
          ? "border-transparent bg-fg text-bg"
          : "border-line text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
}

function KitCard({ kit }: { kit: GalleryCard }) {
  return (
    <Link
      to="/kit/$id"
      params={{ id: kit.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/50 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-elevated">
        {kit.thumb ? (
          <img
            src={kit.thumb}
            alt={`${kit.name} preview`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor}22)` }}
          />
        )}
        {/* sheen + overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/60 via-transparent to-transparent opacity-60" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {kit.source === "official" ? (
            <span className="flex items-center gap-1 rounded-full bg-brand/90 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
              <BadgeCheck className="h-3 w-3" /> official
            </span>
          ) : (
            <span className="rounded-full bg-bg/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted backdrop-blur">
              community
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 flex translate-y-1 items-center gap-1 rounded-full bg-bg/70 px-2.5 py-1 font-mono text-[10px] text-fg opacity-0 backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
          view kit <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})` }}
          />
          <h3 className="font-display text-lg font-semibold tracking-tight">{kit.name}</h3>
          <span className="ml-auto font-mono text-[11px] text-faint">{kit.frameworks.join(" · ")}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{kit.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {kit.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md border border-line px-2 py-0.5 font-mono text-[10px] text-faint">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
