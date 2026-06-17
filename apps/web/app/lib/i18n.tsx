/**
 * i18n + RTL core for the gallery's own chrome. No dependency, two locales.
 *
 * Arabic is the default (the site is Arabic-first); English is opt-in via the
 * header toggle. The choice is persisted to a cookie (`uikit_locale`, read on the
 * server so SSR renders the right `lang`/`dir` with no flash) plus localStorage.
 *
 * Only the gallery's UI strings live here. Kit-authored content (name, tagline,
 * description in content/kits/*.json) may itself be bilingual — those fields
 * accept a `{ en, ar }` object (see `Localized` in lib/data.ts) and are resolved
 * to the active locale at render; a plain string means the same in both. Code
 * artifacts (shell commands, the copy-paste agent prompt, font samples that
 * demonstrate a Latin typeface) stay literal in both locales, in the components.
 *
 * Arabic copy is written to read naturally (confident, concise product voice) —
 * "حزمة" for a UI kit, no literal calques.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "uikit_locale";

export const dirFor = (l: Locale): "rtl" | "ltr" => (l === "ar" ? "rtl" : "ltr");

/** Normalize any string to a supported locale (server cookie / client storage). */
export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "ar";
}

// ── Message catalog ──────────────────────────────────────────────────────────
// `en` is the source of truth for the key set; `ar` must mirror it (typed below).
const en = {
  // root / chrome
  "meta.title": "uikit — production UI kits, ready to run",
  "meta.description":
    "A curated gallery of runnable UI kits — tokens, components, dashboards and landing pages. Clone one and let your AI build a real product with it.",
  "nav.studio": "studio",
  "nav.searchPlaceholder": "Search kits — saas, marketing, dashboard…",
  "nav.github": "GitHub",
  "nav.submit": "Submit a kit",
  "nav.langLabel": "Change language",
  "footer.tagline": "uikit.studio — production UI, ready to run.",
  "footer.gallery": "Gallery",
  "footer.submit": "Submit",
  "footer.github": "GitHub",

  // home / hero
  "home.eyebrow": "curated, agent-ready UI kits",
  "home.titleA": "Ready-made UI kits,",
  "home.titleB": "built by AI.",
  "home.subtitle":
    "Browse production-grade kits — complete design systems with real pages, light & dark, EN + AR. Point your AI agent at one and it builds your product in that exact design — no generic guesswork, far fewer tokens.",
  "home.searchPlaceholder": "Search kits — saas, marketing, dashboard, orange…",
  "home.statKits": "{n} kits",
  "home.statSources": "verified + community",
  "home.statFrameworks": "react · vue · web components",
  "home.kitsHeading": "The kits",
  "home.kitsLede": "Each one a full, runnable design system — clone it, then build.",
  "home.featured": "Featured",
  "home.indexLabel": "Index",

  // home / agent-ready band
  "agent.eyebrow": "agent-ready",
  "agent.titleA": "Paste a kit's URL into your AI agent. Get the",
  "agent.titleB": "exact design.",
  "agent.body":
    "Every kit publishes a machine-readable design spec — tokens, fonts, radius, components. Claude Code, Cursor and Codex read it straight from the URL and build in your stack.",
  "agent.step1.t": "Paste the URL",
  "agent.step1.d": "“build me a site with this design: uikit.studio/kit/…”",
  "agent.step2.t": "Agent reads the spec",
  "agent.step2.d": "llms.txt + manifest.json, auto-discovered",
  "agent.step3.t": "Builds in your stack",
  "agent.step3.d": "exact tokens, dark mode, responsive",
  "agent.termYou": "your agent",

  // home / filters + grid + empty
  "filter.all": "All",
  "filter.results": "{n} results",
  "filter.result": "{n} result",
  "empty.none": "No kits match “{q}”.",
  "empty.clear": "clear filters",
  "card.official": "official",
  "card.community": "community",
  "card.view": "View kit",
  "card.by": "by",

  // home / submit CTA
  "submitcta.titleA": "Built a kit?",
  "submitcta.titleB": "Ship it here.",
  "submitcta.body":
    "Add one .json file and open a PR. CI validates it against the schema, a maintainer merges, and it's live — pure git, no accounts, no forms.",
  "submitcta.button": "Submit a kit",

  // kit detail
  "kit.back": "gallery",
  "kit.official": "official",
  "kit.community": "community",
  "kit.agentReady": "agent-ready",
  "kit.metaRadius": "radius {r}",
  "kit.openDemo": "Open demo",
  "kit.repo": "Repo",
  "kit.notFound": "Kit not found.",
  "kit.backToGallery": "← back to gallery",
  "agentcard.title": "Build this with your AI agent",
  "agentcard.body":
    "Paste this into Claude Code, Cursor or Codex. The agent reads the machine-readable design spec at this URL and reproduces the exact tokens, fonts, radius and components — in your stack.",
  "agentcard.spec": "the spec",
  "agentcard.llmsDesc": "design brief for agents",
  "agentcard.manifestDesc": "tokens · fonts · components",
  "agentcard.discoverable": "Discoverable site-wide at",
  "sec.livePreview": "live preview",
  "preview.open": "open",
  "sec.screenshots": "screenshots",
  "sec.colors": "colors",
  "colors.desc": "Brand scale, plus the light and dark semantic tokens the kit ships with.",
  "colors.light": "light",
  "colors.dark": "dark",
  "sec.typography": "typography",
  "type.display": "display",
  "type.body": "sans / body",
  "type.mono": "mono / labels",
  "sec.prompt": "the prompt",
  "prompt.descA": "The brief that generated this kit via",
  "sec.inside": "what's inside",
  "inside.components": "components",
  "inside.blocks": "blocks",
  "inside.templates": "templates",
  "aside.install": "Install",
  "aside.useAI": "Use it with AI",
  "aside.skill": "skill:",
  "aside.frameworks": "Frameworks",
  "aside.tags": "Tags",
  "aside.author": "Author",
  "copy.copy": "copy",
  "copy.copied": "copied",

  // submit
  "submit.eyebrow": "become a kit author",
  "submit.titleA": "Ship your kit to",
  "submit.titleB": "the gallery.",
  "submit.hero":
    "A kit is a runnable starter product — a full design system, real pages, and a bundled AI skill — not a bin of loose components. Scaffold it with the uikit CLI, validate it against the contract, and submit. Here's the whole path.",
  "submit.startBuilding": "Start building",
  "submit.browseRegistry": "Browse the registry",
  "submit.step1.title": "Scaffold a kit",
  "submit.step1.lead":
    "Two ways in — both give your kit its own identity AND its own structure. Never recolor another kit: two kits should not be recognizable as the same layout.",
  "submit.step1.optA": "option a — new kit from the base canvas",
  "submit.step1.noteA":
    "The base is neutral plumbing (routing, i18n/RTL, dark mode, a token system). Open it in Claude Code / Codex, describe your kit, then point the editor at prompts/build.md — the brief for building it the uikit way (a full, original system, not a demo).",
  "submit.step1.optB": "option b — remix an existing kit into a new one",
  "submit.step1.noteB":
    "Drops a REMIX.md brief: give it a new identity and restructure the pages. Tip: npm i -g uikit-cli drops the npx prefix.",
  "submit.step2.title": "Make it a full system (not a sampler)",
  "submit.step2.lead": "It must run out of the box and read like a shipping product. The bar:",
  "submit.step3.title": "Validate against the contract",
  "submit.step3.lead":
    "Every kit is gated by a schema. validate must pass before you submit; info prints the tech, templates, and AI-consume steps so you can sanity check what reviewers will see.",
  "submit.step4.title": "Push to a public repo",
  "submit.step4.lead":
    "Publish to GitHub with uikit.json at the repo root, your screenshots/, and the bundled consumer skill under .claude/skills/<id>.",
  "submit.step5.title": "Open a pull request",
  "submit.step5.lead":
    "The gallery is pure git — no backend, no database. You list a kit by adding one JSON file to the registry and opening a PR. CI validates it; a maintainer merges; it's live.",
  "submit.step5.addEntry": "add your entry",
  "submit.step5.communityA": "Community",
  "submit.step5.communityB":
    "(default): set \"verified\": false and point screenshots/demoUrl at your own repo (a pinned cdn.jsdelivr.net/gh/you/kit@v1.0.0/… URL).",
  "submit.step5.verifiedA": "Verified",
  "submit.step5.verifiedB":
    "(maintainer-promoted): screenshots and the preview clip live in the kit's own repo and are pulled into the gallery at build time — never committed here.",
  "submit.step5.validateThenPr": "validate, then PR",
  "submit.step5.openPr": "Open a PR on GitHub",
  "submit.reviewers.title": "what reviewers check",
  "submit.reviewers.footer":
    "Reference shape: the spark-uikit repo — runnable React/Vue/Web Components, the four pages, full design system, EN/AR + RTL.",
  "submit.agent.title": "agent-ready by default",
  "submit.agent.body1":
    "When your kit merges, the gallery automatically generates its agent design spec — /kit/<id>/llms.txt and /kit/<id>/manifest.json — from your entry JSON, and lists it in the site-wide /llms.txt. That's what lets any developer say “build me a website with this design: uikit.studio/kit/<id>” and have their agent reproduce it exactly.",
  "submit.agent.body2":
    "Keep AGENTS.md and llms.txt at your repo root too (the uikit new scaffold writes both) so pointing an agent at the repo works as well. Rich token + component data in your JSON makes the generated spec better.",
} as const;

export type MsgKey = keyof typeof en;

const ar: Record<MsgKey, string> = {
  "meta.title": "uikit.studio — حِزَم واجهات جاهزة، يبنيها لك الذكاء الاصطناعي",
  "meta.description":
    "معرض مختار لحِزَم واجهات جاهزة للتشغيل — نظام تصميم كامل بصفحاته ومكوّناته. اختر حزمة، ووجّه إليها الذكاء الاصطناعي، يبني لك منتجك بنفس التصميم بالضبط، وباستهلاكٍ أقل.",
  "nav.studio": "studio",
  "nav.searchPlaceholder": "ابحث عن حزمة — SaaS، تسويق، لوحة تحكم…",
  "nav.github": "GitHub",
  "nav.submit": "أضِف حزمتك",
  "nav.langLabel": "تغيير اللغة",
  "footer.tagline": "uikit.studio — حِزَم جاهزة، تبني بها بثقة.",
  "footer.gallery": "المعرض",
  "footer.submit": "أضِف حزمة",
  "footer.github": "GitHub",

  "home.eyebrow": "حِزَم واجهات مختارة بعناية، جاهزة للذكاء الاصطناعي",
  "home.titleA": "واجهات جاهزة،",
  "home.titleB": "يبنيها لك الذكاء الاصطناعي.",
  "home.subtitle":
    "اختر حزمة جاهزة — نظام تصميم متكامل بصفحاته ومكوّناته، فاتح وداكن، عربي وإنجليزي. بعدها وجّه إليها الذكاء الاصطناعي، يبني لك منتجك بنفس التصميم بالضبط. من غير تخمين، ولا تصاميم مكرّرة، وباستهلاكٍ أقل بكثير.",
  "home.searchPlaceholder": "ابحث عن حزمة — SaaS، تسويق، لوحة تحكم، برتقالي…",
  "home.statKits": "{n} حِزَم",
  "home.statSources": "موثّقة ومن المجتمع",
  "home.statFrameworks": "react · vue · web components",
  "home.kitsHeading": "الحِزَم",
  "home.kitsLede": "كل حزمة نظام تصميم متكامل وجاهز للتشغيل — اختَرها وابدأ على طول.",
  "home.featured": "حزمة مختارة",
  "home.indexLabel": "الفهرس",

  "agent.eyebrow": "جاهزة للذكاء الاصطناعي",
  "agent.titleA": "الصق رابط الحزمة في أداة الذكاء الاصطناعي،",
  "agent.titleB": "وتطلع لك بالتصميم نفسه تمامًا.",
  "agent.body":
    "كل حزمة تنشر مواصفة تصميم يفهمها الذكاء الاصطناعي — الألوان والخطوط ونصف القطر والمكوّنات. أدوات مثل Claude Code وCursor وCodex تقرؤها من الرابط مباشرة، وتبني داخل مشروعك أنت.",
  "agent.step1.t": "الصق الرابط",
  "agent.step1.d": "«ابنِ لي موقعًا بهذا التصميم: uikit.studio/kit/…»",
  "agent.step2.t": "تقرأ الأداة المواصفة",
  "agent.step2.d": "ملفّا llms.txt وmanifest.json، يُكتشفان تلقائيًا",
  "agent.step3.t": "تبني داخل مشروعك",
  "agent.step3.d": "نفس الألوان، ووضع داكن، وتصميم متجاوب",
  "agent.termYou": "أداتك الذكية",

  "filter.all": "الكل",
  "filter.results": "{n} نتيجة",
  "filter.result": "نتيجة واحدة",
  "empty.none": "ما لقينا حزمة تطابق «{q}».",
  "empty.clear": "امسح البحث",
  "card.official": "رسمية",
  "card.community": "من المجتمع",
  "card.view": "افتح الحزمة",
  "card.by": "بواسطة",

  "submitcta.titleA": "عندك حزمة؟",
  "submitcta.titleB": "انشرها معنا.",
  "submitcta.body":
    "أضِف ملف ‎.json‎ واحد وافتح طلب دمج. يفحصه الـ CI تلقائيًا، يراجعه أحد المشرفين، وينشر على طول — git فقط، بلا حسابات ولا نماذج.",
  "submitcta.button": "أضِف حزمتك",

  "kit.back": "المعرض",
  "kit.official": "رسمية",
  "kit.community": "من المجتمع",
  "kit.agentReady": "جاهزة للذكاء الاصطناعي",
  "kit.metaRadius": "نصف القطر {r}",
  "kit.openDemo": "افتح العرض المباشر",
  "kit.repo": "المستودع",
  "kit.notFound": "ما لقينا هذي الحزمة.",
  "kit.backToGallery": "← رجوع للمعرض",
  "agentcard.title": "ابنِها بأداة الذكاء الاصطناعي",
  "agentcard.body":
    "الصق هذا في Claude Code أو Cursor أو Codex. تقرأ الأداة مواصفة التصميم من الرابط، وتعيد نفس الألوان والخطوط ونصف القطر والمكوّنات بالضبط — داخل مشروعك أنت.",
  "agentcard.spec": "المواصفة",
  "agentcard.llmsDesc": "موجز التصميم للأدوات الذكية",
  "agentcard.manifestDesc": "الألوان · الخطوط · المكوّنات",
  "agentcard.discoverable": "متاحة في كل صفحات الموقع عبر",
  "sec.livePreview": "عرض مباشر",
  "preview.open": "افتح",
  "sec.screenshots": "لقطات",
  "sec.colors": "الألوان",
  "colors.desc": "تدرّج لون العلامة، مع ألوان الوضعين الفاتح والداكن اللي تجيك مع الحزمة.",
  "colors.light": "فاتح",
  "colors.dark": "داكن",
  "sec.typography": "الخطوط",
  "type.display": "العناوين",
  "type.body": "النص",
  "type.mono": "أحادي / تسميات",
  "sec.prompt": "الموجّه",
  "prompt.descA": "الموجز اللي طلعت منه هذي الحزمة عبر",
  "sec.inside": "وش فيها",
  "inside.components": "المكوّنات",
  "inside.blocks": "الكتل",
  "inside.templates": "القوالب",
  "aside.install": "التثبيت",
  "aside.useAI": "استخدمها مع الذكاء الاصطناعي",
  "aside.skill": "المهارة:",
  "aside.frameworks": "أطر العمل",
  "aside.tags": "الوسوم",
  "aside.author": "صاحب الحزمة",
  "copy.copy": "نسخ",
  "copy.copied": "تم النسخ",

  "submit.eyebrow": "صير مؤلّف حِزَم",
  "submit.titleA": "انشر حزمتك في",
  "submit.titleB": "المعرض.",
  "submit.hero":
    "الحزمة منتج كامل يشتغل من أول لحظة — نظام تصميم متكامل، وصفحات حقيقية، ومهارة ذكاء اصطناعي جاهزة — مو مجرّد مكوّنات متفرّقة. ابنِها بأداة uikit، وتأكّد إنها تمشي مع العقد، وبعدها أرسِلها. وهذا المشوار كامل.",
  "submit.startBuilding": "ابدأ البناء",
  "submit.browseRegistry": "تصفّح السجلّ",
  "submit.step1.title": "ابنِ هيكل الحزمة",
  "submit.step1.lead":
    "طريقتين للبداية — كل وحدة تعطي حزمتك هويتها وبنيتها الخاصة. لا تكتفي بإعادة تلوين حزمة ثانية: المفروض ما تطلع حزمتين بنفس التخطيط.",
  "submit.step1.optA": "الخيار أ — حزمة جديدة من القاعدة الأساسية",
  "submit.step1.noteA":
    "القاعدة بنية محايدة (توجيه، وتعريب وRTL، ووضع داكن، ونظام ألوان وخطوط). افتحها في Claude Code أو Codex، وصِف حزمتك، وبعدها وجّه المحرّر لـ prompts/build.md — وهو الموجز لبنائها بأسلوب uikit (نظام أصيل كامل، مو عرض توضيحي).",
  "submit.step1.optB": "الخيار ب — أعِد مزج حزمة موجودة لحزمة جديدة",
  "submit.step1.noteB":
    "بتلقى موجز REMIX.md: اعطها هوية جديدة وأعِد ترتيب صفحاتها. ملاحظة: ‎npm i -g uikit-cli‎ يغنيك عن بادئة npx.",
  "submit.step2.title": "خلّها نظامًا كاملًا، مو مجرّد عيّنة",
  "submit.step2.lead": "لازم تشتغل من أول استنساخ، وتبان كمنتج جاهز للإطلاق. وهذا هو المعيار:",
  "submit.step3.title": "تأكّد إنها تمشي مع العقد",
  "submit.step3.lead":
    "كل حزمة محكومة بمخطّط. لازم ينجح validate قبل ما ترسل، وأمر info يعرض التقنيات والقوالب وخطوات الاستخدام مع الذكاء الاصطناعي عشان تشوف وش بيوصل للمراجعين.",
  "submit.step4.title": "ادفعها لمستودع عام",
  "submit.step4.lead":
    "انشرها على GitHub مع uikit.json في جذر المستودع، ومجلّد screenshots/، ومهارة الاستخدام المرفقة تحت ‎.claude/skills/<id>‎.",
  "submit.step5.title": "افتح طلب دمج",
  "submit.step5.lead":
    "المعرض git فقط — بلا خادم ولا قاعدة بيانات. تضيف حزمتك بملف JSON واحد في السجلّ، وتفتح طلب دمج. يفحصه الـ CI، يراجعه مشرف، وينشر.",
  "submit.step5.addEntry": "أضِف مُدخلك",
  "submit.step5.communityA": "من المجتمع",
  "submit.step5.communityB":
    "(الافتراضي): خلِّ \"verified\": false ووجّه screenshots/demoUrl لمستودعك (رابط مثبّت مثل cdn.jsdelivr.net/gh/you/kit@v1.0.0/…).",
  "submit.step5.verifiedA": "موثّقة",
  "submit.step5.verifiedB":
    "(يرفّعها مشرف): اللقطات ومقطع المعاينة في مستودع الكِت نفسه، وتُسحب إلى المعرض وقت البناء — لا تُحفظ هنا.",
  "submit.step5.validateThenPr": "تأكّد، وبعدها افتح الطلب",
  "submit.step5.openPr": "افتح طلب دمج على GitHub",
  "submit.reviewers.title": "وش يفحص المراجعون",
  "submit.reviewers.footer":
    "النموذج المرجعي: مستودع spark-uikit — React/Vue/Web Components تشتغل فعلًا، والصفحات الأربع، ونظام تصميم كامل، وEN/AR مع RTL.",
  "submit.agent.title": "جاهزة للذكاء الاصطناعي افتراضيًا",
  "submit.agent.body1":
    "أول ما تندمج حزمتك، المعرض يولّد لها تلقائيًا مواصفة تصميمها — ‎/kit/<id>/llms.txt‎ و‎/kit/<id>/manifest.json‎ — من ملف مُدخلك، ويضيفها لـ ‎/llms.txt‎ على مستوى الموقع. وهذا اللي يخلّي أي مطوّر يقدر يقول «ابنِ لي موقعًا بهذا التصميم: uikit.studio/kit/<id>»، وأداته تعيد إنتاجه بالضبط.",
  "submit.agent.body2":
    "خلِّ AGENTS.md وllms.txt في جذر مستودعك بعد (ينشئهما سكافولد uikit new) عشان يشتغل توجيه الأداة للمستودع كذلك. وكل ما كانت بيانات الألوان والمكوّنات في ملف JSON أغنى، طلعت المواصفة أحسن.",
};

const MESSAGES: Record<Locale, Record<MsgKey, string>> = { en, ar };

// ── List catalog (ordered, locale-aware arrays) ───────────────────────────────
const LISTS: Record<Locale, Record<string, string[]>> = {
  en: {
    systemBar: [
      "A full design system: a light + dark color moodboard, a type scale, and a documented radius scale — every component + its variants.",
      "All four pages for real — incl. a dense, full Dashboard (multiple tables, charts, users, activity, filters, empty/loading states).",
      "Responsive: mobile → tablet → desktop (sm/md/lg/xl). Nav collapses, grids reflow.",
      "EN + AR with full RTL, a dark-mode toggle, and real loaded fonts (self-host the Arabic face if needed).",
      "Everything defined & visible — colors, radius, fonts, breakpoints live in tokens + README + uikit.json, not magic numbers.",
    ],
    reviewChecks: [
      "The entry JSON passes the schema (CI runs scripts/validate-content.mjs on your PR).",
      "Verified kits mirror their screenshots into the repo; community kits pin external URLs to a tag/SHA.",
      "The kit's own uikit.json is contract-valid (npx uikit-cli validate).",
      "The demo URL loads and matches the screenshots.",
      "The repo ships AGENTS.md + llms.txt at its root (the CLI scaffolds both).",
      "License is real and permissive; no malware in install scripts.",
    ],
  },
  ar: {
    systemBar: [
      "نظام تصميم كامل: لوحة ألوان فاتحة وداكنة، ومقياس خطوط، ومقياس نصف قطر موثّق — وكل مكوّن مع تنويعاته.",
      "الصفحات الأربع كاملة وحقيقية — ومنها لوحة تحكم غنية (جداول ومخططات ومستخدمين ونشاط ومرشّحات وحالات فراغ وتحميل).",
      "متجاوبة: جوال ← لوحي ← سطح مكتب (sm/md/lg/xl). شريط التنقّل ينطوي، والشبكات تترتّب من جديد.",
      "عربي وإنجليزي مع RTL كامل، ومبدّل وضع داكن، وخطوط محمّلة فعلًا (استضِف الخط العربي بنفسك إذا احتجت).",
      "كل شي معرّف وواضح — الألوان ونصف القطر والخطوط ونقاط التوقّف، كلها في الرموز وREADME وuikit.json، مو أرقام عشوائية.",
    ],
    reviewChecks: [
      "ملف المُدخل JSON يجتاز المخطّط (الـ CI يشغّل scripts/validate-content.mjs على طلبك).",
      "الحِزَم الموثّقة تنسخ لقطاتها داخل المستودع، والمجتمعية تثبّت روابطها الخارجية على وسم أو SHA.",
      "ملف uikit.json الخاص بالحزمة متوافق مع العقد (npx uikit-cli validate).",
      "رابط العرض المباشر يفتح ويطابق اللقطات.",
      "المستودع فيه AGENTS.md وllms.txt في جذره (الأداة تنشئهما).",
      "الرخصة حقيقية ومتساهلة، وما فيه برمجيات خبيثة في سكربتات التثبيت.",
    ],
  },
};

export type ListKey = keyof (typeof LISTS)["en"];

// Category filter labels. Categories come from kit JSON (English keys); these
// localize the filter chips. Unknown keys fall back to the raw value (English
// chips are shown capitalized via CSS).
const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: {},
  ar: {
    saas: "SaaS",
    marketing: "تسويق",
    dashboard: "لوحة تحكم",
    landing: "صفحة هبوط",
    media: "وسائط",
    editorial: "تحريري",
    "dark-first": "داكن أولًا",
  },
};

// ── Context ────────────────────────────────────────────────────────────────
interface LocaleCtx {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
  tList: (key: ListKey) => string[];
  tCat: (category: string) => string;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LocaleProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  // Reconcile against the client's stored choice after hydration (the SSR value
  // comes from the cookie, so this only differs if storage was changed elsewhere).
  useEffect(() => {
    const stored = normalizeLocale(localStorage.getItem(LOCALE_COOKIE));
    if (stored !== locale) applyLocale(stored, setLocaleState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => applyLocale(l, setLocaleState), []);

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      dir: dirFor(locale),
      t: (key, vars) => interpolate(MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key, vars),
      tList: (key) => LISTS[locale][key] ?? LISTS.en[key] ?? [],
      tCat: (category) => CATEGORY_LABELS[locale][category] ?? category,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Persist the choice (cookie for SSR + localStorage), reflect it on <html>, set state. */
function applyLocale(l: Locale, set: (l: Locale) => void) {
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    try {
      localStorage.setItem(LOCALE_COOKIE, l);
    } catch {
      /* storage may be unavailable (private mode) — cookie is enough */
    }
    const html = document.documentElement;
    html.lang = l;
    html.dir = dirFor(l);
  }
  set(l);
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within <LocaleProvider>");
  return ctx;
}

/** Convenience: just the `t` function. */
export function useT() {
  return useLocale().t;
}
