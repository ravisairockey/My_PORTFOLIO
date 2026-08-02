/* ════════════════════════════════════════════════════════════════════
   TEXT FX — WarpText (mesh + chromatic fringe + dynamic weight)
             SmokeyTitle (ink-bleed + smoke) · DuskReveal · SwapLink
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { clamp, useInView, usePrefersReducedMotion, useRaf } from "./util";

/* ── MESH TEXT ────────────────────────────────────────────────────────
   Per-character springs: letters are dragged toward the cursor and spring
   back; weight swells 340→860; two chromatic clones (--p driven) cycle
   through the palette as colour-split fringes. Idle sine keeps it alive. */
type WarpChar = {
  el: HTMLSpanElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  p: number;
  seed: number;
};

export function WarpText({
  lines,
  className = "",
}: {
  lines: string[];
  className?: string;
}) {
  const chars = useRef<WarpChar[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const move = (e: PointerEvent) => (mouse.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useRaf(
    (t) => {
      for (const c of chars.current) {
        if (!c || !c.el) continue;
        const r = c.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mouse.current.x - cx;
        const dy = mouse.current.y - cy;
        const d = Math.hypot(dx, dy);
        const prox = clamp(1 - d / 270, 0, 1);
        const idle = Math.sin(t * 0.0011 + c.seed) * 2.2;
        const tx = dx * prox * 0.16;
        const ty = dy * prox * 0.16 + idle;
        c.vx += (tx - c.x) * 0.085;
        c.vx *= 0.78;
        c.x += c.vx;
        c.vy += (ty - c.y) * 0.085;
        c.vy *= 0.78;
        c.y += c.vy;
        const tw = 340 + prox * 520;
        c.w += (tw - c.w) * 0.12;
        c.p += (prox - c.p) * 0.14;
        c.el.style.transform = `translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,0) rotate(${(Math.sin(c.seed) * prox * 5).toFixed(2)}deg)`;
        c.el.style.fontVariationSettings = `"wght" ${Math.round(c.w)}`;
        c.el.style.setProperty("--p", c.p.toFixed(3));
      }
    },
    !reduced
  );

  chars.current = [];
  let idx = 0;
  return (
    <h1 className={className} aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className="block whitespace-nowrap">
          {line.split("").map((ch) => {
            const i = idx++;
            const seed = i * 1.618;
            if (ch === " ")
              return <span key={i} className="inline-block w-[0.26em]" />;
            return (
              <span
                key={i}
                ref={(el) => {
                  chars.current[i] = chars.current[i] ?? {
                    el: null,
                    x: 0,
                    y: 0,
                    vx: 0,
                    vy: 0,
                    w: 340,
                    p: 0,
                    seed,
                  };
                  chars.current[i].el = el;
                }}
                className="relative inline-block will-change-transform"
                style={{ fontVariationSettings: '"wght" 340' }}
              >
                <span
                  aria-hidden
                  className="warp-fringe-a pointer-events-none absolute inset-0"
                  style={
                    {
                      opacity: "var(--p,0)",
                      transform:
                        "translate(calc(var(--p,0)*5px), calc(var(--p,0)*-3px))",
                    } as CSSProperties
                  }
                >
                  {ch}
                </span>
                <span
                  aria-hidden
                  className="warp-fringe-b pointer-events-none absolute inset-0"
                  style={
                    {
                      opacity: "var(--p,0)",
                      transform:
                        "translate(calc(var(--p,0)*-5px), calc(var(--p,0)*3px))",
                    } as CSSProperties
                  }
                >
                  {ch}
                </span>
                <span className="relative">{ch}</span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/* ── SMOKEY TITLE + INK BLEED ─────────────────────────────────────────
   Two stacked layers: a blurred moss "smoke" copy burns off while the
   sharp ink copy settles out of a wide letter-spacing. The wrapper runs
   through the global #ink-bleed displacement filter for frayed edges.  */
export function SmokeyTitle({
  text,
  className = "",
  light = false,
}: {
  text: string; // use \n for line breaks
  className?: string;
  light?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  const blocks = (extra: string) =>
    text.split("\n").map((ln, i) => (
      <span key={i} className={`block ${extra}`}>
        {ln}
      </span>
    ));
  return (
    <div ref={ref} className="relative" style={{ filter: "url(#ink-bleed)" }}>
      <span
        aria-hidden
        className={`absolute inset-0 transition-all duration-[1400ms] ease-out ${
          inView ? "scale-[1.005] opacity-0 blur-[3px]" : "scale-[1.08] opacity-70 blur-[20px]"
        } ${light ? "text-sage" : "text-moss"} ${className}`}
      >
        {blocks("")}
      </span>
      <h2
        className={`relative transition-all duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] ${
          inView ? "translate-y-0 tracking-normal opacity-100" : "translate-y-7 tracking-[0.32em] opacity-0"
        } ${className}`}
      >
        {blocks("")}
      </h2>
    </div>
  );
}

/* ── DUSK TEXT REVEAL ─────────────────────────────────────────────────
   Characters rise out of a blurred sage dusk into sharp ink, staggered. */
export function DuskReveal({
  text,
  className = "",
  delay = 0,
  stagger = 22,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const on = inView || reduced;
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i}> </span>
        ) : (
          <span
            key={i}
            aria-hidden
            className="inline-block will-change-transform"
            style={{
              transition: `transform .95s cubic-bezier(.22,1,.36,1) ${delay + i * stagger}ms, opacity .95s ${
                delay + i * stagger
              }ms, filter .95s ${delay + i * stagger}ms, color 1.4s ${delay + i * stagger}ms`,
              transform: on ? "none" : "translateY(78%) rotate(3deg)",
              opacity: on ? 1 : 0,
              filter: on ? "blur(0px)" : "blur(9px)",
              color: on ? undefined : "var(--color-sage)",
            }}
          >
            {ch}
          </span>
        )
      )}
    </span>
  );
}

/* ── DIRECTION-HOVER + LETTER-SWAP LINK ───────────────────────────────
   The old label exits toward the edge the cursor entered from; a ghost
   enters from the opposite side while its letters scramble-resolve.     */
const GLYPHS = "░▒▓/×+—·";

export function SwapLink({
  label,
  href,
  className = "",
  accentClass = "text-moss",
  center = false,
}: {
  label: string;
  href: string;
  className?: string;
  accentClass?: string;
  center?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [dir, setDir] = useState({ x: 0, y: 1 });
  const [ghost, setGhost] = useState(label);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    []
  );

  const scramble = () => {
    let step = 0;
    const total = 7;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      step++;
      setGhost(
        label
          .split("")
          .map((c, i) =>
            i < (step / total) * label.length ? c : GLYPHS[(i * 7 + step * 13) % GLYPHS.length]
          )
          .join("")
      );
      if (step >= total) {
        if (timer.current) window.clearInterval(timer.current);
        setGhost(label);
      }
    }, 34);
  };

  const enter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d =
      Math.abs(dx) > Math.abs(dy)
        ? { x: (Math.sign(dx) || 1) as number, y: 0 }
        : { x: 0, y: (Math.sign(dy) || 1) as number };
    setDir(d);
    setHover(true);
    scramble();
  };

  const ease = "transform .5s cubic-bezier(.22,1,.36,1)";
  return (
    <a
      href={href}
      onMouseEnter={enter}
      onMouseLeave={() => setHover(false)}
      className={`relative inline-flex overflow-hidden ${className}`}
    >
      <span
        className="block transition-transform"
        style={{
          transition: ease,
          transform: hover ? `translate(${dir.x * 112}%, ${dir.y * 135}%)` : "none",
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center ${center ? "justify-center" : "justify-start"} ${accentClass}`}
        style={{
          transition: ease,
          transform: hover ? "none" : `translate(${-dir.x * 112}%, ${-dir.y * 135}%)`,
        }}
      >
        {ghost}
      </span>
    </a>
  );
}
