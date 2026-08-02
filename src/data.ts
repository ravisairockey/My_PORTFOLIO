/* ════════════════════════════════════════════════════════════════════
   CONTENT SOURCE OF TRUTH — edit this file to re-skin the whole site.
   (plan.md §11 maps every block below to the section it feeds.)
   NOTE: all asset paths are RELATIVE ('img/…') so the build works both
   on https://<user>.github.io and on https://<user>.github.io/<repo>/.
   ════════════════════════════════════════════════════════════════════ */

export const PALETTE = {
  sage: "#A2B38B",
  blush: "#EED3D9",
  mist: "#B5C0D0",
  cream: "#F5E8DD",
  clay: "#C9A5A0",
  moss: "#5C6B48",
  ink: "#22251B",
  abyss: "#14170F",
} as const;

/** Order used by colour-cycling effects (fringe, arcs, bursts…). */
export const PALETTE_SEQ = ["#A2B38B", "#EED3D9", "#B5C0D0", "#C9A5A0"];

/* ── 02 · PERSONA (from the brief) ──────────────────────────────────── */
export const PROFILE = {
  name: "Ravi Sai Vigneswara",
  lineA: "RAVI SAI",
  lineB: "VIGNESWARA",
  role: "Environment Artist · Game Designer",
  location: "Karnataka, India",
  tz: "UTC +5:30",
  availability: "Open for internships, junior roles & freelance — 2026",
  email: "Ravisairockey2004@gmail.com",
};

/** Fact table rendered in §01 ORIGIN (mirrors the brief verbatim). */
export const FACTS: Array<[string, string]> = [
  ["Full Name", "Ravi Sai Vigneswara"],
  ["Age", "21 years"],
  ["Nationality", "Indian"],
  ["Location", "Karnataka, India"],
  ["Education", "BA in Communication Design (3-year program)"],
  ["Institution", "Jain University — CCAD"],
  ["Specialization", "Game Arts and Design"],
  ["Learning Mode", "Self-directed · project-based"],
  ["Engines", "Unreal Engine (cinematics) · Unity (development)"],
];

/* ── 03 · REEL — the two rendered-film slots ────────────────────────── */
export type ReelVideo = {
  id: string;
  poster: string;
  video: string;
  file: string;
  title: string;
  sub: string;
  meta: string;
  tech: string;
  role?: string;
  tools?: string[];
  contribution?: string;
  notes?: string;
};

export const VIDEOS: ReelVideo[] = [
  {
    id: "RR-01",
    poster: "img/poster-ruins.jpg",
    video: "videos/ruins.mp4",
    file: "public/videos/ruins.mp4",
    title: "ASHFALL",
    sub: "Post-Apocalyptic Vegetation City Ruins",
    meta: "Environment display render",
    tech: "Unreal Engine 5 · Nanite foliage · Lumen GI",
  },
  {
    id: "RR-02",
    poster: "img/poster-beach.jpg",
    video: "videos/DesertMonster.mp4",
    file: "public/videos/DesertMonster.mp4",
    title: "THE SANDMAN",
    sub: "A coastal dusk broken open as a Sandman monster rises from the shore.",
    meta: "Cinematic environment render",
    tech: "Unreal Engine 5 · Niagara · Mixamo · Sequencer",
    role: "Cinematic Artist · FX · Direction",
    tools: ["Unreal Engine 5", "Niagara", "Mixamo", "Sequencer"],
    contribution:
      "Realistic beach set-dressing, Niagara sand and mist FX, Mixamo-driven creature animation, cinematic lighting and camera direction.",
    notes:
      "Fog and volumetrics carry the tension. The creature reveal is timed to a slow dolly push so scale reads before detail.",
  },
];

/* ── 04 · SELECTED FRAMES — coverflow + magnetic dock galleries ─────── */
export const FRAMES = [
  {
    src: "img/g-forest.jpg",
    code: "F-01",
    title: "BIOLUME GROVE",
    meta: "Foliage study · hand-set dressing over scan assets",
  },
  {
    src: "img/g-canyon.jpg",
    code: "F-02",
    title: "RED MILE",
    meta: "Canyon blockout → dressed pass · volumetric haze",
  },
  {
    src: "img/g-temple.jpg",
    code: "F-03",
    title: "WHITE ALTAR",
    meta: "Snow temple · trimmed masonry kit · cold LUT",
  },
  {
    src: "img/g-alley.jpg",
    code: "F-04",
    title: "NEON RUNOFF",
    meta: "Rain-slick alley · emissive decals · wetness mask",
  },
  {
    src: "img/g-reef.jpg",
    code: "F-05",
    title: "DROWNED NAVE",
    meta: "Underwater ruins · caustics · fog volume",
  },
  {
    src: "img/g-peaks.jpg",
    code: "F-06",
    title: "PALE SUMMIT",
    meta: "Misty peaks · atmosphere depth pass",
  },
];

/* ── 05 · DISCIPLINES — hover-list with cursor-following reveals ────── */
export const DISCIPLINES = [
  {
    n: "01",
    title: "Environment Art",
    meta: "Set dressing · modular kits · prop storytelling",
    img: "img/g-alley.jpg",
  },
  {
    n: "02",
    title: "Level Design",
    meta: "Blockout → whitebox → playable flow (Unreal)",
    img: "img/g-canyon.jpg",
  },
  {
    n: "03",
    title: "Lighting & Mood",
    meta: "Lumen · volumetrics · colour-scripted LUTs",
    img: "img/g-temple.jpg",
  },
  {
    n: "04",
    title: "Foliage & Biomes",
    meta: "Megascans · procedural scatter · wind systems",
    img: "img/g-forest.jpg",
  },
  {
    n: "05",
    title: "Cinematic Capture",
    meta: "Sequencer · camera language · render passes",
    img: "img/g-reef.jpg",
  },
];

/* ── 06 · TOOLKIT — sticker-peel badges (icon = key into ICONS map) ─── */
export const TOOLS = [
  { name: "Unreal Engine 5", meta: "Environment art · Niagara VFX · Sequencer", icon: "Boxes", tone: "sage" },
  { name: "Unity", meta: "Primary development", icon: "Gamepad2", tone: "mist" },
  { name: "Environment Art", meta: "Set dressing · mood · depth", icon: "Mountain", tone: "cream" },
  { name: "Niagara VFX", meta: "Particle systems · FX pipelines", icon: "Droplets", tone: "blush" },
  { name: "Blender", meta: "Modeling · kitbash", icon: "Layers", tone: "blush" },
  { name: "Substance 3D", meta: "PBR material authoring", icon: "Droplets", tone: "cream" },
  { name: "Quixel Megascans", meta: "Scan library workflows", icon: "Mountain", tone: "mist" },
  { name: "Adobe Photoshop", meta: "Concept paint · LUTs", icon: "Palette", tone: "blush" },
  { name: "Git · Perforce", meta: "Version control", icon: "GitBranch", tone: "cream" },
] as const;

/* ── 07 · SOCIALS — real profiles ───────────────────────────────────── */
export const SOCIALS = [
  { label: "ArtStation", href: "https://www.artstation.com/rsv9" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ravi-sai-vigneswara-113894191/" },
  { label: "GitHub", href: "https://github.com/ravisairockey" },
  { label: "Instagram", href: "https://www.instagram.com/rsv_digitalart/" },
];

/* ── 08 · GLOBE MARKERS — home base + remote availability ───────────── */
export const MARKERS = [
  { lat: 12.97, lon: 77.59, label: "HOME · KARNATAKA, IN" },
  { lat: 51.5, lon: -0.13, label: "" },
  { lat: 35.68, lon: 139.69, label: "" },
  { lat: 34.05, lon: -118.24, label: "" },
];

export const NAV_LINKS = [
  { label: "ORIGIN", href: "#origin" },
  { label: "REEL", href: "#reel" },
  { label: "FRAMES", href: "#frames" },
  { label: "DISCIPLINES", href: "#disciplines" },
  { label: "TOOLKIT", href: "#toolkit" },
  { label: "CONTACT", href: "#contact" },
];