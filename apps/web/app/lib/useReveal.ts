/**
 * Scroll-reveal: fade/translate elements in as they enter the viewport.
 *
 * Pair with the `.reveal` utility in app.css — the element starts hidden and gets
 * `data-shown` once observed. Honors `prefers-reduced-motion` (reveals immediately,
 * no transition) and degrades gracefully without IntersectionObserver / on SSR.
 */
import { useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-shown", "true");
      return;
    }

    const obs = new IntersectionObserver(
      (entries, o) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "true");
            o.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1, ...options },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return ref;
}
