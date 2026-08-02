/* ════════════════════════════════════════════════════════════════════
   AFTERGARDEN — Ravi Sai Vigneswara · portfolio
   Composition: global FX layers (bg grid, click bursts, grain)
   + Nav + sections. All content lives in src/data.ts.
   ════════════════════════════════════════════════════════════════════ */
import { ClickFX, KineticGrid } from "./fx/canvas";
import { Contact, Footer, Hero, Nav, Origin, Toolkit } from "./sections/Core";
import { Disciplines, Frames, Reel } from "./sections/Showcase";

/** Global SVG machinery — the ink-bleed displacement filter used by
    every SmokeyTitle (feTurbulence + feDisplacementMap). */
function SvgDefs() {
  return (
    <svg aria-hidden className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <filter id="ink-bleed" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen font-body text-ink">
      <SvgDefs />
      {/* print-style film grain over everything */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[55] opacity-[0.05]" />
      {/* global cursor-reactive lattice + click micro-interactions */}
      <KineticGrid />
      <ClickFX />

      <Nav />
      <main className="relative z-10">
        <Hero />
        <Origin />
        <Reel />
        <Frames />
        <Disciplines />
        <Toolkit />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
