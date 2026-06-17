/* The launch scene. Builds the DOM from assets/themes.json and assembles ONE
   paused GSAP master timeline. The renderer drives it by seeking to a given time
   per frame, so every "live" effect (typing, scroll, blink) is a tween — never a
   setInterval — and seeking to time t always yields an identical frame.

   Control surface the renderer relies on:
     window.__duration  total seconds
     window.__seek(t)   jump to second t
     window.__ready     true once fonts + images are decoded and the TL is built
*/
(() => {
  const params = new URLSearchParams(location.search);
  const FORMAT = params.get("format") === "9x16" ? "9x16" : "16x9";
  const AUTOPLAY = params.get("autoplay") === "1";
  const DIMS = FORMAT === "9x16" ? { W: 1080, H: 1920 } : { W: 1920, H: 1080 };

  const stage = document.getElementById("stage");
  stage.style.setProperty("--W", DIMS.W + "px");
  stage.style.setProperty("--H", DIMS.H + "px");
  stage.classList.add("f-" + FORMAT);

  // scale the stage to fit the window for in-browser preview; at render time the
  // viewport equals the stage size, so this resolves to scale(1).
  const fit = () => {
    const s = Math.min(window.innerWidth / DIMS.W, window.innerHeight / DIMS.H);
    stage.style.transform = `scale(${s})`;
  };
  fit();
  addEventListener("resize", fit);

  // ── tiny DOM helper ──────────────────────────────────────────────
  const el = (tag, props = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "text") n.textContent = v;
      else if (k === "style") Object.assign(n.style, v);
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(kids)) n.append(c);
    return n;
  };
  const layer = (cls) => {
    const l = el("div", { class: "layer " + cls });
    stage.append(l);
    return l;
  };

  // the exact uikit.studio logo: gradient rounded-xl mark w/ lucide Boxes icon,
  // then "uikit" + accent "." + muted "studio"
  const BOXES_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/>' +
    '<path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/>' +
    '<path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/>' +
    '<path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/>' +
    '<path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/>' +
    '<path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></svg>';
  const makeWordmark = () =>
    el("div", { class: "wordmark" }, [
      el("div", { class: "dotmark", html: BOXES_SVG }),
      el("div", { class: "text", html: 'uikit<span class="dotc">.</span><span class="studio">studio</span>' }),
    ]);

  // split text into inline-block word spans for word-by-word reveals (RTL-safe:
  // DOM order = reading order, so a forward stagger reveals right→left in Arabic)
  const fillWords = (container, text, cls = "w") => {
    const words = [];
    text.split(" ").forEach((w) => {
      const s = el("span", { class: cls, text: w });
      container.append(s, document.createTextNode(" "));
      words.push(s);
    });
    return words;
  };

  // word-by-word reveal: each word snaps on INSTANTLY (no fade at all) at its beat
  const revealWords = (tl, words, at, { stagger = 0.09, hideAt = at - 0.2 } = {}) => {
    tl.set(words, { opacity: 0 }, Math.max(0, hideAt));
    words.forEach((w, i) => tl.set(w, { opacity: 1 }, at + i * stagger));
  };

  // pick a readable text color (#0a0b10 / #fff) against a background hex
  const readable = (hex) => {
    const h = (hex || "#000").replace("#", "");
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(n.slice(0, 2), 16) / 255;
    const g = parseInt(n.slice(2, 4), 16) / 255;
    const b = parseInt(n.slice(4, 6), 16) / 255;
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.5 ? "#0a0b10" : "#ffffff";
  };

  const imgDims = {}; // "./assets/<src>" -> { w, h } natural size (for reliable scroll math)

  async function init() {
    const themes = await fetch("./assets/themes.json").then((r) => r.json());

    // preload + decode every screenshot (incl. the tall page captures) and record sizes
    const imgs = themes.flatMap((t) => [t.page, t.landing, t.alt]).filter(Boolean);
    await Promise.all(
      [...new Set(imgs)].map(
        (src) =>
          new Promise((res) => {
            const im = new Image();
            const full = "./assets/" + src;
            im.onload = () => { imgDims[full] = { w: im.naturalWidth, h: im.naturalHeight }; res(); };
            im.onerror = res;
            im.src = full;
          })
      )
    );
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    buildDOM(themes);
    // force layout so screenshot heights can be measured for the scroll math
    void stage.offsetHeight;
    const tl = buildTimeline(themes);

    window.__duration = tl.duration();
    window.__seek = (t) => {
      tl.pause();
      // suppressEvents=false so onUpdate-driven effects (typing) render on scrub
      tl.seek(Math.max(0, Math.min(t, tl.duration())), false);
    };
    window.__tl = tl;
    window.__ready = true;

    if (AUTOPLAY) {
      tl.play(0);
    } else {
      tl.pause(0);
    }
    // scrub preview: arrow keys / space
    addEventListener("keydown", (e) => {
      if (e.code === "Space") (tl.paused() ? tl.play() : tl.pause()), e.preventDefault();
      if (e.code === "ArrowRight") tl.seek(tl.time() + 0.5);
      if (e.code === "ArrowLeft") tl.seek(Math.max(0, tl.time() - 0.5));
      if (e.code === "Home") tl.seek(0);
    });
  }

  // ── DOM construction ─────────────────────────────────────────────
  const refs = {};
  function buildDOM(themes) {
    // ACT 1 — hook (Khaleeji prompt → punch)
    const hook = layer("hook");
    hook.append(el("div", { class: "bg-grid" }));
    const prompt = el("div", { class: "prompt" }, [
      el("span", { class: "dim", text: "❮ " }),
      el("span", { class: "typed", text: "" }),
      el("span", { class: "caret" }),
    ]);
    // word-by-word punch: each word is its own span; gradient strike on the last clause
    const punch = el("div", { class: "punch" });
    const pl1 = el("div", { class: "pline" });
    const pl2 = el("div", { class: "pline" });
    const punchWords = [];
    punchWords.push(...fillWords(pl1, "تبني واجهات بالذكاء الاصطناعي؟"));
    punchWords.push(...fillWords(pl2, "بدون"));
    const strike = el("span", { class: "strike" });
    punchWords.push(...fillWords(strike, "تخمين ولا حرق توكنز.", "w word"));
    pl2.append(strike);
    punch.append(pl1, pl2);
    hook.append(prompt, punch);
    Object.assign(refs, { hook, prompt, punch, punchWords, strike });

    // ACT 2 — wordmark / promise
    const promise = layer("promise");
    promise.append(el("div", { class: "bg-grid" }));
    const brand = el("div", { class: "brand" }, [
      makeWordmark(),
      el("div", { class: "sub", text: "حِزَم واجهات جاهزة، يبنيها لك الذكاء الاصطناعي" }),
    ]);
    promise.append(brand);
    refs.promise = promise;
    refs.brand = brand;

    // ACT 3 — one beat layer per theme
    refs.beats = themes.map((t, i) => buildBeat(t, i));

    // ACT 3.5 — "more to code" closer
    const more = layer("more");
    more.append(el("div", { class: "bg-grid" }));
    const dots = el("div", { class: "kit-dots" });
    themes.forEach((t) => dots.append(el("i", { style: { background: t.accent || t.primary } })));
    dots.append(el("span", { class: "plus", text: "+" }));
    const moreBig = el("div", { class: "more-big", dir: "rtl" });
    const moreBigWords = fillWords(moreBig, "والمزيد قريبًا");
    const moreSub = el("div", { class: "more-sub", text: "more to code →" });
    more.append(el("div", { class: "more-center" }, [dots, moreBig, moreSub]));
    Object.assign(refs, { more, moreDots: dots, moreBigWords, moreSub });

    // ACT 4 — outro
    const outro = layer("outro");
    const blades = themes.map((t, i) =>
      el("div", { class: "blade", style: { left: i * 25 + "%", background: t.accent || t.primary } })
    );
    outro.append(...blades);
    const center = el("div", { class: "center" }, [
      makeWordmark(),
      el("div", { class: "made" }, [
        el("div", { class: "ai-ar", dir: "rtl", text: "هذا الفيديو من صنع الذكاء الاصطناعي" }),
        el("div", { class: "ai-en", text: "made with AI ;)" }),
      ]),
    ]);
    outro.append(center);
    Object.assign(refs, { outro, blades, outroCenter: center });
  }

  const AR_IDX = ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"];
  const FW_LABEL = { react: "React", vue: "Vue", "web-components": "Web Components" };
  function buildBeat(t, i = 0) {
    const l = layer("beat");
    l.setAttribute("dir", "rtl");
    l.style.setProperty("--tint", t.accent || t.primary || "var(--brand)");

    const eyebrow = el("div", { class: "eyebrow" }, [
      el("span", { class: "dot" }),
      el("span", { text: `حزمة ${AR_IDX[i] || i + 1}` }),
    ]);
    // BIG kit name (Arabic name in Thmanyah, latin brand in Outfit)
    const isAr = /[؀-ۿ]/.test(t.nameAr || t.name);
    const name = el("div", { class: "kit-name", text: t.nameAr || t.name });
    name.style.fontFamily = isAr ? "var(--thmanyah)" : "var(--outfit)";
    name.style.fontWeight = isAr ? "700" : "800";
    name.style.direction = isAr ? "rtl" : "ltr";
    // what you GET — revealed word by word
    const feature = el("div", { class: "feature" });
    const featureWords = fillWords(feature, t.feature);
    const pillLabels = [...(t.frameworks || []).map((f) => FW_LABEL[f] || f), "داكن", "RTL"];
    const pills = el("div", { class: "pills" },
      pillLabels.map((p) => el("span", { class: "pill", text: p }))
    );
    const chips = el("div", { class: "chips" },
      (t.brandScale || []).slice(0, 6).map((c) => el("i", { style: { background: c } }))
    );
    const copy = el("div", { class: "copy" }, [eyebrow, name, feature, pills, chips]);

    // tall full-page capture scrolls like a playthrough; fall back to the landing shot
    const img = el("img", { src: "./assets/" + (t.page || t.landing), alt: "" });
    const mock = el("div", { class: "mock" }, [
      el("div", { class: "bar" }, [el("b"), el("b"), el("b"), el("div", { class: "url" })]),
      el("div", { class: "view" }, [img]),
    ]);

    const wash = el("div", { class: "wash" });
    // RTL grid: copy first → right column, mock → left column
    l.append(wash, el("div", { class: "inner" }, [copy, mock]));
    return { t, l, eyebrow, name, feature, featureWords, pills, chips, mock, img, view: mock.querySelector(".view") };
  }

  // ── the master timeline (~10.3s, clean word-by-word reveals) ──────
  function buildTimeline(themes) {
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    const T = {};
    T.hook = 0;
    T.promise = 3.55;  // hold the hook punch ~1.2s after it reveals
    T.beats = 5.0;     // hold the wordmark ~1.4s
    T.beatDur = 2.3;   // each kit dwells ~1s after its words finish
    T.more = T.beats + themes.length * T.beatDur; // 14.2
    T.moreDur = 2.5;   // hold "more to code" ~1.5s
    T.outro = T.more + T.moreDur; // 16.7
    const FIN = T.outro + 1.3; // ~18.0

    // ACT 1 — hook (Khaleeji prompt → word-by-word punch, unhurried)
    const h = refs;
    tl.set(h.hook, { opacity: 1 }, T.hook);
    const typed = h.prompt.querySelector(".typed");
    const text = "سوّي لي واجهة حلوة";
    tl.fromTo(h.prompt, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.1);
    tl.to({ i: 0 }, { i: text.length, duration: 0.9, ease: "none", onUpdate() { typed.textContent = text.slice(0, Math.round(this.targets()[0].i)); } }, 0.25);
    tl.to(h.prompt.querySelector(".caret"), { opacity: 0, duration: 0.4, repeat: 4, yoyo: true, ease: "steps(1)" }, 0.3);
    tl.to(h.prompt, { opacity: 0, y: -8, duration: 0.22 }, 1.3);
    // punch reveals one word at a time (container is opacity:0 in CSS — show it first)
    tl.set(h.punch, { opacity: 1 }, 1.28);
    revealWords(tl, h.punchWords, 1.32, { stagger: 0.11, hideAt: 1.05 });
    addStrike(tl, h.punch, 2.15);
    tl.to(h.hook, { opacity: 0, y: -22, duration: 0.26 }, T.promise - 0.05);

    // ACT 2 — wordmark
    tl.set(h.promise, { opacity: 1 }, T.promise - 0.05);
    tl.fromTo(h.brand.querySelector(".wordmark"), { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.42, ease: "power4.out" }, T.promise);
    tl.fromTo(h.brand.querySelector(".sub"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, T.promise + 0.24);
    tl.to(h.promise, { opacity: 0, y: -16, duration: 0.24 }, T.beats - 0.05);

    // ACT 3 — kit beats (slide transitions, feature word-by-word)
    refs.beats.forEach((b, i) => {
      buildBeatTween(tl, b, T.beats + i * T.beatDur, T.beatDur, i === refs.beats.length - 1);
    });

    // ACT 3.5 — "more to code"
    tl.fromTo(h.more, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power1.out" }, T.more - 0.08);
    tl.fromTo(h.moreDots.children, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.32, stagger: 0.05, ease: "back.out(2)" }, T.more + 0.12);
    revealWords(tl, h.moreBigWords, T.more + 0.36, { stagger: 0.13, hideAt: T.more - 0.05 });
    tl.fromTo(h.moreSub, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, T.more + 0.68);
    tl.to(h.more, { opacity: 0, duration: 0.3, ease: "power1.in" }, T.outro - 0.18);

    // ACT 4 — outro (+ made-with-AI credit)
    tl.set(h.outro, { opacity: 1 }, T.outro - 0.05);
    tl.fromTo(h.blades, { scaleX: 1, transformOrigin: "center" }, { scaleX: 0, duration: 0.55, ease: "power3.inOut", stagger: 0.05 }, T.outro);
    tl.fromTo(h.outroCenter.querySelector(".wordmark"), { opacity: 0, scale: 1.2, filter: "blur(12px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power4.out" }, T.outro + 0.2);
    tl.fromTo(h.outroCenter.querySelector(".made"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, T.outro + 0.6);
    tl.to(h.outro, { opacity: 1, duration: 0.3 }, FIN - 0.3); // hold to end

    tl.set({}, {}, FIN); // pin total duration
    return tl;
  }

  // add a real strike-through overlay bar (pseudo-elements can't be tweened directly)
  function addStrike(tl, punch, at) {
    const strike = punch.querySelector(".strike");
    const bar = document.createElement("span");
    Object.assign(bar.style, {
      position: "absolute", left: "-1%", right: "-1%", top: "56%", height: "9px",
      borderRadius: "5px", transformOrigin: "right", transform: "scaleX(0)",
      backgroundImage: "linear-gradient(100deg, #fb4d68, #ff6f54, #ff9a4d)",
    });
    strike.style.position = "relative";
    strike.append(bar);
    tl.to(bar, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, at);
  }

  function buildBeatTween(tl, b, start, dur, isLast) {
    const { l, name, mock, featureWords, img, view } = b;
    const inner = l.querySelector(".inner");
    l.style.zIndex = 6;
    // transition IN: quick crossfade + horizontal slide (RTL: in from the right) — a clean push
    tl.fromTo(l, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, start - 0.1);
    tl.fromTo(inner, { xPercent: 7 }, { xPercent: 0, duration: 0.55, ease: "power3.out" }, start - 0.05);
    // the kit name fades up and the demo fades in (eyebrow/pills/chips ride the slide)
    tl.set([name, mock], { opacity: 0 }, start - 0.12);
    tl.set(name, { y: 22 }, start - 0.12);
    tl.to(name, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, start + 0.2);
    tl.to(mock, { opacity: 1, duration: 0.6, ease: "power2.out" }, start + 0.24);
    // feature line types in — word by word, instant, no fade
    revealWords(tl, featureWords, start + 0.55, { stagger: 0.075, hideAt: start - 0.12 });

    // preview plays through the page — SLOW (≈1/3 of the page over the beat), linear
    const d = imgDims[img.getAttribute("src")];
    const viewW = view.offsetWidth || 780;
    const viewH = view.offsetHeight || 640;
    const renderedH = d ? viewW * (d.h / d.w) : img.offsetHeight;
    const scrollable = Math.max(0, renderedH - viewH);
    // ~10x slower than a real scroll: creep through a small slice over the whole beat
    const dist = Math.min(scrollable, renderedH * 0.16);
    tl.fromTo(img, { y: 0 }, { y: -dist, duration: dur + 0.5, ease: "none" }, start + 0.05);

    // transition OUT: slide the other way + fade
    tl.to(inner, { xPercent: -7, duration: 0.45, ease: "power2.in" }, start + dur - 0.34);
    tl.to(l, { opacity: 0, duration: 0.3, ease: "power1.in" }, start + dur - 0.26);
  }

  init();
})();
