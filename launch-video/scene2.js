/* uikit.studio launch — v2 "gallery rail".
   The whole film is one horizontal strip of full-stage panels; the camera (rail
   translateX + a subtle scale dip) glides RTL from the hook → each kit → "more"
   → wordmark. The transition IS the motion: a smooth eased pan that pulls back
   and pushes in on each move. Deterministic, seek-driven (same export contract). */
(() => {
  const params = new URLSearchParams(location.search);
  const FORMAT = params.get("format") === "9x16" ? "9x16" : "16x9";
  const AUTOPLAY = params.get("autoplay") === "1";
  const DIMS = FORMAT === "9x16" ? { W: 1080, H: 1920 } : { W: 1920, H: 1080 };

  const stage = document.getElementById("stage");
  stage.style.setProperty("--W", DIMS.W + "px");
  stage.style.setProperty("--H", DIMS.H + "px");
  stage.classList.add("f-" + FORMAT);
  const fit = () => {
    const s = Math.min(window.innerWidth / DIMS.W, window.innerHeight / DIMS.H);
    stage.style.transform = `scale(${s})`;
  };
  fit();
  addEventListener("resize", fit);

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
  const fillWords = (container, text, cls = "w") => {
    const words = [];
    text.split(" ").forEach((w) => {
      const s = el("span", { class: cls, text: w });
      container.append(s, document.createTextNode(" "));
      words.push(s);
    });
    return words;
  };
  // word-by-word: each word snaps on instantly (no fade)
  const revealWords = (tl, words, at, { stagger = 0.09, hideAt = at - 0.2 } = {}) => {
    tl.set(words, { opacity: 0 }, Math.max(0, hideAt));
    words.forEach((w, i) => tl.set(w, { opacity: 1 }, at + i * stagger));
  };
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
  const FW_LABEL = { react: "React", vue: "Vue", "web-components": "Web Components" };
  const AR_IDX = ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"];

  const imgDims = {};
  const refs = {};

  async function init() {
    const themes = await fetch("./assets/themes.json").then((r) => r.json());
    const imgs = themes.flatMap((t) => [t.page, t.landing]).filter(Boolean);
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
    void stage.offsetHeight;
    const tl = buildTimeline(themes);

    window.__duration = tl.duration();
    window.__seek = (t) => { tl.pause(); tl.seek(Math.max(0, Math.min(t, tl.duration())), false); };
    window.__ready = true;
    if (AUTOPLAY) tl.play(0); else tl.pause(0);
    addEventListener("keydown", (e) => {
      if (e.code === "Space") (tl.paused() ? tl.play() : tl.pause()), e.preventDefault();
      if (e.code === "ArrowRight") tl.seek(tl.time() + 0.5);
      if (e.code === "ArrowLeft") tl.seek(Math.max(0, tl.time() - 0.5));
      if (e.code === "Home") tl.seek(0);
    });
  }

  function panel(cls) {
    return el("div", { class: "panel " + cls });
  }

  function buildDOM(themes) {
    const cam = el("div", { id: "cam" });
    const rail = el("div", { class: "rail" });
    cam.append(rail);
    stage.append(cam);
    refs.cam = cam;
    refs.rail = rail;

    // panel 0 — hook
    const hook = panel("p-hook");
    hook.append(el("div", { class: "bg-grid" }));
    const prompt = el("div", { class: "h-prompt" }, [
      el("span", { class: "dim", text: "❮ " }),
      el("span", { class: "typed", text: "" }),
      el("span", { class: "h-caret" }),
    ]);
    const punch = el("div", { class: "h-punch" });
    const pl1 = el("div", { class: "pline" });
    const pl2 = el("div", { class: "pline" });
    const punchWords = [];
    punchWords.push(...fillWords(pl1, "تبني واجهات بالذكاء الاصطناعي؟"));
    punchWords.push(...fillWords(pl2, "بدون"));
    const strike = el("span", { class: "strike" });
    punchWords.push(...fillWords(strike, "تخمين ولا حرق توكنز.", "w word"));
    pl2.append(strike);
    punch.append(pl1, pl2);
    hook.append(el("div", { class: "h-wrap" }, [prompt, punch]));
    rail.append(hook);
    Object.assign(refs, { hook, prompt, punch, punchWords });

    // panels 1..N — kits
    refs.kits = themes.map((t, i) => {
      const p = panel("p-kit");
      p.style.setProperty("--pt", t.accent || t.primary || "var(--brand)");
      p.append(el("div", { class: "tint" }));
      const eyebrow = el("div", { class: "eyebrow" }, [
        el("span", { class: "dot" }),
        el("span", { text: `حزمة ${AR_IDX[i] || i + 1}` }),
      ]);
      const isAr = /[؀-ۿ]/.test(t.nameAr || t.name);
      const name = el("div", { class: "kit-name", text: t.nameAr || t.name });
      name.style.fontFamily = isAr ? "var(--thmanyah)" : "var(--outfit)";
      name.style.fontWeight = isAr ? "700" : "800";
      name.style.direction = isAr ? "rtl" : "ltr";
      const feature = el("div", { class: "feature" });
      const featureWords = fillWords(feature, t.feature);
      const pills = el("div", { class: "pills" },
        [...(t.frameworks || []).map((f) => FW_LABEL[f] || f), "داكن", "RTL"].map((p) => el("span", { class: "pill", text: p }))
      );
      const chips = el("div", { class: "chips" },
        (t.brandScale || []).slice(0, 6).map((c) => el("i", { style: { background: c } }))
      );
      const copy = el("div", { class: "copy" }, [eyebrow, name, feature, pills, chips]);
      const img = el("img", { src: "./assets/" + (t.page || t.landing), alt: "" });
      const mock = el("div", { class: "mock" }, [
        el("div", { class: "bar" }, [el("b"), el("b"), el("b"), el("div", { class: "url" })]),
        el("div", { class: "view" }, [img]),
      ]);
      p.append(el("div", { class: "p-inner" }, [copy, mock]));
      p.setAttribute("dir", "rtl");
      rail.append(p);
      return { t, p, name, feature, featureWords, img, view: mock.querySelector(".view"), mock };
    });

    // panel N+1 — more
    const more = panel("p-more");
    more.append(el("div", { class: "bg-grid" }));
    const dots = el("div", { class: "kit-dots" });
    themes.forEach((t) => dots.append(el("i", { style: { background: t.accent || t.primary } })));
    dots.append(el("span", { class: "plus", text: "+" }));
    const moreBig = el("div", { class: "more-big", dir: "rtl" });
    const moreBigWords = fillWords(moreBig, "والقادم أحلى");
    const moreSub = el("div", { class: "more-sub", text: "more to code →" });
    more.append(el("div", { class: "more-center" }, [dots, moreBig, moreSub]));
    rail.append(more);
    Object.assign(refs, { more, moreDots: dots, moreBigWords, moreSub });

    // panel N+2 — outro (with the 4-colour blades that wipe to the wordmark)
    const outro = panel("p-outro");
    outro.append(el("div", { class: "bg-grid" }));
    const oblades = el("div", { class: "blades" });
    const outroBlades = themes.map((t, i) =>
      el("div", { class: "blade", style: { left: i * 25 + "%", background: t.accent || t.primary } })
    );
    oblades.append(...outroBlades);
    const center = el("div", { class: "brand" }, [
      makeWordmark(),
      el("div", { class: "made" }, [
        el("div", { class: "ai-ar", dir: "rtl", text: "جاهزة للتشغيل، جاهزة لذكائك" }),
        el("div", { class: "ai-en", text: "ready to run, ready for your AI" }),
      ]),
    ]);
    outro.append(center, oblades);
    rail.append(outro);
    Object.assign(refs, { outro, outroBlades, outroCenter: center });

    // intro blades — overlay above the camera, lift like a curtain
    const intro = el("div", { class: "blades" });
    const introBlades = themes.map((t, i) =>
      el("div", { class: "blade", style: { left: i * 25 + "%", background: t.accent || t.primary } })
    );
    intro.append(...introBlades);
    stage.append(intro);
    Object.assign(refs, { intro, introBlades });

    refs.panelCount = 1 + themes.length + 2; // hook + kits + more + outro
  }

  function buildTimeline(themes) {
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    const h = refs;
    const W = DIMS.W;
    const PAN = 0.65;

    // the camera: rail.x slides between panels, cam scale dips then settles
    const panTo = (i, at, dur = PAN) => {
      tl.to(h.rail, { x: -i * W, duration: dur, ease: "power3.inOut" }, at);
      tl.to(h.cam, { scale: 0.93, duration: dur * 0.5, ease: "power2.in" }, at);
      tl.to(h.cam, { scale: 1, duration: dur * 0.5, ease: "power2.out" }, at + dur * 0.5);
    };
    tl.set(h.rail, { x: 0 }, 0);
    tl.set(h.cam, { scale: 1 }, 0);

    let t = 0;

    // INTRO — curtain of 4 colours lifts
    tl.set(h.intro, { opacity: 1 }, 0);
    tl.set(h.introBlades, { yPercent: 0 }, 0);
    tl.to(h.introBlades, { yPercent: -101, duration: 0.55, ease: "power3.inOut", stagger: 0.07 }, 0.28);
    tl.set(h.intro, { opacity: 0 }, 1.0);

    // PANEL 0 — hook
    t = 0.72;
    const typed = h.prompt.querySelector(".typed");
    const text = "سوّي لي واجهة حلوة";
    tl.fromTo(h.prompt, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, t);
    tl.to({ i: 0 }, { i: text.length, duration: 0.9, ease: "none", onUpdate() { typed.textContent = text.slice(0, Math.round(this.targets()[0].i)); } }, t + 0.15);
    tl.to(h.prompt.querySelector(".h-caret"), { opacity: 0, duration: 0.4, repeat: 4, yoyo: true, ease: "steps(1)" }, t + 0.2);
    tl.to(h.prompt, { opacity: 0, y: -8, duration: 0.22 }, t + 1.2);
    tl.set(h.punch, { opacity: 1 }, t + 1.18);
    revealWords(tl, h.punchWords, t + 1.22, { stagger: 0.11, hideAt: t + 0.95 });
    addStrike(tl, h.punch, t + 2.05);
    t = 3.7; // hold the punch, then pan

    // PANELS 1..N — kits (camera pans in, then the panel comes alive)
    h.kits.forEach((k, i) => {
      panTo(i + 1, t); // pan to this kit
      const at = t + PAN; // arrives
      // name fades up as it settles; feature types; demo drifts slowly
      tl.fromTo(k.name, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, at - 0.2);
      revealWords(tl, k.featureWords, at + 0.3, { stagger: 0.075, hideAt: t - 0.1 });
      const d = imgDims[k.img.getAttribute("src")];
      const viewW = k.view.offsetWidth || 780, viewH = k.view.offsetHeight || 640;
      const renderedH = d ? viewW * (d.h / d.w) : k.img.offsetHeight;
      const scrollable = Math.max(0, renderedH - viewH);
      const scrollDur = 3.0;
      tl.fromTo(k.img, { y: 0 }, { y: -Math.min(scrollable, 14 * scrollDur), duration: scrollDur, ease: "none" }, at - 0.3);
      t = at + 1.9; // dwell ~1s after the words finish
    });

    // PANEL N+1 — more
    panTo(themes.length + 1, t);
    let at = t + PAN;
    tl.fromTo(h.moreDots.children, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.32, stagger: 0.05, ease: "back.out(2)" }, at + 0.05);
    revealWords(tl, h.moreBigWords, at + 0.3, { stagger: 0.13, hideAt: t - 0.1 });
    tl.fromTo(h.moreSub, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, at + 0.62);
    t = at + 1.7;

    // PANEL N+2 — outro: pan in, blades wipe across to reveal the wordmark
    panTo(themes.length + 2, t);
    at = t + PAN;
    tl.fromTo(h.outroBlades, { scaleX: 1, transformOrigin: "center" }, { scaleX: 0, duration: 0.55, ease: "power3.inOut", stagger: 0.05 }, at);
    tl.fromTo(h.outroCenter.querySelector(".wordmark"), { opacity: 0, scale: 1.15, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power4.out" }, at + 0.25);
    tl.fromTo(h.outroCenter.querySelector(".made"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, at + 0.7);
    const FIN = at + 1.9;

    tl.set({}, {}, FIN);
    return tl;
  }

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

  init();
})();
