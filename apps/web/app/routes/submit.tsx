import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Github,
  GitPullRequest,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { type ReactNode, useState } from "react";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a kit — uikit.studio" },
      {
        name: "description",
        content:
          "Author a UI kit with the uikit CLI and the uikit-standard skill, validate it against the contract, and submit it to the gallery.",
      },
    ],
  }),
  component: SubmitPage,
});

const REVIEW_CHECKS = [
  "The entry JSON passes the schema (CI runs scripts/validate-content.mjs on your PR).",
  "Verified kits mirror their screenshots into the repo; community kits pin external URLs to a tag/SHA.",
  "The kit's own uikit.json is contract-valid (npx uikit-studio validate).",
  "The demo URL loads and matches the screenshots.",
  "License is real and permissive; no malware in install scripts.",
];

function SubmitPage() {
  return (
    <main className="mx-auto max-w-[1000px] px-5 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> gallery
      </Link>

      {/* Hero */}
      <header className="mt-8 border-b border-line pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">// become a kit author</p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
          Ship your kit to <span className="grad-text">the gallery.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          A kit is a runnable starter product — a full design system, real pages, and a bundled AI
          skill — not a bin of loose components. Scaffold it with the <Mono>uikit</Mono> CLI, validate
          it against the contract, and submit. Here's the whole path.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#start" className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90">
            <Rocket className="h-4 w-4" /> Start building
          </a>
          <a
            href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <GitPullRequest className="h-4 w-4" /> Browse the registry
          </a>
        </div>
      </header>

      {/* Steps */}
      <div id="start" className="mt-12 scroll-mt-24 space-y-10">
        <Step
          n={1}
          title="Scaffold a kit"
          icon={<Terminal className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">
                Two ways in. Generate a brand-new kit from a brief with the{" "}
                <Mono>uikit-standard</Mono> skill in Claude Code — or fork an existing kit and reskin
                it. Either way, <span className="text-fg">give it its own identity</span> (palette,
                fonts, radius); never copy another kit's theme.
              </p>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                option a — generate from a brief
              </p>
              <Note>
                In Claude Code, run the <Mono>uikit-standard</Mono> skill and describe your kit:
                <br />
                <span className="text-accent">
                  "a dark fintech dashboard kit — indigo, Inter, glass cards, EN/AR + RTL"
                </span>
              </Note>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                option b — start from an existing kit
              </p>
              <Cmd>npx uikit-studio new ./aurora-uikit my-kit</Cmd>
              <p className="mt-2 text-xs text-faint">
                Tip: <Mono>npm i -g uikit-studio</Mono> installs the <Mono>uikit</Mono> command
                globally, so you can drop the <Mono>npx uikit-studio</Mono> prefix.
              </p>
            </>
          }
        />

        <Step
          n={2}
          title="Make it runnable & rich"
          icon={<Rocket className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">
                It must run out of the box and be a full product, not a sampler.
              </p>
              <Cmd>cd my-kit/react && pnpm install && pnpm dev</Cmd>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {[
                  "Four real pages: Landing, Pricing, Dashboard, and a Components showcase.",
                  "A full design system — light + dark tokens, a type scale, a real component set.",
                  "EN + AR with full RTL: a language toggle, an Arabic typeface, a layout that flips.",
                  "Real loaded fonts: a display face, a body face, and a monospace for micro-labels.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </>
          }
        />

        <Step
          n={3}
          title="Validate against the contract"
          icon={<ShieldCheck className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">
                Every kit is gated by a schema. <Mono>validate</Mono> must pass before you submit;{" "}
                <Mono>info</Mono> prints the tech, templates, and AI-consume steps so you can sanity
                check what reviewers will see.
              </p>
              <Cmd>npx uikit-studio validate</Cmd>
              <Cmd>npx uikit-studio info</Cmd>
            </>
          }
        />

        <Step
          n={4}
          title="Push to a public repo"
          icon={<Github className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">
                Publish to GitHub with <Mono>uikit.json</Mono> at the repo root, your{" "}
                <Mono>screenshots/</Mono>, and the bundled consumer skill under{" "}
                <Mono>.claude/skills/&lt;id&gt;</Mono>.
              </p>
              <Cmd>{"git init && git add -A && git commit -m \"feat: my-kit\""}</Cmd>
              <Cmd>git remote add origin https://github.com/you/my-kit && git push -u origin main</Cmd>
            </>
          }
        />

        <Step
          n={5}
          title="Open a pull request"
          icon={<GitPullRequest className="h-4 w-4" />}
          last
          body={
            <>
              <p className="text-muted">
                The gallery is pure git — no backend, no database. You list a kit by adding one JSON
                file to the registry and opening a PR. CI validates it; a maintainer merges; it's live.
              </p>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                add your entry
              </p>
              <Cmd>apps/web/content/kits/&lt;your-kit&gt;.json</Cmd>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <span className="text-fg">Community</span> (default): set{" "}
                    <Mono>"verified": false</Mono> and point <Mono>screenshots</Mono>/<Mono>demoUrl</Mono>{" "}
                    at your own repo (a pinned <Mono>cdn.jsdelivr.net/gh/you/kit@v1.0.0/…</Mono> URL).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    <span className="text-fg">Verified</span> (maintainer‑promoted): screenshots are
                    mirrored into <Mono>apps/web/public/kits/&lt;id&gt;/</Mono> so they can never rot.
                  </span>
                </li>
              </ul>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                validate, then PR
              </p>
              <Cmd>node scripts/validate-content.mjs</Cmd>
              <a
                href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                <Github className="h-4 w-4" /> Open a PR on GitHub
              </a>
            </>
          }
        />
      </div>

      {/* What reviewers check */}
      <section className="mt-14 rounded-2xl border border-line bg-surface/50 p-7">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> what reviewers check
        </h2>
        <ul className="mt-5 space-y-3">
          {REVIEW_CHECKS.map((c) => (
            <li key={c} className="flex gap-3 text-sm text-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 font-mono text-xs text-faint">
          Reference shape: the <Mono>spark-uikit</Mono> repo — runnable React/Vue/Web Components, the
          four pages, full design system, EN/AR + RTL.
        </p>
      </section>
    </main>
  );
}

function Step({
  n,
  title,
  icon,
  body,
  last,
}: {
  n: number;
  title: string;
  icon: ReactNode;
  body: ReactNode;
  last?: boolean;
}) {
  return (
    <section className="relative flex gap-5">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface font-display text-sm font-bold text-fg">
          {n}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-fg">
          <span className="text-brand">{icon}</span>
          {title}
        </h3>
        <div className="mt-3">{body}</div>
      </div>
    </section>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[0.85em] text-fg">{children}</code>;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-4 text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}

function Cmd({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-2 flex w-full items-center gap-2.5 rounded-lg border border-line bg-bg px-3.5 py-2.5 text-left font-mono text-xs text-fg transition-colors hover:border-line-strong"
    >
      <span className="select-none text-brand">$</span>
      <span className="flex-1 overflow-x-auto whitespace-nowrap">{children}</span>
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-faint" />
      )}
    </button>
  );
}
