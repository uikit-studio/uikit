import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
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
      "Build a kit, validate it, open a PR. Pure git, no backend — here's the path.";
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
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-[760px] px-5 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" /> {t("kit.back")}
      </Link>

      {/* Hero */}
      <header className="mt-8 border-b border-line pb-10">
        <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
          {t("submit.titleA")} <span className="grad-text">{t("submit.titleB")}</span>
        </h1>
        <p className="mt-5 text-lg text-muted">{t("submit.hero")}</p>
        <a
          href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <GitPullRequest className="h-4 w-4" /> {t("submit.browseRegistry")}
        </a>
      </header>

      {/* Steps — title + command, nothing else */}
      <div className="mt-10 space-y-8">
        <Step n={1} icon={<Terminal className="h-4 w-4" />} title={t("submit.step1.title")}>
          <Cmd>npx uikit-cli new https://github.com/uikit-studio/base-uikit my-kit</Cmd>
        </Step>

        <Step n={2} icon={<Rocket className="h-4 w-4" />} title={t("submit.step2.title")}>
          <Cmd>cd my-kit/react && pnpm install && pnpm dev</Cmd>
        </Step>

        <Step n={3} icon={<ShieldCheck className="h-4 w-4" />} title={t("submit.step3.title")}>
          <Cmd>npx uikit-cli validate</Cmd>
        </Step>

        <Step n={4} icon={<Github className="h-4 w-4" />} title={t("submit.step4.title")}>
          <Cmd>git push -u origin main</Cmd>
        </Step>

        <Step n={5} icon={<GitPullRequest className="h-4 w-4" />} title={t("submit.step5.title")} last>
          <Cmd>{"apps/web/content/kits/<your-kit>.json"}</Cmd>
          <a
            href="https://github.com/uikit-studio/uikit/tree/main/apps/web/content/kits"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent"
          >
            <Github className="h-4 w-4" /> {t("submit.step5.openPr")}
          </a>
        </Step>
      </div>
    </main>
  );
}

function Step({
  n,
  title,
  icon,
  children,
  last,
}: {
  n: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section className="relative flex gap-5">
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
        <div className="mt-3">{children}</div>
      </div>
    </section>
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
