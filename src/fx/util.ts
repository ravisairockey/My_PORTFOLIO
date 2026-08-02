/* ── Shared motion / DOM utilities ──────────────────────────────────────
   Every fx component imports from here so behaviour stays consistent.   */
import { useEffect, useRef, useState } from "react";

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
