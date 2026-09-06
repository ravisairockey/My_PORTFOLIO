/* ── Shared motion / DOM utilities ──────────────────────────────────────
   Every fx component imports from here so behaviour stays consistent.   */
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

/** Respect the OS-level reduced-motion preference. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(q.matches);
    apply();
    q.addEventListener?.("change", apply);
    return () => q.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

/** IntersectionObserver convenience — defaults to "fire once". */
export function useInView<T extends HTMLElement>(threshold = 0.3, once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return { ref, inView };
}

/** rAF loop with automatic cleanup. `active=false` parks the loop. */
export function useRaf(cb: (t: number) => void, active = true) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = (t: number) => {
      cbRef.current(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Global cursor position, stored in a ref (no re-renders). */
export function useGlobalPointer() {
  const pt = useRef({ x: -9999, y: -9999 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pt.current.x = e.clientX;
      pt.current.y = e.clientY;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return pt;
}

/** Coarse-pointer capability — gates mobile-only microinteractions. */
export function useIsTouchMobile() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const apply = () => setTouch(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return touch;
}

/** rAF loop that parks itself when `ref` is off-screen or the tab is hidden. */
export function useVisibleRaf<T extends HTMLElement>(
  ref: RefObject<T | null>,
  cb: (t: number) => void,
  active = true
) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let onScreen = false;
    const sync = () => setRunning(onScreen && !document.hidden);
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        sync();
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    const onVis = () => sync();
    document.addEventListener("visibilitychange", onVis);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref, active]);
  useRaf(cb, running);
}

/** Gentle mobile parallax — rAF-throttled, clamped, disabled by reduced-motion. */
export function useParallax<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  strength = 0.05,
  max = 12
) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let ticking = false;
    let rafId = 0;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      const y = clamp(-mid * strength, -max, max);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafId);
      el.style.transform = "";
    };
  }, [ref, enabled, strength, max]);
}
