/* ════════════════════════════════════════════════════════════════════
   CORE SECTIONS — Nav · Hero · 01 Origin · 05 Toolkit · 06 Contact · Footer
   (Reel/Frames/Disciplines live in Showcase.tsx)
   ════════════════════════════════════════════════════════════════════ */
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Boxes,
  Cpu,
  Droplets,
  Gamepad2,
  GitBranch,
  Layers,
  Mountain,
  Palette,
} from "lucide-react";
import {
  FACTS,
  MARKERS,
  NAV_LINKS,
  PROFILE,
  SOCIALS,
  TOOLS,
} from "../data";
import { DotGlobe, ReactiveGrid, WaveArcs } from "../fx/canvas";
import { BlobReveal, PeelSticker } from "../fx/media";
import { DuskReveal, SmokeyTitle, SwapLink, WarpText } from "../fx/text";

/* lucide icon registry for TOOLS[].icon keys */
const ICONS: Record<string, ReactNode> = {
  Boxes: <Boxes />,
  Gamepad2: <Gamepad2 />,
  Layers: <Layers />,
  Droplets: <Droplets />,
  Mountain: <Mountain />,
  Cpu: <Cpu />,
  Palette: <Palette />,
  GitBranch: <GitBranch />,
};

/* Numbered section header — the "field journal" spine */
export function SectionTag({
  n,
  label,
  light = false,
}: {
  n: string;
  label: string;
  light?: boolean;
}) {
  return (
    <div className={`mb-12 flex items-center gap-4 ${light ? "text-cream" : "text-ink"}`}>
      <span
        className={`rounded-md border px-2.5 py-1 text-[10px] tracking-[0.3em] ${
          light ? "border-cream/30 bg-cream/10" : "border-ink/25 bg-ink/5"
        }`}
      >
        {n}
      </span>
      <span className={`h-px flex-1 ${light ? "bg-cream/20" : "bg-ink/15"}`} />
      <span className="text-[9px] uppercase tracking-[0.42em] opacity-60">{label}</span>
    </div>
  );
}

/* ── NAV — glass pill + direction-swap links ─────────────────────────── */
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage font-display text-xs font-bold tracking-tight text-ink shadow-[0_10px_24px_-12px_rgba(20,23,15,.5)] transition-transform duration-500 group-hover:rotate-[-8deg]">
            RSV
          </span>
          <span className="hidden text-[9px] uppercase leading-relaxed tracking-[0.3em] text-ink/60 sm:block">
            Ravi Sai
            <br />
            Vigneswara
          </span>
        </a>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 rounded-full border border-ink/10 bg-cream/75 px-8 py-3.5 shadow-[0_16px_40px_-24px_rgba(20,23,15,.4)] backdrop-blur-md lg:flex">
          {NAV_LINKS.map((l) => (
            <SwapLink
              key={l.href}
              label={l.label}
              href={l.href}
              center
              className="text-[10px] tracking-[0.28em] text-ink/80"
              accentClass="text-moss"
            />
          ))}
        </nav>

        <a
          href="#contact"
          className="flex items-center gap-2.5 rounded-full border border-ink/15 bg-cream/75 px-5 py-3 text-[9px] tracking-[0.25em] backdrop-blur-md transition-all duration-300 hover:bg-ink hover:text-cream active:scale-95"
        >
          <span className="anim-pulse-dot h-1.5 w-1.5 rounded-full bg-moss" />
          OPEN FOR WORK
        </a>
      </div>
    </header>
  );
}

/* ── HERO — mesh name, dusk standfirst, marquee, spin badge ─────────── */
const MARQUEE =
  "OVERGROWN WORLDS · TIDAL LIGHT · LEVEL DESIGN · CINEMATIC MOOD · VEGETATION SYSTEMS · ";

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-end overflow-hidden pt-32">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <DuskReveal
          text="PORTFOLIO ’26 — KARNATAKA, INDIA · ENVIRONMENT ARTIST & GAME DESIGNER"
          className="block text-[10px] tracking-[0.42em] text-ink/60"
        />

        <WarpText
          lines={[PROFILE.lineA, PROFILE.lineB]}
          className="mt-8 font-display leading-[0.88] tracking-tight text-ink text-[clamp(3.1rem,11.5vw,10.5rem)]"
        />

        <div className="mt-12 flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <DuskReveal
            text="I build worlds after the end — overgrown ruins, tidal light, and everything the apocalypse forgot to take."
            delay={150}
            className="block max-w-md font-display text-xl italic leading-relaxed text-ink/75 md:text-2xl"
          />
          <ul className="flex max-w-md flex-wrap gap-2">
            {["AGE — 21", "INDIAN · KARNATAKA", "UTC +5:30", "BA COMM. DESIGN — GAME ARTS", "UNREAL · NIAGARA VFX"].map(
              (chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-ink/15 bg-paper/70 px-4 py-2 text-[9px] tracking-[0.22em] text-ink/70 backdrop-blur-sm"
                >
                  {chip}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="mb-16 mt-12 flex flex-wrap items-center gap-4 md:mb-20">
          <a
            href="#reel"
            className="group inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-[10px] tracking-[0.3em] text-cream transition-all duration-300 hover:bg-moss active:scale-95"
          >
            WATCH THE REELS
            <ArrowDown className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-1" />
          </a>
          <a
            href="#origin"
            className="group inline-flex items-center gap-3 rounded-full border border-ink/25 px-8 py-4 text-[10px] tracking-[0.3em] text-ink transition-all duration-300 hover:bg-blush hover:border-blush active:scale-95"
          >
            FIELD NOTES — 01
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
          </a>
        </div>
      </div>

      {/* rotating circular badge */}
      <div className="absolute bottom-[38vh] right-10 hidden lg:block xl:right-20">
        <div className="relative h-28 w-28">
          <svg className="anim-spin-slow h-full w-full" viewBox="0 0 120 120" aria-hidden>
            <defs>
              <path id="badge-circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
            </defs>
            <text className="fill-ink/60 uppercase" style={{ fontSize: 10.5, letterSpacing: 2.4 }}>
              <textPath href="#badge-circ">Unreal Engine · Level Design · World Building ·</textPath>
            </text>
          </svg>
          <ArrowDown className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-ink/60" />
        </div>
      </div>

      {/* outlined marquee strip */}
      <div className="relative overflow-hidden border-y border-ink/10 py-5">
        <div className="anim-marquee flex w-max">
          {[0, 1].map((k) => (
            <span
              key={k}
              aria-hidden={k === 1}
              className="text-outline whitespace-nowrap font-display text-[clamp(1.8rem,4.5vw,4rem)] leading-none"
            >
              {MARQUEE}
              {MARQUEE}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 01 · ORIGIN — fact table + blob-reveal portrait ─────────────────── */
export function Origin() {
  return (
    <section id="origin" className="relative scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px]">
        <SectionTag n="01" label="Origin — the overgrown brief" />
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SmokeyTitle
              text={"DESIGN BA,\nBUILT IN ENGINES"}
              className="font-display text-[clamp(2.6rem,5.6vw,5.6rem)] leading-[1.02] text-ink"
            />
            <DuskReveal
              stagger={5}
              text="I’m Ravi — a 21-year-old environment artist and game designer from Karnataka, India. I studied Communication Design (Game Arts & Design) at Jain University, CCAD, and taught myself the engines the hard way: by shipping scenes. I build worlds in Unreal Engine — dressing environments, crafting fog and mood, driving Niagara VFX, and shooting cinematic renders — and develop in Unity."
              className="mt-9 block max-w-xl text-base leading-relaxed text-ink/75 md:text-lg"
            />

            {/* fact table — straight from the brief */}
            <div className="mt-14 border-t border-ink/10">
              {FACTS.map(([k, v]) => (
                <div
                  key={k}
                  className="group grid grid-cols-[128px_1fr] gap-4 border-b border-ink/10 py-4 sm:grid-cols-[220px_1fr]"
                >
                  <span className="pt-1 text-[9px] uppercase tracking-[0.28em] text-ink/45">{k}</span>
                  <span className="font-display text-base transition-all duration-300 group-hover:translate-x-2 group-hover:text-moss md:text-lg">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <BlobReveal src="img/g-forest.jpg" alt="Field reference — Biolume Grove environment study" ratio="4 / 5" className="rounded-2xl shadow-[0_40px_70px_-30px_rgba(20,23,15,.5)]">
              <span className="absolute bottom-4 left-4 rounded-md bg-abyss/55 px-3 py-1.5 text-[9px] tracking-[0.3em] text-cream backdrop-blur-sm">
                FIELD REF — BIOLUME GROVE · FLUID IMAGE REVEAL
              </span>
            </BlobReveal>
            <div className="mt-6 rounded-xl border border-dashed border-ink/25 p-5 text-[10px] uppercase leading-loose tracking-[0.2em] text-ink/55">
              <p>▸ FOCUS — ENVIRONMENT ART · NIAGARA VFX · CINEMATIC RENDERS</p>
              <p>▸ LEARNING MODE — SELF-DIRECTED · PROJECT-BASED</p>
              <p>▸ ENGINES — UNREAL ENGINE · UNITY · BLENDER</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 05 · TOOLKIT — sticker peel on reactive grid ────────────────────── */
export function Toolkit() {
  return (
    <section id="toolkit" className="relative scroll-mt-24 px-5 py-28 md:px-10 md:py-40">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] border border-ink/10 bg-mist/25 px-6 py-16 md:p-16">
        <ReactiveGrid />
        <div className="relative">
          <SectionTag n="05" label="Toolkit — peel the stack" />
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SmokeyTitle
              text={"TOOLS I\nTHINK IN"}
              className="font-display text-[clamp(2.6rem,5.6vw,5.6rem)] leading-[1.02] text-ink"
            />
            <p className="max-w-xs pb-3 text-[10px] uppercase leading-loose tracking-[0.2em] text-ink/55">
              MY DAY-TO-DAY PIPELINE — FROM BLOCKOUT TO CINEMATIC RENDER
            </p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3">
            {TOOLS.map((t) => (
              <PeelSticker key={t.name} icon={ICONS[t.icon]} name={t.name} meta={t.meta} tone={t.tone} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 06 · CONTACT — dot globe + wave arcs + big swap links ───────────── */
export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden bg-abyss px-5 py-28 text-cream md:px-10 md:py-40">
      <WaveArcs />
      <div className="relative mx-auto max-w-[1440px]">
        <SectionTag n="06" label="Coordinates — say hello" light />
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <DotGlobe markers={MARKERS} />
            <p className="mt-6 text-[10px] tracking-[0.32em] text-cream/50">
              12.9716° N · 77.5946° E — KARNATAKA, INDIA · DRAG TO SPIN
            </p>
          </div>
          <div>
            <SmokeyTitle
              light
              text={"LET’S BUILD\nSTRANGE WORLDS"}
              className="font-display text-[clamp(2.6rem,5.4vw,5.2rem)] leading-[1.02] text-cream"
            />
            <DuskReveal
              stagger={6}
              text="Internships, junior environment-art roles, indie collaborations — if your world needs overgrowth and weather, my inbox is open."
              className="mt-8 block max-w-md text-base leading-relaxed text-cream/70"
            />
            <SwapLink
              label={PROFILE.email}
              href={`mailto:${PROFILE.email}`}
              className="mt-12 font-display text-[clamp(1.3rem,3vw,2.4rem)] text-cream"
              accentClass="text-sage"
            />
            <div className="mt-12 flex flex-wrap gap-x-9 gap-y-4 border-t border-cream/10 pt-8">
              {SOCIALS.map((s) => (
                <SwapLink
                  key={s.label}
                  label={s.label}
                  href={s.href}
                  className="text-[10px] tracking-[0.3em] text-cream/85"
                  accentClass="text-blush"
                />
              ))}
            </div>
            <div className="mt-10 flex items-center gap-4 rounded-xl border border-dashed border-cream/25 p-5">
              <span className="anim-pulse-dot h-2 w-2 shrink-0 rounded-full bg-sage" />
              <p className="text-[10px] uppercase tracking-[0.24em] text-cream/70">{PROFILE.availability}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ──────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="relative z-10 bg-abyss px-5 pb-10 text-cream md:px-10">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-8 text-[9px] uppercase tracking-[0.3em] text-cream/50">
        <span className="tracking-[0.24em]">©26 • RAVI • SAI • VIGNESWARA — AMIL'S UNIVERSE</span>
        <a
          href="#top"
          className="group inline-flex items-center gap-2 transition-colors hover:text-sage"
        >
          BACK TO TOP
          <ArrowUp className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-1" />
        </a>
      </div>
    </footer>
  );
}
