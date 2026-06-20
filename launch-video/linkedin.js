/* Builds the minimal LinkedIn launch card: a 2×2 mosaic of the kits (Sada + Lime
   on top) with a floating uikit.studio logo and one launch line. */
(() => {
  const card = document.getElementById("card");
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
  const BOXES_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/>' +
    '<path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/>' +
    '<path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/>' +
    '<path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/>' +
    '<path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/>' +
    '<path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></svg>';

  fetch("./assets/themes.json")
    .then((r) => r.json())
    .then(async (themes) => {
      // Sada + Lime first → top row (themes.json is already sada, lime, aurora, spark)
      // Aurora + Spark show their dashboard; Sada + Lime show their landing.
      const SHOT = { aurora: "pages/aurora-dash.png", spark: "pages/spark-dash.png" };
      const grid = el("div", { class: "grid2", dir: "rtl" });
      themes.forEach((t) => {
        const accent = t.accent || t.primary;
        grid.append(
          el("div", { class: "cell", style: { background: `color-mix(in oklab, ${accent} 20%, white)` } }, [
            el("div", { class: "nm", style: { color: `color-mix(in oklab, ${accent} 62%, #1a1613)` } }, [
              el("span", { class: "sw", style: { background: accent } }),
              el("span", { text: t.name }),
            ]),
            el("div", { class: "mock" }, [
              el("div", { class: "bar" }, [el("b"), el("b"), el("b")]),
              el("div", { class: "view" }, [el("img", { src: "./assets/" + (SHOT[t.id] || t.landing), alt: "" })]),
            ]),
          ])
        );
      });
      card.append(grid);

      const center = el("div", { class: "center" }, [
        el("div", { class: "logobox" }, [
          el("div", { class: "wordmark", dir: "ltr" }, [
            el("div", { class: "dotmark", html: BOXES_SVG }),
            el("div", { class: "text", html: 'uikit<span class="dot">.</span><span class="studio">studio</span>' }),
          ]),
          el("div", { class: "now", text: "متاح الآن" }),
        ]),
      ]);
      card.append(center);

      const imgs = [...card.querySelectorAll("img")];
      await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => (im.onload = im.onerror = r)))));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      window.__ready = true;
    });
})();
