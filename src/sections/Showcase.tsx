/* ════════════════════════════════════════════════════════════════════
   SHOWCASE SECTIONS — 02 Reel (liquid video placeholders)
                       03 Frames (coverflow + magnetic dock)
                       04 Disciplines (hover-reveal list)
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";
import { DISCIPLINES, FRAMES, VIDEOS } from "../data";
import { Coverflow, HoverList, MagneticDock } from "../fx/carousels";
import { LiquidVideo } from "../fx/liquidVideo";
import { DuskReveal, SmokeyTitle } from "../fx/text";
import { clamp, useIsTouchMobile } from "../fx/util";
import { SectionTag } from "./Core";

/* ── 02 · REEL — the two rendered-film slots ─────────────────────────── */
export function Reel() {
  const touch = useIsTouchMobile();
  const figRefs = useRef<Array<HTMLElement | null>>([]);

  /* mobile-only: gentle clamped parallax on the film cards while scrolling */
  useEffect(() => {
    if (!touch) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      for (const el of figRefs.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2 - window.innerHeight / 2;
        const y = clamp(-mid * 0.04, -10, 10);
        el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [touch]);

  return (
    <section id="reel" className="relative scroll-mt-24 bg-abyss px-5 py-28 text-cream md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px] 2xl:max-w-[1760px]">
        <SectionTag n="02" label="Reel — two weathers" light />
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SmokeyTitle
            light
            text={"TWO RENDERS,\nTWO WEATHERS"}
            className="font-display text-[clamp(2.6rem,5.6vw,5.6rem)] leading-[1.02] text-cream"
          />
          <DuskReveal
            stagger={6}
            text="Two flagship environment films — atmosphere, fog and cinematic lighting, rendered in Unreal Engine 5."
            className="block max-w-xs pb-2 text-xs uppercase leading-loose tracking-[0.16em] text-cream/60"
          />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {VIDEOS.map((v, i) => (
            <figure
              key={v.id}
              ref={(el) => {
                figRefs.current[i] = el;
              }}
              className="will-change-transform"
            >
              <LiquidVideo
                poster={v.poster}
                video={v.video}
                eyebrow={`${v.id} · ${v.meta}`}
                resolution={7}
                cursorSize={60}
                intensity={55}
              />
              <figcaption className="mt-6 flex items-start justify-between gap-6">
                <div>
                  <p className="flex items-baseline gap-3 font-display text-2xl md:text-4xl">
                    <span className="tnum font-body text-[10px] tracking-[0.3em] text-sage">{v.id}</span>
                    {v.title}
                  </p>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-cream/65">{v.sub}</p>
                </div>
                <p className="max-w-[150px] pt-1 text-right text-[9px] uppercase leading-loose tracking-[0.2em] text-cream/65 md:max-w-[180px]">
                  {v.tech}
                </p>
              </figcaption>

              {v.role && (
                <div className="mt-6 border-t border-cream/10 pt-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-cream/65">
                    ROLE — <span className="text-sage">{v.role}</span>
                  </p>
                  {v.tools && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {v.tools.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-cream/20 bg-cream/[0.04] px-3 py-1 text-[9px] tracking-[0.2em] text-cream/75 transition-colors duration-300 hover:border-sage/60 hover:text-cream"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {v.contribution && (
                    <p className="mt-4 text-xs leading-relaxed text-cream/70">{v.contribution}</p>
                  )}
                  {v.notes && (
                    <p className="mt-4 border-l-2 border-sage/60 pl-3 text-[10px] uppercase leading-loose tracking-[0.16em] text-cream/65">
                      {v.notes}
                    </p>
                  )}
                </div>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 03 · FRAMES — coverflow + magnetic dock ─────────────────────────── */
export function Frames() {
  return (
    <section id="frames" className="relative scroll-mt-24 overflow-hidden px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px] 2xl:max-w-[1760px]">
        <SectionTag n="03" label="Selected frames — environment studies" />
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SmokeyTitle
            text={"FRAMES FROM\nOTHER WORLDS"}
            className="font-display text-[clamp(2.6rem,5.6vw,5.6rem)] leading-[1.02] text-ink"
          />
          <p className="tnum max-w-xs pb-3 text-[10px] uppercase leading-loose tracking-[0.2em] text-ink/55">
            06 STUDIES — LIGHT · WEATHER · OVERGROWTH
          </p>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
          Blockouts, dressing passes and volumetric atmosphere — each frame a study in light, weather and overgrowth.
        </p>
        <div className="mt-14">
          <Coverflow items={FRAMES} />
        </div>
        <div className="mt-28">
          <MagneticDock items={FRAMES} />
        </div>
      </div>
    </section>
  );
}

/* ── 04 · DISCIPLINES — cursor-following hover list ──────────────────── */
export function Disciplines() {
  return (
    <section id="disciplines" className="relative scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px] 2xl:max-w-[1760px]">
        <SectionTag n="04" label="Disciplines — hover to preview" />
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SmokeyTitle
            text={"WHAT I DO"}
            className="font-display text-[clamp(2.6rem,6.5vw,6.5rem)] leading-[1.02] text-ink"
          />
          <p className="max-w-xs pb-3 text-[10px] uppercase leading-loose tracking-[0.2em] text-ink/55">
            ENVIRONMENTS · LEVEL DESIGN · LIGHTING · BIOMES · CINEMATICS
          </p>
        </div>
        <div className="mt-14">
          <HoverList items={DISCIPLINES} />
        </div>
      </div>
    </section>
  );
}
