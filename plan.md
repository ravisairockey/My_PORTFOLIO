# PLAN.md — **AFTERGARDEN**
### Portfolio for **Ravi Sai Vigneswara** — Environment Artist · Game Designer
*A premium single-page portfolio: paper-cream canvas, ink typography, and a full WebGL/canvas FX suite built around your two Unreal Engine renders.*

> **Status:** v1.0 — structure + FX implemented, two video slots awaiting your renders.
> **Stack:** React 19 · TypeScript · Vite 7 · Tailwind CSS v4 · hand-rolled WebGL / Canvas 2D · zero heavy 3D deps.
> **Hosting target:** GitHub Pages (guide in §10 — about 5 minutes, free).

---

## 0 · TL;DR — SHIP IT IN 3 COMMANDS

```bash
npm install        # once
npm run build      # → dist/  (single self-contained index.html + /img + /videos)
# then push to GitHub and turn on Pages — full walkthrough in §10.
```

Drop your two renders here and you're done — no code changes needed:

```
public/videos/ruins.mp4    ← ASHFALL · post-apocalyptic vegetation city ruins
public/videos/beach.mp4    ← TIDELINE · realistic cinematic beach coastal
```

The site auto-detects them: until then each slot plays its poster through the
**Liquid Distortion** shader with an “awaiting render” badge; the moment the
file exists, the same slot becomes a liquid-distorted looping video. (§7)

---

## 1 · BRIEF & GOALS

| | |
|---|---|
| **Client** | Ravi Sai Vigneswara (self) |
| **Product** | Personal portfolio landing page / digital business card |
| **Audience** | Game studios, environment-art leads, indie teams, internship coordinators |
| **Job to do** | Prove “junior but serious”: art direction, engine literacy, taste |
| **Tone** | Premium editorial “field journal” — ink on cream paper, botanical + coastal |
| **Mandates** | Palette `A2B38B · EED3D9 · B5C0D0 · F5E8DD` · 2 video placeholders · named FX suite · GitHub-hostable · annotated |

**Success criteria**
1. Feels like a ₹/$1,000 studio site, not a template.
2. Every named effect from the brief is present and tuned (§6 matrix).
3. Video swap = file copy, zero code edits.
4. `npm run build` → deployable `dist/` on GitHub Pages in <5 min.
5. 60 fps on a mid laptop, `prefers-reduced-motion` respected, graceful fallbacks.

**Non-goals (v1):** CMS, blog, multi-page routing, backend/form service
(contact is `mailto:` + socials), 3D model viewer.

---

## 2 · PERSONA SNAPSHOT *(content source — verbatim from the brief)*

| Field | Value |
|---|---|
| **Full Name** | Ravi Sai Vigneswara |
| **Age** | 20 years |
| **Nationality** | Indian |
| **Location** | Karnataka, India |
| **Education** | BA in Communication Design (3-year program) |
| **Institution** | Jain University — CCAD |
| **Specialization** | Game Arts and Design |
| **Learning Mode** | Self-directed, project-based |
| **Game Engines** | Unity (primary development) · Unreal Engine (level design) |

Rendered as the **01 · ORIGIN** fact table + hero meta chips. Edit in `src/data.ts → FACTS`.

---

## 3 · DESIGN SYSTEM

### 3.1 Colour tokens *(all brief-mandated + derived inks)*

| Token | Hex | Role | Usage budget |
|---|---|---|---|
| `cream` | `#F5E8DD` | **Canvas** — page background, paper surfaces | ~55% |
| `sage` | `#A2B38B` | **Primary accent** — overgrowth, links, markers, selection | ~15% |
| `blush` | `#EED3D9` | **Warm accent** — hover washes, sticker backs, dusk | ~10% |
| `mist` | `#B5C0D0` | **Cool accent** — coastal/water cues, fringe cycling | ~8% |
| `clay` | `#C9A5A0` | Derived — fourth fringe tone, sticker tones | ~4% |
| `moss` | `#5C6B48` | Derived — dark botanical text accents | ~4% |
| `ink` | `#22251B` | Derived — primary text, strokes, outlines | text |
| `abyss` | `#14170F` | Derived — cinema sections (REEL, CONTACT) | ~4% |

Live tokens: `@theme` in `src/index.css`, mirrored in `src/data.ts → PALETTE` for canvas/WebGL use.
Rule: **accents never touch accents** — always separated by cream or ink.

### 3.2 Typography

| Face | Axes loaded | Role |
|---|---|---|
| **Fraunces** (Google) | `wght 100–900`, `opsz 9–144`, italic | Display — powers **Dynamic Weight** + **Mesh Text** (`font-variation-settings`) |
| **Space Grotesk** | `wght 300–700` | UI, labels, annotation mono (uppercase + tracking) |

Scale: hero `clamp(3.5rem → 9.5rem)` · section titles `clamp(2.5rem → 5.5rem)` · body `1rem/1.65` · annotations `0.65rem` caps.

### 3.3 Texture & shape language
- 1px `ink/10` hairlines; radii `12–24px`; dashed-line “field note” callouts.
- Film-grain overlay (SVG turbulence, multiply, 5%) for the premium print feel.
- Ink-bleed edges on display titles via SVG `feTurbulence` + `feDisplacementMap`.

### 3.4 Motion principles
- Spring easing `cubic-bezier(.2,1.4,.3,1)` for UI; `.9s cubic-bezier(.22,1,.36,1)` for reveals.
- Everything cursor-reactive **lerps** (no snapping); idle drift keeps the page alive on touch devices.
- Every canvas pauses off-screen (`IntersectionObserver`) and on `visibilitychange`.

---

## 4 · INFORMATION ARCHITECTURE

| # | ID | Section | Surface | Signature FX |
|---|---|---|---|---|
| — | nav | Fixed nav | glass cream | Direction-hover **Letter-Swap** links |
| — | hero | Name + role | cream | **Mesh Text** (warp + chromatic fringe), Dusk reveal, marquee |
| 01 | `#origin` | About / fact table | cream | **Smokey-ink titles**, **Fluid Image Reveal** blob |
| 02 | `#reel` | Two render slots | **abyss** | **Liquid Distortion** WebGL video placeholders |
| 03 | `#frames` | Gallery | abyss→cream | **Coverflow Carousel** + **Magnetic Dock Carousel** |
| 04 | `#disciplines` | What I do | cream | **Hover Image Reveal** list |
| 05 | `#toolkit` | Tech stack | mist panel | **Sticker Peel** badges on **Reactive Grid** |
| 06 | `#contact` | Globe + contact | **abyss** | **3D Dot Globe** + **Wave Arcs** field |
| — | global | — | — | **Kinetic Grid** cursor background · **ClickFX** burst on every click · grain |

---

## 5 · SECTION-BY-SECTION SPEC

### NAV (`src/sections/Core.tsx → Nav`)
- Left: monogram `RSV®` + availability dot (pulsing sage) · Right: SwapLinks.
- Hover = **direction-aware slide** (enters from the edge the cursor came from) + **letter scramble** resolving left→right.

### HERO
- Eyebrow: *PORTFOLIO ’26 — KARNATAKA, INDIA · ENVIRONMENT ARTIST & GAME DESIGNER*.
- **Mesh Text** headline: `RAVI SAI` / `VIGNESWARA` — letters are dragged toward the cursor on springs, weight swells `300→860`, chromatic fringes cycle sage→mist→clay and clay→sage→blush.
- Dusk-reveal standfirst; fact chips (AGE 20 · IN · UTC +5:30 · BA GAME ARTS).
- Rotating circular badge `UNREAL ENGINE · LEVEL DESIGN · WORLD BUILDING ·`; outlined marquee strip bottom.

### 01 · ORIGIN
- Left: SmokeyTitle + bio paragraph + the §2 fact table (hairline rows).
- Right: **Fluid Image Reveal** (organic blob clip dissolves open on scroll) + caption chip *FIELD REF — BIOLUME GROVE*.

### 02 · REEL  *(the centerpiece)*
Dark abyss surface. Two `LiquidMedia` slots (§7 contract):

```
[ RR-01 ASHFALL ]   post-apocalyptic vegetation city ruins
[ RR-02 TIDELINE ]  realistic cinematic beach coastal
```
Cursor movement paints fluid ripples into the image/video with chromatic
fringing; beneath, a dashed “field note” lists the exact drop-in filenames.

### 03 · FRAMES
- **Coverflow**: 6 environment studies, drag / arrows / ← → keys; center card
  full, neighbours recede in 3D with captions + counter.
- **Magnetic Dock**: macOS-dock magnification; bars reweight in a spring rAF so
  the row always fills 100%; click any bar to expand it into a large square.

### 04 · DISCIPLINES
- Five-row editorial list; a preview image **follows the cursor** with lag +
  velocity tilt, swapping per row; hovered row swells to `wght 900`.

### 05 · TOOLKIT
- **Reactive Grid** canvas behind it (shapes bloom under cursor, click sends a
  shockwave). Eight **Sticker Peel** badges — corner curls on hover, deeper on
  press, tone-cycled across palette (Unreal, Unity, Blender, Substance, Quixel,
  NVIDIA RTX, Photoshop, Git/Perforce).

### 06 · CONTACT
- **Dot Globe** (fibonacci sphere, graticule, drag-to-spin, markers: home base
  Karnataka + remote hubs, pulsing rings).
- **Wave Arcs** glowing arc field bending toward the cursor behind everything.
- Big swap-link email + socials + availability card; footer bar with colophon.

---

## 6 · SIGNATURE FX — IMPLEMENTATION MATRIX

| # | Effect (brief term) | Where | Technique | Fallback / reduced-motion |
|---|---|---|---|---|
| 1 | **Smokey Text** | all section titles | sharp ink layer + sage “smoke” layer (blur 18px) crossfade + letter-spacing settle | opacity fade only |
| 2 | **Ink Bleed** | display type | SVG `#ink-bleed` filter: `feTurbulence` + `feDisplacementMap scale=10` | plain text (filter unsupported) |
| 3 | **Direction Hover** | nav · contact links | entry-edge vector → old label exits that way, ghost enters from opposite | simple underline |
| 4 | **Dynamic Weight** | hero, list rows | Fraunces variable: per-char `font-variation-settings "wght" 300→860` by cursor proximity | static `wght 500` |
| 5 | **Letter Swap** | nav · links | scramble charset `░▒▓/×+—` resolving L→R in 240 ms | instant swap |
| 6 | **Dusk Text Reveal** | standfirsts, captions | per-char `translateY 70%→0`, `blur 8→0`, sage→ink, 28 ms stagger | visible immediately |
| 7 | **Mesh Text** | hero headline | per-char spring physics (cursor pull), rotate, weight + two chromatic clone layers cycling palette | static display |
| 8 | **Liquid Distortion** | both REEL slots | raw WebGL1: 24-point cursor trail as uniforms → velocity warp + caustic split RGB; video becomes live texture when present | plain `<video>`/`<img>` |
| 9 | **Fluid Image Reveal** | ORIGIN portrait | per-frame blob `clip-path: path()` scaling 0→cover with wobble, then full-rect settle | instant image |
| 10 | **Coverflow Carousel** | FRAMES | 3D `translateZ/rotateY` rail, drag + keys + buttons | horizontal scroll row |
| 11 | **Hover Image Reveal** | DISCIPLINES | cursor-following floating preview (lerp + velocity tilt), crossfade swap | row tint only |
| 12 | **Magnetic Carousel** | FRAMES dock | gaussian magnification, rAF-reweighted widths (row always = 100%), click → large square | static flex row |
| 13 | **Kinetic Grid (cursor trail)** | global background | spring-point lattice, ink mesh lines brighten with stretch, tapering palette cursor ribbon | hidden |
| 14 | **Sticker Peel** | TOOLKIT badges | 3D corner curl (underside tone + cast shadow), hover 52px → press 92px, lift + tilt | flat card hover |
| 15 | **Reactive Grid** | TOOLKIT backdrop | canvas shape field (circle/plus/diamond) blooming by cursor proximity + click shockwaves | static dots |
| 16 | **Globe** | CONTACT | Canvas 2D projected fibonacci sphere, graticule, drag inertia, geo markers (Karnataka + remote) | static mark |
| 17 | **Wave Arcs** | CONTACT backdrop | 26 concentric arcs, radius bent toward cursor angle w/ gaussian falloff, `lighter` composite glow | static arcs |
| 18 | **Click micro-interaction** | global | `ClickFX`: ink blot + palette shards + expanding ring on every `pointerdown` | none |
| 19 | Marquee + spin badge | hero | CSS keyframes (paused under reduced-motion) | static |

**Performance budget:** ≤ 4 active canvases per viewport · DPR capped at 1.75 ·
IO-paused offscreen · no per-frame React state (refs + direct style writes).

---

## 7 · VIDEO PLACEHOLDER CONTRACT  ⚠ the important one

| Slot | Title | Drop file at | Poster (already generated) |
|---|---|---|---|
| RR-01 | **ASHFALL** — post-apocalyptic vegetation city ruins | `public/videos/ruins.mp4` | `public/img/poster-ruins.jpg` |
| RR-02 | **TIDELINE** — realistic cinematic beach coastal | `public/videos/beach.mp4` | `public/img/poster-beach.jpg` |

**Specs:** 16:9 · 1080p · H.264/`.mp4` (optional `.webm` sibling) · **≤ 8 MB each** · loop-friendly · no audio needed (site plays muted).

**Behaviour**
1. File **missing** → poster runs through the liquid shader + dashed `AWAITING RENDER → public/videos/….mp4` chip.
2. File **present** → shader swaps its texture to the live video automatically (no code change — just rebuild `npm run build` and push).
3. No video ever ships in git? Page still looks 100% intentional.

**GitHub size rules:** keep each ≤ ~25 MB in-repo (hard limit 100 MB/file). If your masters are bigger: compress (HandBrake preset “Web”, CRF 28) or host externally and swap `src/data.ts → VIDEOS[].video` to the URL.

---

## 8 · ASSET INVENTORY

**Generated this build (8):** 2 posters (§7) + 6 gallery frames `g-forest · g-canyon · g-temple · g-alley · g-reef · g-peaks` (`public/img/`).
**You supply (6):** 2 renders (§7) + real `ArtStation/LinkedIn/GitHub/Instagram` URLs + real email (`src/data.ts → PROFILE`, `SOCIALS`).
Optional later: portrait photo (blob slot in ORIGIN currently uses Biolume Grove).

---

## 9 · ARCHITECTURE

```
├── plan.md                        ← you are here
├── .github/workflows/pages.yml    ← 1-click GitHub Pages deploy (§10-B)
├── index.html                     ← fonts (Fraunces/Space Grotesk), meta, favicon
├── public/
│   ├── img/                       ← posters + gallery frames (generated)
│   └── videos/                    ← DROP ruins.mp4 & beach.mp4 HERE (empty now)
└── src/
    ├── data.ts                    ← ★ content source of truth (edit me)
    ├── App.tsx                    ← composition, SVG filter defs, grain, global FX
    ├── fx/util.ts                 ← lerp/clamp · useRaf · useInView · reduced-motion
    ├── fx/canvas.tsx              ← KineticGrid · WaveArcs · ReactiveGrid · DotGlobe · ClickFX
    ├── fx/text.tsx                ← WarpText (mesh) · SmokeyTitle · DuskReveal · SwapLink
    ├── fx/media.tsx               ← LiquidMedia (WebGL) · BlobReveal · PeelSticker
    ├── fx/carousels.tsx           ← Coverflow · HoverList · MagneticDock
    └── sections/{Core,Showcase}.tsx
```

Runtime rules: canvas code writes styles directly (no re-render storms) · every
loop is cleaned up on unmount · WebGL failure → DOM fallback (§6).

---

## 10 · HOSTING ON GITHUB PAGES  *(step-by-step)*

> The build inlines **all JS/CSS** into one `index.html` and every image path is
> **relative**, so the site works from both `<user>.github.io` *and*
> `<user>.github.io/<repo>/` — no config edits needed either way.

### Option A — “I just want it live” (root user site, zero CI)
1. On GitHub, create a repo named **`<your-username>.github.io`** (exactly).
2. Push the project:
   ```bash
   git init && git add -A && git commit -m "portfolio v1"
   git branch -M main
   git remote add origin git@github.com:<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. Locally run `npm run build`, then push the `dist/` output with any static
   pusher (e.g. `npx gh-pages -d dist`) — done. Live at `https://<your-username>.github.io`.

### Option B — project repo + automatic deploy on every push *(recommended)*
1. Create repo, e.g. `portfolio`, and push the project (same commands, different remote).
2. The repo already contains **`.github/workflows/pages.yml`**.
3. On GitHub: **Settings → Pages → Source: “GitHub Actions.”**
4. Every push to `main` now rebuilds and publishes to
   `https://<your-username>.github.io/portfolio/`.

### After deploy
- **Videos:** commit `public/videos/*.mp4` like any file (keep sizes sane, §7).
- **Custom domain (optional):** add `public/CNAME` containing `www.yourdomain.com`
  and point your DNS `CNAME` at `<user>.github.io`.

### Troubleshooting
| Symptom | Fix |
|---|---|
| Blank page on `/repo/` URL | Clear cache — asset paths are already relative; ensure Option B workflow ran green |
| 404 video but poster shows | File must be at exactly `public/videos/ruins.mp4` before build (case-sensitive) |
| Workflow fails on install | Re-run: Actions tab → failed run → “Re-run jobs” |
| Video too big for git | Compress (CRF 28) or use Git LFS / external URL in `data.ts` |

---

## 11 · HOW TO EDIT (annotated map)

| You want to… | Touch | Notes |
|---|---|---|
| Change name, role, email, availability | `src/data.ts → PROFILE` | one object |
| Edit fact table | `src/data.ts → FACTS` | `[label, value]` rows |
| Rename films / change tech captions | `src/data.ts → VIDEOS` | keep `video:` paths unless renaming files |
| Swap gallery images or captions | `src/data.ts → FRAMES` + drop files in `public/img/` | keeps code + titles |
| Edit disciplines / tools / socials | `src/data.ts → DISCIPLINES / TOOLS / SOCIALS` | tool `icon` keys map to lucide icons in `Core.tsx` |
| Retune palette | `src/index.css → @theme` + `src/data.ts → PALETTE` | both places (CSS + canvas) |
| Section copy (headings, paragraphs) | `src/sections/Core.tsx`, `Showcase.tsx` | plain JSX, annotated |

---

## 12 · ROADMAP

- **P0 (this build):** full FX suite, placeholders, hosting CI. ✅
- **P1 (you, ~30 min):** drop the 2 renders · replace email/socials · optional portrait.
- **P2 (later):** case-study subpages · ArtStation embed wall · OG share image ·
  form backend (Formspree) · analytics (GoatCounter — privacy-friendly, 1 line).

**Acceptance checklist:** two slots flip from “awaiting” to live video on drop-in ·
all §6 effects fire · 95+ Lighthouse performance on desktop · zero console errors.

## 13 · QA / A11Y BASELINE
- `prefers-reduced-motion` → all canvases + springs + marquees disabled, content fully readable.
- Keyboard: coverflow arrows, focus-visible rings, semantic headings, alt text from `data.ts`.
- Targets ≥ 44px; contrast: ink-on-cream 13.2:1, cream-on-abyss 12.6:1 (WCAG AAA).

---
*AFTERGARDEN v1.0 — designed & engineered as a living field-journal. Questions later? Start at `src/data.ts` — it’s the single knob.*
