import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Check,
  Copy,
  ExternalLink,
  Github,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { getGalleryKit, type GalleryKit, type Swatch } from "~/lib/data";

export const Route = createFileRoute("/kit/$id")({
  loader: async ({ params }) => {
    const kit = await getGalleryKit(params.id);
    if (!kit) throw notFound();
    return { kit };
  },
  component: KitDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[1400px] px-5 py-32 text-center sm:px-8">
      <p className="text-muted">Kit not found.</p>
      <Link to="/" className="mt-2 inline-block font-mono text-sm text-brand hover:underline">
        ← back to gallery
      </Link>
    </div>
  ),
});

function KitDetailPage() {
  const { kit } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-[1400px] px-5 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> gallery
      </Link>

      {/* Header */}
      <header className="mt-6 flex flex-col gap-6 border-b border-line pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-xl ring-1 ring-line"
              style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor})` }}
            />
            <h1 className="font-display text-4xl font-bold tracking-tight">{kit.name}</h1>
            {kit.source === "official" ? (
              <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
                <BadgeCheck className="h-3 w-3" /> official
              </span>
            ) : (
              <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                community
              </span>
            )}
          </div>
          <p className="mt-4 text-lg leading-relaxed text-muted">{kit.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-faint">
            <span>v{kit.version}</span>
            <span>· {kit.license}</span>
            <span>· {kit.styling}</span>
            <span>· radius {kit.radius}</span>
            <span>· {kit.frameworks.join(" / ")}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {kit.demoUrl && (
            <a
              href={kit.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" /> Open demo
            </a>
          )}
          {kit.repo && (
            <a
              href={kit.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Github className="h-4 w-4" /> Repo
            </a>
          )}
        </div>
      </header>

      {/* Live preview — embedded when a demo URL is provided. Verified kits use a
          same-origin demo; community kits embed their own (cross-origin) URL,
          sandboxed so their code can never touch this page. */}
      {kit.demoUrl && (
        <section className="mt-10">
          <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>live preview</SectionLabel>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-elevated glow">
            <div className="flex items-center gap-2 border-b border-line bg-surface/80 px-4 py-2.5">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              </span>
              <span className="ml-2 truncate font-mono text-[11px] text-faint">
                {demoLabel(kit.demoUrl)}
              </span>
              <a
                href={kit.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted hover:text-fg"
              >
                open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <iframe
              src={kit.demoUrl}
              title={`${kit.name} demo`}
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
          <SectionLabel icon={<ImageIcon className="h-3.5 w-3.5" />}>screenshots</SectionLabel>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {kit.screenshots.map((s, i) => (
              <figure key={i} className="overflow-hidden rounded-xl border border-line bg-elevated">
                <img src={s.url} alt={`${kit.name} ${s.kind}`} loading="lazy" className="w-full" />
                <figcaption className="border-t border-line bg-surface/60 px-3 py-1.5 font-mono text-[11px] capitalize text-faint">
                  {s.kind}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
        {/* Main: the design system */}
        <div className="min-w-0 space-y-14">
          {/* Colors */}
          <section>
            <SectionLabel icon={<Palette className="h-3.5 w-3.5" />}>colors</SectionLabel>
            <p className="mt-2 text-sm text-muted">
              Brand scale, plus the light and dark semantic tokens the kit ships with.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-line">
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
              <SwatchGroup title="light" swatches={kit.palette} />
              <SwatchGroup title="dark" swatches={kit.darkPalette} dark />
            </div>
          </section>

          {/* Typography */}
          <section>
            <SectionLabel icon={<Type className="h-3.5 w-3.5" />}>typography</SectionLabel>
            <div className="mt-5 space-y-3">
              <FontSample role="display" family={kit.fonts.display} sample="The quick brown fox" />
              <FontSample role="sans / body" family={kit.fonts.sans} sample="The quick brown fox jumps over the lazy dog" />
              <FontSample role="mono / labels" family={kit.fonts.mono} sample="const ship = () => fast" />
            </div>
          </section>

          {/* The prompt */}
          <section>
            <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>the prompt</SectionLabel>
            <p className="mt-2 text-sm text-muted">
              The brief that generated this kit via <code className="font-mono text-xs text-fg">uikit-standard</code>.
            </p>
            <blockquote className="mt-4 rounded-xl border border-line bg-surface/60 p-5">
              <p className="font-mono text-sm leading-relaxed text-accent">{kit.prompt}</p>
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
            <SectionLabel icon={<Boxes className="h-3.5 w-3.5" />}>what's inside</SectionLabel>
            <div className="mt-5 space-y-5">
              <TokenList label="components" items={kit.components} />
              <TokenList label="blocks" items={kit.blocks} />
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">templates</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {kit.templates.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between rounded-lg border border-line bg-surface/50 px-3.5 py-2.5"
                    >
                      <span className="flex items-center gap-2 text-sm text-fg">
                        <LayoutTemplate className="h-3.5 w-3.5 text-faint" /> {t.name}
                      </span>
                      <code className="font-mono text-[11px] text-faint">{t.route}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Aside: install + consume */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {kit.installCmd && (
            <Panel title="Install">
              <CopyLine text={kit.installCmd} />
            </Panel>
          )}

          {kit.consumeSteps.length > 0 && (
            <Panel title="Use it with AI">
              {kit.skillName && (
                <p className="mb-3 font-mono text-[11px] text-faint">
                  skill: <span className="text-accent">{kit.skillName}</span>
                </p>
              )}
              <ol className="space-y-2.5">
                {kit.consumeSteps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-mono text-brand">{i + 1}</span>
                    <code className="break-all font-mono text-muted">{s}</code>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          <Panel title="Frameworks">
            <div className="flex flex-wrap gap-1.5">
              {kit.frameworks.map((f) => (
                <span key={f} className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-fg">
                  {f}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {[...kit.categories, ...kit.tags].map((t) => (
                <span key={t} className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
                  {t}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Author">
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
    <div className={`rounded-xl border border-line p-4 ${dark ? "bg-[#0a0a0e]" : "bg-surface/40"}`}>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-faint">{title}</p>
      <div className="space-y-2">
        {swatches.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-line" style={{ background: s.value }} />
            <span className="flex-1 text-sm text-fg">{s.name}</span>
            <code className="font-mono text-[11px] uppercase text-faint">{s.value}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function FontSample({ role, family, sample }: { role: string; family: string; sample: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="truncate text-2xl text-fg sm:text-3xl" style={{ fontFamily: `"${family}", sans-serif` }}>
        {sample}
      </p>
      <div className="shrink-0 text-right">
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
    <div className="rounded-2xl border border-line bg-surface/50 p-5">
      <p className="mb-3 font-display text-sm font-semibold text-fg">{title}</p>
      {children}
    </div>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2.5 text-left font-mono text-xs text-fg transition-colors hover:border-line-strong"
    >
      <span className="text-brand">$</span>
      <span className="flex-1 truncate">{text}</span>
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-faint" />}
    </button>
  );
}
