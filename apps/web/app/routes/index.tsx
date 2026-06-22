import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgeCheck, Bot, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getCategories, getGalleryKits, L, searchOf, type GalleryCard } from "~/lib/data";
import { useLocale } from "~/lib/i18n";
import { useReveal } from "~/lib/useReveal";

export const Route = createFileRoute("/")({
  loader: async () => ({
    cards: await getGalleryKits(),
    categories: await getCategories(),
  }),
  head: () => ({
    links: [{ rel: "canonical", href: "https://uikit.studio/" }],
    meta: [{ property: "og:url", content: "https://uikit.studio/" }],
  }),
  component: GalleryHome,
});

function GalleryHome() {
  const { cards, categories } = Route.useLoaderData();
  const { t, tCat, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((k) => {
      const inCat = active === "all" || k.categories.includes(active);
      if (!inCat) return false;
      if (!q) return true;
      const hay = [searchOf(k.name), searchOf(k.tagline), ...k.tags, ...k.categories, ...k.frameworks]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [cards, query, active]);

  return (
    <main className="mx-auto max-w-[1320px] px-5 sm:px-8">
      {/* Heading */}
      <section className="pt-14 pb-8 text-center sm:pt-20">
        <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          <Bot className="h-4 w-4" /> {t("home.eyebrow")}
        </p>
        <h1
          className={`mx-auto mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl ${
            locale === "ar" ? "leading-[1.25]" : "leading-[1.05]"
          }`}
        >
          {t("home.titleA")} <span className="grad-text">{t("home.titleB")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t("home.subtitle")}</p>

        {/* Search */}
        <div className="mx-auto mt-7 max-w-2xl">
          <label className="flex h-14 items-center gap-2 rounded-full border border-line bg-surface ps-5 pe-2 transition-colors focus-within:border-line-strong focus-within:bg-elevated card">
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="h-full flex-1 bg-transparent text-base text-fg outline-none placeholder:text-faint"
            />
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-3 text-white">
              <Search className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </label>
        </div>
      </section>

      {/* Filter row */}
      <section className="sticky top-16 z-30 -mx-5 mb-7 border-y border-line px-5 py-3 glass sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            <Chip label={t("filter.all")} active={active === "all"} onClick={() => setActive("all")} />
            {categories.map((c) => (
              <Chip key={c} label={tCat(c)} active={active === c} onClick={() => setActive(c)} />
            ))}
          </div>
          <span className="hidden shrink-0 font-mono text-xs text-faint sm:block">
            {t(filtered.length === 1 ? "filter.result" : "filter.results", { n: filtered.length })}
          </span>
        </div>
      </section>

      {/* Card grid */}
      <section>
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-4xl border border-dashed border-line py-28 text-center">
            <p className="text-muted">{t("empty.none", { q: query })}</p>
            <button
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
              className="link-underline mt-3 font-mono text-xs uppercase tracking-wide accent"
            >
              {t("empty.clear")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((kit, i) => (
              <KitCard key={kit.id} kit={kit} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Agent-ready band */}
      <AgentBand />

      {/* Submit CTA */}
      <section className="mt-16">
        <div
          ref={useReveal<HTMLDivElement>()}
          className="reveal flex flex-col items-center gap-5 rounded-4xl border border-line bg-surface px-6 py-14 text-center"
        >
          <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("submitcta.titleA")} <span className="grad-text">{t("submitcta.titleB")}</span>
          </h2>
          <p className="max-w-md text-muted">{t("submitcta.body")}</p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 font-medium text-bg transition-colors hover:bg-accent"
          >
            {t("submitcta.button")} <ArrowUpRight className="h-4 w-4 rtl-flip" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
        active ? "border-transparent bg-fg text-bg" : "border-line text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      {label}
    </button>
  );
}

function KitCard({ kit, index }: { kit: GalleryCard; index: number }) {
  const { t, locale } = useLocale();
  const name = L(kit.name, locale);
  const tagline = L(kit.tagline, locale);
  const ref = useReveal<HTMLAnchorElement>();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Show the poster until first hover; then play the preview on hover and pause
  // in place on leave, so the next hover resumes from the same frame.
  const playPreview = () => videoRef.current?.play().catch(() => {});
  const stopPreview = () => videoRef.current?.pause();

  return (
    <Link
      ref={ref}
      to="/kit/$id"
      params={{ id: kit.id }}
      style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
      className="reveal group block"
      onMouseEnter={kit.video ? playPreview : undefined}
      onMouseLeave={kit.video ? stopPreview : undefined}
    >
      {/* Card: palette strip on top + preview below */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface card transition-shadow duration-300 group-hover:card-hover">
        {/* Palette strip — the kit's colors, at the top of the card */}
        <div className="flex h-3 w-full">
          {kit.palette.map((s, i) => (
            <span key={i} className="h-full flex-1" style={{ background: s.value }} title={s.name} />
          ))}
        </div>

        {/* Preview (screenshot / hover video) */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {kit.video ? (
            <video
              ref={videoRef}
              src={kit.video}
              poster={kit.thumb ?? undefined}
              loop
              muted
              playsInline
              preload="metadata"
              aria-label={`${name} preview`}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : kit.thumb ? (
            <img
              src={kit.thumb}
              alt={`${name} preview`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})` }}
            />
          )}
          {/* Hover reveal — tagline + theme details + author surface over the preview */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-fg/90 via-fg/45 to-transparent p-4 pt-14 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {tagline && (
              <p className="line-clamp-2 translate-y-2 text-sm font-semibold leading-snug text-bg transition-transform duration-300 group-hover:translate-y-0">
                {tagline}
              </p>
            )}
            {/* theme details */}
            <div className="flex translate-y-2 flex-wrap gap-1.5 transition-transform delay-[40ms] duration-300 group-hover:translate-y-0">
              {[kit.font, `${t("card.radius")} ${kit.radius}`, ...kit.tags.slice(0, 2)].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-bg/25 bg-bg/10 px-2 py-0.5 font-mono text-[10px] text-bg backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
            <p className="flex translate-y-2 items-center gap-1.5 font-mono text-[11px] text-bg/80 transition-transform delay-[80ms] duration-300 group-hover:translate-y-0">
              {t("card.by")} {kit.author.name}
              <span className="ms-auto inline-flex items-center gap-1 font-sans font-semibold text-bg">
                {t("card.view")} <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" />
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer: logo + meta */}
      <div className="mt-3.5 flex items-center gap-3 px-1">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-line"
          style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})` }}
        >
          {kit.logo && (
            <img
              src={kit.logo}
              alt=""
              loading="lazy"
              onError={(e) => e.currentTarget.remove()}
              className="h-full w-full object-cover"
            />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold tracking-tight">{name}</h3>
          <p className="truncate font-mono text-[11px] text-faint">{t("card.by")} {kit.author.name}</p>
        </div>
        {kit.source === "official" ? (
          <span className="ms-auto flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent-ink">
            <BadgeCheck className="h-3.5 w-3.5" /> {t("card.official")}
          </span>
        ) : (
          <span className="ms-auto shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
            {t("card.community")}
          </span>
        )}
      </div>
    </Link>
  );
}

/** Light feature band — the headline capability. */
function AgentBand() {
  const { t } = useLocale();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="mt-16">
      <div ref={ref} className="reveal overflow-hidden rounded-4xl border border-line bg-surface p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
              <Bot className="h-4 w-4" /> {t("agent.eyebrow")}
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {t("agent.titleA")} <span className="grad-text">{t("agent.titleB")}</span>
            </h2>
            <p className="mt-4 max-w-lg text-muted">{t("agent.body")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { t: t("agent.step1.t"), d: t("agent.step1.d") },
                { t: t("agent.step2.t"), d: t("agent.step2.d") },
                { t: t("agent.step3.t"), d: t("agent.step3.d") },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-line bg-elevated p-3.5">
                  <span className="font-mono text-xs accent">0{i + 1}</span>
                  <p className="mt-1.5 text-sm font-semibold text-fg">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-faint">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal demo — kept literal (depicts a developer's agent session). */}
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated card" dir="ltr">
            <div className="border-b border-line bg-surface px-4 py-2.5 font-mono text-[11px] text-faint">
              your agent — session
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-fg">
              <span className="accent">❯</span> build me a website styled exactly like this design:{"\n"}
              <span className="text-accent-ink">https://uikit.studio/kit/spark</span>
              {"\n\n"}
              <span className="text-muted">reading /kit/spark/llms.txt …</span>
              {"\n"}
              <span className="text-muted">→ tokens, fonts, radius, 8 components loaded</span>
              {"\n"}
              <span className="text-muted">→ scaffolding landing + dashboard in your stack ✓</span>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
