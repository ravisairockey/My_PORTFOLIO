/* ════════════════════════════════════════════════════════════════════
   CAROUSELS — Coverflow · HoverList (cursor-follow reveals) · MagneticDock
   ════════════════════════════════════════════════════════════════════ */
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DISCIPLINES, FRAMES } from "../data";
import { clamp, useRaf } from "./util";

type Frame = (typeof FRAMES)[number];
type Discipline = (typeof DISCIPLINES)[number];

/* ── 10 · COVERFLOW CAROUSEL ──────────────────────────────────────────
   3D rail: drag, arrow keys, buttons. Center card full — neighbours
   recede with translateZ/rotateY and an ink dimmer.                    */
export function Coverflow({ items }: { items: Frame[] }) {
  const [idx, setIdx] = useState(2);
  const [drag, setDrag] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const eff = idx - drag;
  const clampIdx = (v: number) => clamp(Math.round(v), 0, items.length - 1);
  const go = (v: number) => setIdx(clampIdx(v));
  const active = items[clampIdx(eff)];

  return (
    <div
      className="relative select-none outline-none"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected frames — coverflow"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(idx - 1);
        if (e.key === "ArrowRight") go(idx + 1);
      }}
    >
      <div
        className="relative h-[54vh] min-h-[340px] touch-pan-y [perspective:1400px]"
        onPointerDown={(e) => {
          dragging.current = true;
          startX.current = e.clientX;
          startY.current = e.clientY;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          if (Math.abs(e.clientX - startX.current) > Math.abs(e.clientY - startY.current))
            setDrag((e.clientX - startX.current) / 240);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          go(idx - drag);
          setDrag(0);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDrag(0);
        }}
      >
        {items.map((f, i) => {
          const off = i - eff;
          const ab = Math.abs(off);
          const style: CSSProperties = {
            transform: `translate(-50%,-50%) translateX(${off * 52}%) translateZ(${-ab * 185}px) rotateY(${clamp(-off * 32, -48, 48)}deg) scale(${Math.max(0.55, 1 - ab * 0.08)})`,
            zIndex: Math.round(100 - ab * 10),
            opacity: ab > 3.4 ? 0 : 1 - ab * 0.15,
            transition: dragging.current
              ? "none"
              : "transform .75s cubic-bezier(.22,1,.36,1), opacity .5s ease",
          };
          return (
            <figure
              key={f.code}
              onClick={() => go(i)}
              className="absolute left-1/2 top-1/2 aspect-[3/2] w-[86vw] cursor-pointer overflow-hidden rounded-xl border border-ink/10 shadow-[0_35px_60px_-25px_rgba(20,23,15,.5)] md:h-full md:w-auto"
              style={style}
            >
              <img
                src={f.src}
                alt={`${f.title} — ${f.meta}`}
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 transition-colors"
                style={{ background: `rgba(20,23,15,${Math.min(0.6, ab * 0.3)})` }}
              />
              <figcaption className="absolute bottom-3 left-4 rounded bg-abyss/55 px-2 py-1 text-[10px] tracking-[0.35em] text-cream backdrop-blur-sm">
                {f.code}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* caption + controls */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px]">
          <p className="font-display text-2xl md:text-3xl">{active.title}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink/55">{active.meta}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="mr-2 text-[10px] tracking-[0.3em] text-ink/50">
            {String(clampIdx(eff) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
          <button
            onClick={() => go(idx - 1)}
            aria-label="Previous frame"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 transition-all duration-300 hover:bg-ink hover:text-cream active:scale-90"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(idx + 1)}
            aria-label="Next frame"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 transition-all duration-300 hover:bg-ink hover:text-cream active:scale-90"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 11 · HOVER IMAGE REVEAL LIST ───────────────────────────────────── */
const WASHES = ["#EED3D966", "#B5C0D066", "#A2B38B66", "#EED3D966", "#B5C0D066"];

export function HoverList({ items }: { items: Discipline[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useRaf(() => {
    const p = pos.current;
    const vx = p.tx - p.x;
    p.x += vx * 0.12;
    p.y += (p.ty - p.y) * 0.12;
    const el = floatRef.current;
    if (el)
      el.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50%,-58%) rotate(${clamp(vx * 0.05, -7, 7)}deg) scale(${active >= 0 ? 1 : 0.92})`;
  });

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseMove={(e) => {
        const r = wrapRef.current!.getBoundingClientRect();
        pos.current.tx = e.clientX - r.left;
        pos.current.ty = e.clientY - r.top;
      }}
      onMouseLeave={() => setActive(-1)}
    >
      {/* cursor-following preview */}
      <div
        ref={floatRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-20 hidden h-[190px] w-[300px] overflow-hidden rounded-xl border border-ink/15 shadow-[0_30px_60px_-20px_rgba(20,23,15,.55)] transition-opacity duration-300 md:block"
        style={{ opacity: active >= 0 ? 1 : 0 }}
      >
        {active >= 0 && (
          <img
            key={active}
            src={items[active].img}
            alt=""
            className="h-full w-full object-cover"
            style={{ animation: "hl-swap .55s cubic-bezier(.22,1,.36,1) both" }}
          />
        )}
        <span className="absolute bottom-2 left-3 rounded bg-abyss/55 px-2 py-0.5 text-[9px] tracking-[0.3em] text-cream backdrop-blur-sm">
          {active >= 0 ? items[active].n : ""}
        </span>
      </div>
      <style>{`@keyframes hl-swap { from { opacity: 0; transform: scale(1.1); } to { opacity: 1; transform: scale(1); } }`}</style>

      {items.map((d, i) => (
        <div
          key={d.n}
          onMouseEnter={() => setActive(i)}
          className="group relative flex cursor-pointer items-end justify-between gap-6 border-t border-ink/15 px-2 py-8 transition-colors md:py-10"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-y-100"
            style={{ background: WASHES[i % WASHES.length] }}
          />
          <div className="flex items-baseline gap-5 md:gap-9">
            <span className="text-[10px] tracking-[0.35em] text-ink/45">{d.n}</span>
            <h3
              className="vfont font-display text-3xl leading-none transition-all duration-500 group-hover:translate-x-4 group-hover:text-moss md:text-6xl"
              style={{ "--w": active === i ? 850 : 420 } as CSSProperties}
            >
              {d.title}
            </h3>
          </div>
          <p className="hidden max-w-[230px] px-2 text-right text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink/55 md:block">
            {d.meta}
          </p>
        </div>
      ))}
      <div className="border-t border-ink/15" />
    </div>
  );
}

/* ── 12 · MAGNETIC DOCK CAROUSEL ──────────────────────────────────────
   macOS-dock magnification: per-bar weights ease toward a gaussian of
   cursor distance; row width always fills 100%. Click → large square.  */
export function MagneticDock({ items }: { items: Frame[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const weights = useRef<number[]>(items.map(() => 1));
  const height = useRef(220);
  const mouse = useRef({ x: -9999, inside: false });
  const [expanded, setExpanded] = useState(-1);

  useRaf(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const n = items.length;
    const GAP = 12;
    const sigma = 150;
    const targets: number[] = [];
    for (let i = 0; i < n; i++) {
      if (expanded >= 0) targets.push(i === expanded ? 5.4 : 0.6);
      else if (!mouse.current.inside) targets.push(1);
      else {
        const er = itemRefs.current[i]?.getBoundingClientRect();
        const cx = er ? er.left + er.width / 2 : r.left + ((i + 0.5) * r.width) / n;
        const d = Math.abs(mouse.current.x - cx);
        targets.push(1 + 1.2 * Math.exp(-(d * d) / (2 * sigma * sigma)));
      }
    }
    let sum = 0;
    for (let i = 0; i < n; i++) {
      weights.current[i] += (targets[i] - weights.current[i]) * 0.15;
      sum += weights.current[i];
    }
    const avail = r.width - GAP * (n - 1);
    let expW = 0;
    for (let i = 0; i < n; i++) {
      const w = (avail * weights.current[i]) / sum;
      if (i === expanded) expW = w;
      const el = itemRefs.current[i];
      if (el) el.style.width = `${w.toFixed(1)}px`;
    }
    const targetH = expanded >= 0 ? Math.min(expW, 500) : 220;
    height.current += (targetH - height.current) * 0.12;
    wrap.style.height = `${height.current.toFixed(1)}px`;
    wrap.style.alignItems = expanded >= 0 ? "flex-start" : "stretch";
  });

  return (
    <div>
      <div
        ref={wrapRef}
        className="flex gap-3 overflow-visible"
        style={{ height: 220 }}
        onMouseMove={(e) => {
          mouse.current.x = e.clientX;
          mouse.current.inside = true;
        }}
        onMouseLeave={() => (mouse.current.inside = false)}
      >
        {items.map((f, i) => (
          <button
            key={f.code}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            onClick={() => setExpanded(expanded === i ? -1 : i)}
            aria-expanded={expanded === i}
            aria-label={`${f.title} — ${expanded === i ? "collapse" : "expand"}`}
            className="group relative min-w-0 shrink-0 grow-0 basis-auto overflow-hidden rounded-xl border border-ink/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
            style={{ transition: "border-color .3s" }}
          >
            <img
              src={f.src}
              alt={f.title}
              draggable={false}
              className={`h-full w-full object-cover transition-transform duration-700 ${
                expanded === i ? "" : "group-hover:scale-105"
              }`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/75 via-transparent to-transparent" />
            {expanded === i ? (
              <span className="absolute bottom-4 left-4 right-4 text-cream">
                <span className="block font-display text-xl md:text-2xl">{f.title}</span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-cream/75">
                  {f.meta}
                </span>
                <span className="mt-2 block text-[8px] tracking-[0.35em] text-cream/50">
                  CLICK AGAIN TO DOCK
                </span>
              </span>
            ) : (
              <span className="absolute left-2 top-2 rounded bg-abyss/55 px-2 py-1 text-[9px] tracking-[0.3em] text-cream backdrop-blur-sm">
                {f.code}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[9px] uppercase tracking-[0.35em] text-ink/45">
        Magnetic Carousel — hover to magnify · click to expand
      </p>
    </div>
  );
}
