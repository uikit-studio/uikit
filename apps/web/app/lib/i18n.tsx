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
 * Arabic copy is clean Modern Standard Arabic (فصحى) — confident, concise product
 * voice, no Gulf/spoken dialect (مو، وش، اللي، عشان، على طول…) and no literal
 * calques. "حزمة" for a UI kit; "وكيل البرمجة الذكي" for an AI coding agent.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "uikit_locale";

export const dirFor = (l: Locale): "rtl" | "ltr" => (l === "ar" ? "rtl" : "ltr");

/** Normalize a persisted choice (cookie / client storage) to a supported locale.
 * Defaults to Arabic — only used once the visitor already has a stored locale. */
export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "ar";
}

/** First-visit detection from the browser's `Accept-Language` (no cookie yet).
 * Picks Arabic only when it's the visitor's top language preference; otherwise
 * English. So we no longer force Arabic — we follow the browser. */
export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  const top = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return top.startsWith("ar") ? "ar" : "en";
}

// ── Message catalog ──────────────────────────────────────────────────────────
// `en` is the source of truth for the key set; `ar` must mirror it (typed below).
const en = {
  // root / chrome
  "meta.title": "uikit — UI kits for your AI coding agent",
  "meta.description":
    "A curated gallery of runnable UI kits — tokens, components, dashboards and landing pages. Clone one and let your AI coding agent build a real product with it.",
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
  "home.eyebrow": "for your AI coding agent",
  "home.titleA": "UI kits, built by your",
  "home.titleB": "AI coding agent.",
  "home.subtitle":
    "Browse complete design systems — real pages, light & dark, EN + AR. Point your AI coding agent at one and it builds your product in that exact design.",
  "home.searchPlaceholder": "Search kits — saas, marketing, dashboard, orange…",
  "home.statKits": "{n} kits",
  "home.statSources": "verified + community",
  "home.statFrameworks": "react · vue · web components",
  "home.kitsHeading": "The kits",
  "home.kitsLede": "Each one a full, runnable design system — clone it, then build.",
  "home.featured": "Featured",
  "home.indexLabel": "Index",

  // home / agent-ready band
  "agent.eyebrow": "built for coding agents",
  "agent.titleA": "Hand a kit's URL to your AI coding agent.",
  "agent.titleB": "Same design, your stack.",
  "agent.body":
    "Every kit ships a machine-readable design spec — tokens, fonts, radius, components. Claude Code, Cursor and Codex read it from the URL and build in your stack.",
  "agent.step1.t": "Paste the URL",
  "agent.step1.d": "“build me a site with this design: uikit.studio/kit/…”",
  "agent.step2.t": "Agent reads the spec",
  "agent.step2.d": "llms.txt + manifest.json, auto-discovered",
  "agent.step3.t": "Builds in your stack",
  "agent.step3.d": "exact tokens, dark mode, responsive",
  "agent.termYou": "your AI coding agent",

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
  "card.radius": "radius",

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
  "submit.hero": "Build a kit, validate it, open a PR. Pure git — no backend.",
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
  "meta.title": "uikit.studio — حُزَم واجهات لوكيل البرمجة الذكي",
  "meta.description":
    "معرض مختار لحُزَم واجهات جاهزة للتشغيل — نظام تصميم كامل بصفحاته ومكوناته. اختر حزمة، ووجه إليها وكيل البرمجة الذكي، فيبني لك منتجك بالتصميم نفسه تماما، وباستهلاك أقل.",
  "nav.studio": "studio",
  "nav.searchPlaceholder": "ابحث عن حزمة — SaaS، تسويق، لوحة تحكم…",
  "nav.github": "GitHub",
  "nav.submit": "أضف حزمتك",
  "nav.langLabel": "تغيير اللغة",
  "footer.tagline": "uikit.studio — حُزَم جاهزة، تبني بها بثقة.",
  "footer.gallery": "المعرض",
  "footer.submit": "أضف حزمة",
  "footer.github": "GitHub",

  "home.eyebrow": "حُزَم جاهزة لوكيل البرمجة الذكي",
  "home.titleA": "حُزَم واجهات، يبنيها",
  "home.titleB": "وكيل البرمجة الذكي",
  "home.subtitle":
    "تصفح أنظمة تصميم كاملة — صفحات حقيقية، فاتح وداكن، عربي وإنجليزي. وجه وكيل البرمجة الذكي إلى إحداها، فيبني منتجك بالتصميم نفسه تماما.",
  "home.searchPlaceholder": "ابحث عن حزمة — SaaS، تسويق، لوحة تحكم، برتقالي…",
  "home.statKits": "{n} حزمة",
  "home.statSources": "موثقة ومن المجتمع",
  "home.statFrameworks": "react · vue · web components",
  "home.kitsHeading": "الحُزَم",
  "home.kitsLede": "كل حزمة نظام تصميم متكامل جاهز للتشغيل — اخترها وابدأ فورا.",
  "home.featured": "حزمة مختارة",
  "home.indexLabel": "الفهرس",

  "agent.eyebrow": "جاهزة لوكيل البرمجة",
  "agent.titleA": "أعط وكيل البرمجة الذكي رابط الحزمة.",
  "agent.titleB": "التصميم نفسه، داخل مشروعك",
  "agent.body":
    "كل حزمة تنشر مواصفة تصميم — الألوان والخطوط ونصف القطر والمكونات. أدوات مثل Claude Code وCursor وCodex تقرؤها من الرابط وتبني داخل مشروعك.",
  "agent.step1.t": "الصق الرابط",
  "agent.step1.d": "«أنشئ لي موقعا بهذا التصميم: uikit.studio/kit/…»",
  "agent.step2.t": "يقرأ الوكيل المواصفة",
  "agent.step2.d": "ملفا llms.txt وmanifest.json، يكتشفان تلقائيا",
  "agent.step3.t": "يبني داخل مشروعك",
  "agent.step3.d": "الألوان نفسها، ووضع داكن، وتصميم متجاوب",
  "agent.termYou": "وكيل البرمجة الذكي",

  "filter.all": "الكل",
  "filter.results": "{n} نتيجة",
  "filter.result": "نتيجة واحدة",
  "empty.none": "لا توجد حزمة تطابق «{q}».",
  "empty.clear": "امسح البحث",
  "card.official": "رسمية",
  "card.community": "من المجتمع",
  "card.view": "افتح الحزمة",
  "card.by": "بواسطة",
  "card.radius": "نصف القطر",

  "submitcta.titleA": "أنشأت حزمة؟",
  "submitcta.titleB": "انشرها هنا",
  "submitcta.body":
    "أضف ملف ‎.json‎ واحد وافتح طلب دمج. يفحصه ال CI تلقائيا، يراجعه أحد المشرفين، فينشر فورا — git فقط، بلا حسابات ولا نماذج.",
  "submitcta.button": "أضف حزمتك",

  "kit.back": "المعرض",
  "kit.official": "رسمية",
  "kit.community": "من المجتمع",
  "kit.agentReady": "جاهزة لوكيل البرمجة",
  "kit.metaRadius": "نصف القطر {r}",
  "kit.openDemo": "افتح العرض المباشر",
  "kit.repo": "المستودع",
  "kit.notFound": "لم نعثر على هذه الحزمة.",
  "kit.backToGallery": "← العودة إلى المعرض",
  "agentcard.title": "أنشئها بوكيل البرمجة الذكي",
  "agentcard.body":
    "الصق هذا في Claude Code أو Cursor أو Codex. يقرأ الوكيل مواصفة التصميم من الرابط، ويعيد الألوان والخطوط ونصف القطر والمكونات نفسها تماما — داخل مشروعك أنت.",
  "agentcard.spec": "المواصفة",
  "agentcard.llmsDesc": "موجز التصميم لوكلاء البرمجة",
  "agentcard.manifestDesc": "الألوان · الخطوط · المكونات",
  "agentcard.discoverable": "متاحة في كل صفحات الموقع عبر",
  "sec.livePreview": "عرض مباشر",
  "preview.open": "افتح",
  "sec.screenshots": "لقطات",
  "sec.colors": "الألوان",
  "colors.desc": "تدرج لون العلامة، مع ألوان الوضعين الفاتح والداكن المرفقة مع الحزمة.",
  "colors.light": "فاتح",
  "colors.dark": "داكن",
  "sec.typography": "الخطوط",
  "type.display": "العناوين",
  "type.body": "النص",
  "type.mono": "أحادي / تسميات",
  "sec.prompt": "الموجه",
  "prompt.descA": "الموجز الذي أنتج هذه الحزمة عبر",
  "sec.inside": "المحتويات",
  "inside.components": "المكونات",
  "inside.blocks": "الكتل",
  "inside.templates": "القوالب",
  "aside.install": "التثبيت",
  "aside.useAI": "استخدمها مع وكيل البرمجة",
  "aside.skill": "المهارة:",
  "aside.frameworks": "أطر العمل",
  "aside.tags": "الوسوم",
  "aside.author": "مؤلف الحزمة",
  "copy.copy": "نسخ",
  "copy.copied": "تم النسخ",

  "submit.eyebrow": "كن مؤلف حُزَم",
  "submit.titleA": "انشر حزمتك في",
  "submit.titleB": "المعرض",
  "submit.hero": "أنشئ حزمتك، تحقق منها، وافتح طلب دمج — كل شيء عبر git، بلا خادم.",
  "submit.startBuilding": "ابدأ البناء",
  "submit.browseRegistry": "تصفح السجل",
  "submit.step1.title": "أنشئ هيكل الحزمة",
  "submit.step1.lead":
    "طريقتان للبدء — كلتاهما تمنح حزمتك هويتها وبنيتها الخاصة. لا تكتف بإعادة تلوين حزمة أخرى: يجب ألا تبدو حزمتان بالتخطيط نفسه.",
  "submit.step1.optA": "الخيار أ — حزمة جديدة من القاعدة الأساسية",
  "submit.step1.noteA":
    "القاعدة بنية محايدة (توجيه، وتعريب وRTL، ووضع داكن، ونظام ألوان وخطوط). افتحها في Claude Code أو Codex، وصف حزمتك، ثم وجه المحرر إلى prompts/build.md — وهو الموجز لبنائها بأسلوب uikit (نظام أصيل كامل، لا مجرد عرض توضيحي).",
  "submit.step1.optB": "الخيار ب — أعد مزج حزمة قائمة إلى حزمة جديدة",
  "submit.step1.noteB":
    "ستجد موجز REMIX.md: امنحها هوية جديدة وأعد ترتيب صفحاتها. ملاحظة: ‎npm i -g uikit-cli‎ يغنيك عن بادئة npx.",
  "submit.step2.title": "اجعلها نظاما كاملا، لا مجرد عينة",
  "submit.step2.lead": "يجب أن تعمل من أول استنساخ، وأن تبدو كمنتج جاهز للإطلاق. وهذا هو المعيار:",
  "submit.step3.title": "تأكد من مطابقتها للعقد",
  "submit.step3.lead":
    "كل حزمة محكومة بمخطط. يجب أن ينجح validate قبل الإرسال، وأمر info يعرض التقنيات والقوالب وخطوات الاستخدام مع وكيل البرمجة، لتطلع على ما سيصل إلى المراجعين.",
  "submit.step4.title": "انشرها في مستودع عام",
  "submit.step4.lead":
    "انشرها على GitHub مع uikit.json في جذر المستودع، ومجلد screenshots/، ومهارة الاستخدام المرفقة ضمن ‎.claude/skills/<id>‎.",
  "submit.step5.title": "افتح طلب دمج",
  "submit.step5.lead":
    "المعرض يعتمد git فقط — بلا خادم ولا قاعدة بيانات. تضيف حزمتك بملف JSON واحد في السجل، وتفتح طلب دمج. يفحصه ال CI، يراجعه مشرف، ثم ينشر.",
  "submit.step5.addEntry": "أضف مدخلك",
  "submit.step5.communityA": "من المجتمع",
  "submit.step5.communityB":
    "(الافتراضي): اجعل \"verified\": false ووجه screenshots/demoUrl إلى مستودعك (رابط مثبت مثل cdn.jsdelivr.net/gh/you/kit@v1.0.0/…).",
  "submit.step5.verifiedA": "موثقة",
  "submit.step5.verifiedB":
    "(يرفعها مشرف): تحفظ اللقطات ومقطع المعاينة في مستودع الحزمة نفسه، وتسحب إلى المعرض وقت البناء — لا تحفظ هنا.",
  "submit.step5.validateThenPr": "تحقق، ثم افتح الطلب",
  "submit.step5.openPr": "افتح طلب دمج على GitHub",
  "submit.reviewers.title": "ماذا يفحص المراجعون",
  "submit.reviewers.footer":
    "النموذج المرجعي: مستودع spark-uikit — React/Vue/Web Components تعمل فعلا، والصفحات الأربع، ونظام تصميم كامل، وعربي/إنجليزي مع RTL.",
  "submit.agent.title": "جاهزة لوكيل البرمجة افتراضيا",
  "submit.agent.body1":
    "فور دمج حزمتك، يولد المعرض تلقائيا مواصفة تصميمها — ‎/kit/<id>/llms.txt‎ و‎/kit/<id>/manifest.json‎ — من ملف مدخلك، ويضيفها إلى ‎/llms.txt‎ على مستوى الموقع. وهذا ما يتيح لأي مطور أن يقول «أنشئ لي موقعا بهذا التصميم: uikit.studio/kit/<id>»، فيعيد وكيله إنتاجه تماما.",
  "submit.agent.body2":
    "أبق AGENTS.md وllms.txt في جذر مستودعك أيضا (ينشئهما سكافولد uikit new) ليعمل توجيه الوكيل إلى المستودع كذلك. وكلما كانت بيانات الألوان والمكونات في ملف JSON أغنى، كانت المواصفة أفضل.",
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
      "نظام تصميم كامل: لوحة ألوان فاتحة وداكنة، ومقياس خطوط، ومقياس نصف قطر موثق — وكل مكون مع تنويعاته.",
      "الصفحات الأربع كاملة وحقيقية — ومنها لوحة تحكم غنية (جداول ومخططات ومستخدمون ونشاط ومرشحات وحالات فراغ وتحميل).",
      "متجاوبة: جوال ← لوحي ← سطح مكتب (sm/md/lg/xl). شريط التنقل ينطوي، ويعاد ترتيب الشبكات.",
      "عربي وإنجليزي مع RTL كامل، ومبدل وضع داكن، وخطوط محملة فعليا (استضف الخط العربي بنفسك عند الحاجة).",
      "كل شيء معرف وواضح — الألوان ونصف القطر والخطوط ونقاط التوقف، جميعها في الرموز وREADME وuikit.json، لا أرقام عشوائية.",
    ],
    reviewChecks: [
      "ملف المدخل JSON يجتاز المخطط (ال CI يشغل scripts/validate-content.mjs على طلبك).",
      "الحُزَم الموثقة تنسخ لقطاتها داخل المستودع، والمجتمعية تثبت روابطها الخارجية على وسم أو SHA.",
      "ملف uikit.json الخاص بالحزمة متوافق مع العقد (npx uikit-cli validate).",
      "رابط العرض المباشر يفتح ويطابق اللقطات.",
      "المستودع يحتوي AGENTS.md وllms.txt في جذره (الأداة تنشئهما).",
      "الرخصة حقيقية ومتساهلة، ولا برمجيات خبيثة في سكربتات التثبيت.",
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
    "dark-first": "داكن أولا",
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
