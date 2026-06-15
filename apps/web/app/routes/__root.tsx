/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";
import { Github, Search } from "lucide-react";
import type * as React from "react";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "uikit — production UI kits, ready to run" },
      {
        name: "description",
        content:
          "A curated gallery of runnable UI kits — tokens, components, dashboards and landing pages. Clone one and let your AI build a real product with it.",
      },
      { name: "theme-color", content: "#060609" },
      { property: "og:title", content: "uikit — production UI kits, ready to run" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Sora:wght@400;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      // Agent discovery — the llms.txt convention (index of agent-ready kit specs).
      { rel: "alternate", type: "text/markdown", href: "/llms.txt", title: "llms.txt" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <header className="sticky top-0 z-50 border-b border-line/70 glass">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-5 sm:px-8">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-[13px] font-bold text-white shadow-[0_0_20px_-4px_var(--color-brand)]">
                u
              </span>
              <span className="font-display text-lg font-bold tracking-tight">uikit</span>
              <span className="hidden rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-faint sm:inline">
                studio
              </span>
            </Link>

            <Link
              to="/"
              className="group mx-auto flex h-10 w-full max-w-md items-center gap-2.5 rounded-full border border-line bg-elevated/60 px-4 text-sm text-faint transition-colors hover:border-line-strong"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 truncate text-left">Search kits — saas, marketing, dashboard…</span>
              <kbd className="hidden items-center gap-0.5 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint sm:flex">
                ⌘K
              </kbd>
            </Link>

            <nav className="flex shrink-0 items-center gap-1 text-sm">
              <a
                href="https://github.com/uikit-studio"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-muted transition-colors hover:text-fg sm:flex"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
              <Link
                to="/submit"
                className="rounded-full border border-line-strong bg-fg px-4 py-2 font-medium text-bg transition-opacity hover:opacity-90"
              >
                Submit a kit
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-24 border-t border-line/70">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-faint sm:flex-row sm:px-8">
            <p className="font-mono text-xs">uikit.studio — production UI, ready to run.</p>
            <div className="flex items-center gap-5">
              <Link to="/" className="hover:text-fg">
                Gallery
              </Link>
              <Link to="/submit" className="hover:text-fg">
                Submit
              </Link>
              <a href="https://github.com/uikit-studio" target="_blank" rel="noreferrer" className="hover:text-fg">
                GitHub
              </a>
            </div>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  );
}
