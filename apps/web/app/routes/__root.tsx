/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { Boxes, Github } from "lucide-react";
import type * as React from "react";
import { detectLocale, dirFor, LOCALE_COOKIE, LocaleProvider, normalizeLocale, useLocale, type Locale } from "~/lib/i18n";
import appCss from "~/styles/app.css?url";

/** Resolve the locale on the server so SSR renders the right lang/dir with no
 * flash. A saved choice (cookie) always wins; on first visit we detect from the
 * browser's Accept-Language instead of forcing Arabic. */
const getInitialLocale = createServerFn({ method: "GET" }).handler((): Locale => {
  const saved = getCookie(LOCALE_COOKIE);
  if (saved) return normalizeLocale(saved);
  return detectLocale(getRequestHeader("accept-language"));
});

/** Public origin — absolute URLs for OG/Twitter/canonical so they work anywhere. */
export const ORIGIN = "https://uikit.studio";
const OG_IMAGE = `${ORIGIN}/og.png`;

/** Site-wide structured data (WebSite + Organization) for rich results + GEO. */
const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${ORIGIN}/#website`,
      url: `${ORIGIN}/`,
      name: "uikit.studio",
      description: "A curated gallery of runnable UI kits your AI coding agent can build with.",
      inLanguage: ["ar", "en"],
      publisher: { "@id": `${ORIGIN}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${ORIGIN}/#org`,
      name: "uikit.studio",
      url: `${ORIGIN}/`,
      logo: `${ORIGIN}/icon-512.png`,
      sameAs: ["https://github.com/uikit-studio"],
    },
  ],
};

export const Route = createRootRoute({
  loader: async () => ({ locale: await getInitialLocale() }),
  head: ({ loaderData }) => {
    const ar = (loaderData?.locale ?? "ar") === "ar";
    const title = ar
      ? "uikit.studio — حُزَم واجهات لوكيل البرمجة الذكي"
      : "uikit.studio — UI kits for your AI coding agent";
    const description = ar
      ? "معرض حُزَم واجهات جاهزة للتشغيل. وجه وكيل البرمجة الذكي إلى إحداها، يبني منتجك بنفس التصميم — فاتح وداكن، عربي وإنجليزي."
      : "A gallery of runnable UI kits. Point your AI coding agent at one — it builds your product in that exact design. Light & dark, EN/AR.";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#fbfaf8" },
        { name: "robots", content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" },
        { name: "application-name", content: "uikit.studio" },
        { name: "apple-mobile-web-app-title", content: "uikit.studio" },
        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "uikit.studio" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "uikit.studio — UI kits for your AI coding agent" },
        { property: "og:locale", content: ar ? "ar_AR" : "en_US" },
        { property: "og:locale:alternate", content: ar ? "en_US" : "ar_AR" },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
        },
        { rel: "stylesheet", href: appCss },
        // Icons + web app manifest
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        // Agent discovery — the llms.txt convention (index of agent-ready kit specs).
        { rel: "alternate", type: "text/markdown", href: "/llms.txt", title: "llms.txt" },
      ],
    };
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale } = Route.useLoaderData();
  return (
    <html lang={locale} dir={dirFor(locale)}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <LocaleProvider initial={locale}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </LocaleProvider>
        <script
          type="application/ld+json"
          // Site-wide WebSite + Organization graph (rich results + AI/answer engines).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 glass">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-[0_5px_16px_-5px_rgba(244,63,94,0.65)]"
            style={{ background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-3))" }}
          >
            <Boxes className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-fg">
            uikit<span className="text-accent">.</span>
            <span className="font-semibold text-muted">studio</span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-5 text-sm sm:gap-7">
          <a
            href="https://github.com/uikit-studio"
            target="_blank"
            rel="noreferrer"
            className="link-underline hidden text-muted transition-colors hover:text-fg sm:inline-flex"
          >
            {t("nav.github")}
          </a>
          <LangToggle />
          <Link
            to="/submit"
            className="rounded-full bg-fg px-4 py-2 font-medium text-bg transition-colors hover:bg-accent"
          >
            {t("nav.submit")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Arabic ⇄ English — minimal editorial text toggle. Persists + flips <html>. */
function LangToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="group" aria-label={t("nav.langLabel")} className="flex items-center gap-1.5 font-mono text-xs">
      <button
        type="button"
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        lang="en"
        className={locale === "ar" ? "text-fg" : "text-faint transition-colors hover:text-fg"}
      >
        AR
      </button>
      <span aria-hidden className="text-line-strong">
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        lang="en"
        className={locale === "en" ? "text-fg" : "text-faint transition-colors hover:text-fg"}
      >
        EN
      </button>
    </div>
  );
}

function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-28 border-t border-line">
      <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-5 px-5 py-12 sm:flex-row sm:items-center sm:px-8">
        <p className="max-w-sm font-display text-lg text-fg">{t("footer.tagline")}</p>
        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <Link to="/" className="link-underline hover:text-fg">
            {t("footer.gallery")}
          </Link>
          <Link to="/submit" className="link-underline hover:text-fg">
            {t("footer.submit")}
          </Link>
          <a
            href="https://github.com/uikit-studio"
            target="_blank"
            rel="noreferrer"
            className="link-underline hover:text-fg"
          >
            {t("footer.github")}
          </a>
        </div>
      </div>
    </footer>
  );
}
