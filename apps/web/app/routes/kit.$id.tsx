import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  Boxes,
  Check,
  Copy,
  ExternalLink,
  FileJson,
  FileText,
  Github,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { enOf, getGalleryKit, L, type GalleryKit, type Swatch } from "~/lib/data";
import { useLocale } from "~/lib/i18n";

/** Public origin — agent prompts must use absolute URLs so they work pasted anywhere. */
const ORIGIN = "https://uikit.studio";

export const Route = createFileRoute("/kit/$id")({
  loader: async ({ params }) => {
    const kit = await getGalleryKit(params.id);
    if (!kit) throw notFound();
    return { kit };
  },
  // Per-kit SEO + let agents auto-discover the machine-readable design spec.
  head: ({ params, loaderData }) => {
    const kit = loaderData?.kit;
    const url = `${ORIGIN}/kit/${params.id}`;
    // Head/meta runs without locale context — use canonical EN for stable SEO.
    const title = kit ? `${enOf(kit.name)} — ${enOf(kit.tagline)} · uikit.studio` : "uikit.studio";
    const description = enOf(kit?.description) || enOf(kit?.tagline);
    const shot = kit?.screenshots?.[0]?.url;
    const image = shot ? (/^https?:\/\//.test(shot) ? shot : `${ORIGIN}${shot}`) : `${ORIGIN}/og.png`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", type: "text/markdown", href: `/kit/${params.id}/llms.txt`, title: "Agent design spec (llms.txt)" },
        { rel: "alternate", type: "application/json", href: `/kit/${params.id}/manifest.json`, title: "Agent manifest (JSON)" },
      ],
    };
  },
  component: KitDetailPage,
  notFoundComponent: KitNotFound,
});

function KitNotFound() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-32 text-center sm:px-8">
      <p className="text-muted">{t("kit.notFound")}</p>
      <Link to="/" className="mt-2 inline-block font-mono text-sm text-accent hover:underline">
        {t("kit.backToGallery")}
      </Link>
    </div>
  );
}

function KitDetailPage() {
  const { kit } = Route.useLoaderData();
  const { t, locale } = useLocale();

  const url = `${ORIGIN}/kit/${kit.id}`;
  const shot = kit.screenshots?.[0]?.url;
  const image = shot ? (/^https?:\/\//.test(shot) ? shot : `${ORIGIN}${shot}`) : `${ORIGIN}/og.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#app`,
        name: enOf(kit.name),
        description: enOf(kit.description),
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url,
        image,
        softwareVersion: kit.version,
        license: kit.license,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: {
          "@type": kit.author.official ? "Organization" : "Person",
          name: kit.author.name,
          ...(kit.author.github ? { url: `https://github.com/${kit.author.github}` } : {}),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Gallery", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: enOf(kit.name), item: url },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-[1400px] px-5 pt-8 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" /> {t("kit.back")}
      </Link>

      {/* Header */}
      <header className="mt-6 flex flex-col gap-6 border-b border-line pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-8 w-8 rounded-2xl ring-1 ring-line"
              style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})` }}
            />
            <h1 className="font-display text-4xl font-bold tracking-tight">{L(kit.name, locale)}</h1>
            {kit.source === "official" ? (
              <span className="flex items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent-ink">
                <BadgeCheck className="h-3 w-3" /> {t("kit.official")}
              </span>
            ) : (
              <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                {t("kit.community")}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full border border-line bg-accent/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent-ink">
              <Bot className="h-3 w-3" /> {t("kit.agentReady")}
            </span>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-muted">{L(kit.description, locale)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-faint">
            <span>v{kit.version}</span>
            <span>· {kit.license}</span>
            <span>· {kit.styling}</span>
            <span>· {t("kit.metaRadius", { r: kit.radius })}</span>
            <span>· {kit.frameworks.join(" / ")}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {kit.demoUrl && (
            <a
              href={kit.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> {t("kit.openDemo")}
            </a>
          )}
          {kit.repo && (
            <a
              href={kit.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Github className="h-4 w-4" /> {t("kit.repo")}
            </a>
          )}
        </div>
      </header>

      <AgentReady kit={kit} />

      {/* Live preview — embedded when a demo URL is provided. */}
      {kit.demoUrl && (
        <section className="mt-10">
          <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>{t("sec.livePreview")}</SectionLabel>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-elevated glow">
            <div className="flex items-center gap-2 border-b border-line bg-surface/80 px-4 py-2.5" dir="ltr">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              </span>
              <span className="ml-2 truncate font-mono text-[11px] text-faint">{demoLabel(kit.demoUrl)}</span>
              <a
                href={kit.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted hover:text-fg"
              >
                {t("preview.open")} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <iframe
              src={kit.demoUrl}
              title={`${L(kit.name, locale)} demo`}
              className="h-[560px] w-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* Screenshots gallery */}
      {kit.screenshots.length > 0 && (
        <section className="mt-10">
          <SectionLabel icon={<ImageIcon className="h-3.5 w-3.5" />}>{t("sec.screenshots")}</SectionLabel>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {kit.screenshots.map((s, i) => (
              <figure key={i} className="overflow-hidden rounded-2xl border border-line bg-elevated">
                <img src={s.url} alt={`${L(kit.name, locale)} ${s.kind}`} loading="lazy" className="w-full" />
                <figcaption className="border-t border-line bg-surface/60 px-3 py-1.5 font-mono text-[11px] capitalize text-faint">
                  {s.kind}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main: the design system */}
        <div className="min-w-0 space-y-14">
          {/* Colors */}
          <section>
            <SectionLabel icon={<Palette className="h-3.5 w-3.5" />}>{t("sec.colors")}</SectionLabel>
            <p className="mt-2 text-sm text-muted">{t("colors.desc")}</p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-line">
              <div className="flex">
                {kit.brandScale.map((s) => (
                  <div key={s.name} className="group relative flex-1" title={s.value}>
                    <div className="h-16" style={{ background: s.value }} />
                    <div className="bg-surface px-1 py-1.5 text-center">
                      <span className="font-mono text-[10px] text-faint">{s.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <SwatchGroup title={t("colors.light")} swatches={kit.palette} />
              <SwatchGroup title={t("colors.dark")} swatches={kit.darkPalette} dark />
            </div>
          </section>

          {/* Typography */}
          <section>
            <SectionLabel icon={<Type className="h-3.5 w-3.5" />}>{t("sec.typography")}</SectionLabel>
            <div className="mt-5 space-y-3">
              <FontSample role={t("type.display")} family={kit.fonts.display} sample="The quick brown fox" />
              <FontSample
                role={t("type.body")}
                family={kit.fonts.sans}
                sample="The quick brown fox jumps over the lazy dog"
              />
              <FontSample role={t("type.mono")} family={kit.fonts.mono} sample="const ship = () => fast" />
            </div>
          </section>

          {/* The prompt */}
          <section>
            <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>{t("sec.prompt")}</SectionLabel>
            <p className="mt-2 text-sm text-muted">
              {t("prompt.descA")} <code className="font-mono text-xs text-fg">uikit-standard</code>.
            </p>
            <blockquote className="mt-4 rounded-2xl border border-line bg-surface/60 p-5">
              <p className="font-mono text-sm leading-relaxed text-accent" dir="ltr">
                {kit.prompt}
              </p>
            </blockquote>
            <ol className="mt-5 space-y-2.5">
              {kit.buildSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line font-mono text-[10px] text-faint">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Surface: components / blocks / templates */}
          <section>
            <SectionLabel icon={<Boxes className="h-3.5 w-3.5" />}>{t("sec.inside")}</SectionLabel>
            <div className="mt-5 space-y-5">
              <TokenList label={t("inside.components")} items={kit.components} />
              <TokenList label={t("inside.blocks")} items={kit.blocks} />
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">{t("inside.templates")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {kit.templates.map((tpl) => (
                    <div
                      key={tpl.name}
                      className="flex items-center justify-between rounded-xl border border-line bg-surface/50 px-3.5 py-2.5"
                    >
                      <span className="flex items-center gap-2 text-sm text-fg">
                        <LayoutTemplate className="h-3.5 w-3.5 text-faint" /> {tpl.name}
                      </span>
                      <code className="font-mono text-[11px] text-faint">{tpl.route}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Aside: install + consume */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          {kit.installCmd && (
            <Panel title={t("aside.install")}>
              <CopyLine text={kit.installCmd} />
            </Panel>
          )}

          {kit.consumeSteps.length > 0 && (
            <Panel title={t("aside.useAI")}>
              {kit.skillName && (
                <p className="mb-3 font-mono text-[11px] text-faint">
                  {t("aside.skill")} <span className="text-accent">{kit.skillName}</span>
                </p>
              )}
              <ol className="space-y-2.5">
                {kit.consumeSteps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-mono text-accent">{i + 1}</span>
                    <code className="break-all font-mono text-muted" dir="ltr">
                      {s}
                    </code>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          <Panel title={t("aside.frameworks")}>
            <div className="flex flex-wrap gap-1.5">
              {kit.frameworks.map((f) => (
                <span key={f} className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-fg">
                  {f}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title={t("aside.tags")}>
            <div className="flex flex-wrap gap-1.5">
              {[...kit.categories, ...kit.tags].map((tag) => (
                <span key={tag} className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title={t("aside.author")}>
            <p className="text-sm text-fg">{kit.author.name}</p>
            {kit.author.github && (
              <a
                href={`https://github.com/${kit.author.github}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-fg"
              >
                <Github className="h-3 w-3" /> @{kit.author.github}
              </a>
            )}
          </Panel>
        </aside>
      </div>
    </main>
  );
}

/** A friendly address-bar label: same-origin demos show under uikit.studio,
 * external (community) demos show their own host. */
function demoLabel(url: string): string {
  if (url.startsWith("/")) return `uikit.studio${url}`;
  return url.replace(/^https?:\/\//, "");
}

/** The headline feature: a copy-paste prompt + links to the machine-readable
 * design spec. The prompt itself stays in English — it's an artifact agents read. */
function AgentReady({ kit }: { kit: GalleryKit }) {
  const { t } = useLocale();
  const url = `${ORIGIN}/kit/${kit.id}`;
  const prompt =
    `Build me a website styled exactly like this design: ${url} — it's agent-ready. ` +
    `Read the spec at ${url}/llms.txt and match its color tokens (light + dark), fonts, ` +
    `radius and components. Keep full dark mode and a responsive layout.`;
  return (
    <section className="mt-10">
      <SectionLabel icon={<Bot className="h-3.5 w-3.5" />}>{t("kit.agentReady")}</SectionLabel>
      <div className="mt-4 overflow-hidden rounded-2xl border border-brand/30 bg-surface glow">
        <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold tracking-tight text-fg">{t("agentcard.title")}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t("agentcard.body")}</p>
            <div className="mt-4">
              <CopyBlock text={prompt} />
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">{t("agentcard.spec")}</p>
            <a
              href={`/kit/${kit.id}/llms.txt`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-bg/60 px-3.5 py-3 text-sm text-fg transition-colors hover:border-line-strong"
            >
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block font-medium">llms.txt</span>
                <span className="block truncate font-mono text-[11px] text-faint">{t("agentcard.llmsDesc")}</span>
              </span>
              <ExternalLink className="ms-auto h-3.5 w-3.5 shrink-0 text-faint" />
            </a>
            <a
              href={`/kit/${kit.id}/manifest.json`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-bg/60 px-3.5 py-3 text-sm text-fg transition-colors hover:border-line-strong"
            >
              <FileJson className="h-4 w-4 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block font-medium">manifest.json</span>
                <span className="block truncate font-mono text-[11px] text-faint">{t("agentcard.manifestDesc")}</span>
              </span>
              <ExternalLink className="ms-auto h-3.5 w-3.5 shrink-0 text-faint" />
            </a>
            <p className="pt-1 font-mono text-[10px] leading-relaxed text-faint">
              {t("agentcard.discoverable")}{" "}
              <a href="/llms.txt" target="_blank" rel="noreferrer" className="text-muted underline hover:text-fg">
                /llms.txt
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
      {icon}
      {children}
    </h2>
  );
}

function SwatchGroup({ title, swatches, dark }: { title: string; swatches: Swatch[]; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border border-line p-4 ${dark ? "bg-[#0a0a0e]" : "bg-surface/40"}`}>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-faint">{title}</p>
      <div className="space-y-2">
        {swatches.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-line" style={{ background: s.value }} />
            <span className="flex-1 text-sm text-fg">{s.name}</span>
            <code className="font-mono text-[11px] uppercase text-faint" dir="ltr">
              {s.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function FontSample({ role, family, sample }: { role: string; family: string; sample: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="truncate text-2xl text-fg sm:text-3xl" style={{ fontFamily: `"${family}", sans-serif` }} dir="ltr">
        {sample}
      </p>
      <div className="shrink-0 text-end">
        <p className="font-display text-sm text-fg">{family}</p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-faint">{role}</p>
      </div>
    </div>
  );
}

function TokenList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className="rounded-lg border border-line bg-surface/50 px-2.5 py-1 text-sm text-fg">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/50 p-5">
      <p className="mb-3 font-display text-sm font-semibold text-fg">{title}</p>
      {children}
    </div>
  );
}

function CopyLine({ text }: { text: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex w-full items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5 text-start font-mono text-xs text-fg transition-colors hover:border-line-strong"
      dir="ltr"
    >
      <span className="text-accent">$</span>
      <span className="flex-1 truncate">{text}</span>
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-faint" />}
      <span className="sr-only">{copied ? t("copy.copied") : t("copy.copy")}</span>
    </button>
  );
}

/** Multi-line copyable block — for the agent prompt (too long for CopyLine). */
function CopyBlock({ text }: { text: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-2xl border border-line bg-bg/70" dir="ltr">
      <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words p-4 pe-12 font-mono text-xs leading-relaxed text-fg">
        {text}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label={t("copy.copy")}
        className="absolute end-2 top-2 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t("copy.copied") : t("copy.copy")}
      </button>
    </div>
  );
}
