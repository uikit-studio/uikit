import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Copy,
  Github,
  GitPullRequest,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useLocale } from "~/lib/i18n";

export const Route = createFileRoute("/submit")({
  head: () => {
    const title = "Submit a kit — uikit.studio";
    const description =
      "Author a runnable, agent-ready UI kit with the uikit CLI, validate it against the contract, and submit it to the gallery — pure git, no backend.";
    const url = "https://uikit.studio/submit";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: SubmitPage,
});

function SubmitPage() {
  const { t, tList } = useLocale();
  return (
    <main className="mx-auto max-w-[1000px] px-5 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" /> {t("kit.back")}
      </Link>

      {/* Hero */}
      <header className="mt-8 border-b border-line pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">// {t("submit.eyebrow")}</p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
          {t("submit.titleA")} <span className="grad-text">{t("submit.titleB")}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{t("submit.hero")}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#start"
            className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent"
          >
            <Rocket className="h-4 w-4" /> {t("submit.startBuilding")}
          </a>
          <a
            href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <GitPullRequest className="h-4 w-4" /> {t("submit.browseRegistry")}
          </a>
        </div>
      </header>

      {/* Steps */}
      <div id="start" className="mt-12 scroll-mt-24 space-y-10">
        <Step
          n={1}
          title={t("submit.step1.title")}
          icon={<Terminal className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">{t("submit.step1.lead")}</p>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                {t("submit.step1.optA")}
              </p>
              <Cmd>npx uikit-cli new https://github.com/uikit-studio/base-uikit my-kit</Cmd>
              <Note>{t("submit.step1.noteA")}</Note>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                {t("submit.step1.optB")}
              </p>
              <Cmd>npx uikit-cli remix ./aurora-uikit my-kit</Cmd>
              <p className="mt-2 text-xs text-faint">{t("submit.step1.noteB")}</p>
            </>
          }
        />

        <Step
          n={2}
          title={t("submit.step2.title")}
          icon={<Rocket className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">{t("submit.step2.lead")}</p>
              <Cmd>cd my-kit/react && pnpm install && pnpm dev</Cmd>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {tList("systemBar").map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          }
        />

        <Step
          n={3}
          title={t("submit.step3.title")}
          icon={<ShieldCheck className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">{t("submit.step3.lead")}</p>
              <Cmd>npx uikit-cli validate</Cmd>
              <Cmd>npx uikit-cli info</Cmd>
            </>
          }
        />

        <Step
          n={4}
          title={t("submit.step4.title")}
          icon={<Github className="h-4 w-4" />}
          body={
            <>
              <p className="text-muted">{t("submit.step4.lead")}</p>
              <Cmd>{'git init && git add -A && git commit -m "feat: my-kit"'}</Cmd>
              <Cmd>git remote add origin https://github.com/you/my-kit && git push -u origin main</Cmd>
            </>
          }
        />

        <Step
          n={5}
          title={t("submit.step5.title")}
          icon={<GitPullRequest className="h-4 w-4" />}
          last
          body={
            <>
              <p className="text-muted">{t("submit.step5.lead")}</p>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                {t("submit.step5.addEntry")}
              </p>
              <Cmd>{"apps/web/content/kits/<your-kit>.json"}</Cmd>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>
                    <span className="text-fg">{t("submit.step5.communityA")}</span> {t("submit.step5.communityB")}
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <span className="text-fg">{t("submit.step5.verifiedA")}</span> {t("submit.step5.verifiedB")}
                  </span>
                </li>
              </ul>
              <p className="mt-4 mb-2 font-mono text-[11px] uppercase tracking-wide text-faint">
                {t("submit.step5.validateThenPr")}
              </p>
              <Cmd>node scripts/validate-content.mjs</Cmd>
              <a
                href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent"
              >
                <Github className="h-4 w-4" /> {t("submit.step5.openPr")}
              </a>
            </>
          }
        />
      </div>

      {/* What reviewers check */}
      <section className="mt-14 rounded-3xl border border-line bg-surface/50 p-7">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("submit.reviewers.title")}
        </h2>
        <ul className="mt-5 space-y-3">
          {tList("reviewChecks").map((c) => (
            <li key={c} className="flex gap-3 text-sm text-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 font-mono text-xs text-faint">{t("submit.reviewers.footer")}</p>
      </section>

      {/* Agent-ready */}
      <section className="mt-8 rounded-2xl border border-brand/30 bg-surface p-7 glow">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
          <Bot className="h-3.5 w-3.5" /> {t("submit.agent.title")}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">{t("submit.agent.body1")}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{t("submit.agent.body2")}</p>
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
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-line bg-surface font-display text-sm font-bold text-fg">
          {n}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-fg">
          <span className="text-accent">{icon}</span>
          {title}
        </h3>
        <div className="mt-3">{body}</div>
      </div>
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4 text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}

function Cmd({ children }: { children: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-start font-mono text-xs text-fg transition-colors hover:border-line-strong"
      dir="ltr"
    >
      <span className="select-none text-accent">$</span>
      <span className="flex-1 overflow-x-auto whitespace-nowrap">{children}</span>
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-faint" />
      )}
      <span className="sr-only">{copied ? t("copy.copied") : t("copy.copy")}</span>
    </button>
  );
}
