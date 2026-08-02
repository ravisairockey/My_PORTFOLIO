/* ════════════════════════════════════════════════════════════════════
   CANVAS FX — KineticGrid · WaveArcs · ReactiveGrid · DotGlobe · ClickFX
   Shared rules: DPR-capped · paused offscreen/hidden · reduced-motion off.
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef } from "react";
import { PALETTE_SEQ } from "../data";
import { usePrefersReducedMotion } from "./util";

type CC = CanvasRenderingContext2D;

/** Wire a canvas to its CSS box with a capped device-pixel-ratio. */
function setupCanvas(canvas: HTMLCanvasElement, maxDpr = 1.75) {
  const ctx = canvas.getContext("2d")!;
  let w = 1,
    h = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  return {
    ctx,
    size: () => ({ w, h }),
    dispose: () => ro.disconnect(),
  };
}

/** Run `frame(t, ctx, w, h)` only while visible & tab focused. */
function runLoop(
  canvas: HTMLCanvasElement,
  ctx: CC,
  getSize: () => { w: number; h: number },
  frame: (t: number, ctx: CC, w: number, h: number) => void
) {
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
    threshold: 0,
  });
  io.observe(canvas);
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const { w, h } = getSize();
    frame(t, ctx, w, h);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

/* ── 1 · KINETIC GRID — global fixed background (cursor lattice + trail) ── */
export function KineticGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current!;
    const { ctx, size, dispose } = setupCanvas(canvas);
    const GAP = 46;
    type Pt = { hx: number; hy: number; x: number; y: number; vx: number; vy: number };
    let pts: Pt[] = [];
    let cols = 0,
      rows = 0;
    const build = () => {
      const { w, h } = size();
      cols = Math.ceil(w / GAP) + 2;
      rows = Math.ceil(h / GAP) + 2;
      pts = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const hx = i * GAP - GAP / 2;
          const hy = j * GAP - GAP / 2;
          pts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
        }
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const mouse = { x: -9999, y: -9999 };
    const trail: { x: number; y: number }[] = [];
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      trail.push({ x: e.clientX, y: e.clientY });
      if (trail.length > 18) trail.shift();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const stop = runLoop(canvas, ctx, size, (_t, c, w, h) => {
      c.clearRect(0, 0, w, h);
      const R = 150;
      for (const p of pts) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) ** 2 * 2.4;
          p.vx += (dx / d) * f + (-dy / d) * f * 0.4; // push + swirl
          p.vy += (dy / d) * f + (dx / d) * f * 0.4;
        }
        p.vx += (p.hx - p.x) * 0.022;
        p.vy += (p.hy - p.y) * 0.022;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
      }
      // mesh lines — brighten with local stretch
      c.lineWidth = 1;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p = pts[j * cols + i];
          const sA = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy);
          if (i < cols - 1) {
            const q = pts[j * cols + i + 1];
            const sB = Math.abs(q.x - q.hx) + Math.abs(q.y - q.hy);
            c.strokeStyle = `rgba(34,37,27,${Math.min(0.22, 0.045 + (sA + sB) * 0.006)})`;
            c.beginPath();
            c.moveTo(p.x, p.y);
            c.lineTo(q.x, q.y);
            c.stroke();
          }
          if (j < rows - 1) {
            const q = pts[(j + 1) * cols + i];
            const sB = Math.abs(q.x - q.hx) + Math.abs(q.y - q.hy);
            c.strokeStyle = `rgba(34,37,27,${Math.min(0.22, 0.045 + (sA + sB) * 0.006)})`;
            c.beginPath();
            c.moveTo(p.x, p.y);
            c.lineTo(q.x, q.y);
            c.stroke();
          }
        }
      }
      // tapering palette ribbon trail
      c.lineCap = "round";
      for (let k = 1; k < trail.length; k++) {
        const a = trail[k - 1];
        const b = trail[k];
        c.strokeStyle = `${PALETTE_SEQ[k % 4]}${Math.round((k / trail.length) * 110).toString(16).padStart(2, "0")}`;
        c.lineWidth = 1.5 + (k / trail.length) * 6;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
    });

    return () => {
      stop();
      dispose();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-80"
    />
  );
}

/* ── 2 · CLICK FX — every click: ink blot + palette shards + ring ─────── */
export function ClickFX() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current!;
    const { ctx, size, dispose } = setupCanvas(canvas);
    type Shard = { x: number; y: number; vx: number; vy: number; s: number; c: string; r: number };
    type Burst = { x: number; y: number; t0: number; shards: Shard[] };
    const bursts: Burst[] = [];
    const onDown = (e: PointerEvent) => {
      const shards: Shard[] = [];
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + Math.random() * 0.6;
        const sp = 2 + Math.random() * 4.5;
        shards.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.6,
          s: 2.5 + Math.random() * 3.5,
          c: PALETTE_SEQ[i % 4],
          r: Math.random() * Math.PI,
        });
      }
      bursts.push({ x: e.clientX, y: e.clientY, t0: performance.now(), shards });
      if (bursts.length > 5) bursts.shift();
    };
    window.addEventListener("pointerdown", onDown, { passive: true });

    const stop = runLoop(canvas, ctx, size, (t, c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (let bi = bursts.length - 1; bi >= 0; bi--) {
        const b = bursts[bi];
        const age = t - b.t0;
        if (age > 950) {
          bursts.splice(bi, 1);
          continue;
        }
        const k = age / 950;
        // ink blot
        const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, 26 + age * 0.06);
        g.addColorStop(0, `rgba(20,23,15,${0.14 * (1 - k)})`);
        g.addColorStop(1, "rgba(20,23,15,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(b.x, b.y, 26 + age * 0.06, 0, Math.PI * 2);
        c.fill();
        // ring
        c.strokeStyle = `rgba(92,107,72,${0.5 * (1 - k)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(b.x, b.y, 6 + age * 0.11, 0, Math.PI * 2);
        c.stroke();
        // shards
        for (const s of b.shards) {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.07;
          s.vx *= 0.985;
          c.save();
          c.translate(s.x, s.y);
          c.rotate(s.r + age * 0.01);
          c.globalAlpha = Math.max(0, 1 - k);
          c.fillStyle = s.c;
          c.fillRect(-s.s / 2, -s.s / 2, s.s, s.s);
          c.restore();
        }
        c.globalAlpha = 1;
      }
    });

    return () => {
      stop();
      dispose();
      window.removeEventListener("pointerdown", onDown);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}

/* ── 3 · WAVE ARCS — glowing concentric arcs bending to the cursor ────── */
export function WaveArcs({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current!;
    const { ctx, size, dispose } = setupCanvas(canvas);
    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const N = 26;
    const stop = runLoop(canvas, ctx, size, (t, c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = "lighter";
      const cx = w * 0.84;
      const cy = h * 1.14;
      const dm = Math.hypot(mouse.x - cx, mouse.y - cy);
      const pull = 90 * Math.exp(-dm / 420);
      const thetaC = Math.atan2(mouse.y - cy, mouse.x - cx);
      const sweep = Math.sin(t * 0.00032) * 0.12;
      for (let i = 1; i <= N; i++) {
        const R0 = 70 + i * 42;
        c.strokeStyle = PALETTE_SEQ[i % 4];
        c.globalAlpha = 0.1 + 0.1 * (i / N);
        c.lineWidth = 1.4;
        c.beginPath();
        const SEG = 56;
        for (let s = 0; s <= SEG; s++) {
          const th = Math.PI * (0.98 + 0.94 * (s / SEG)) + sweep;
          let dTh = Math.atan2(Math.sin(th - thetaC), Math.cos(th - thetaC));
          const bend =
            pull * Math.exp(-(dTh * dTh) / 0.09) * (0.3 + 0.7 * (i / N)) +
            7 * Math.sin(t * 0.0009 + i * 0.55 + th * 4);
          const r = R0 + bend;
          const x = cx + Math.cos(th) * r;
          const y = cy + Math.sin(th) * r;
          s === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    });

    return () => {
      stop();
      dispose();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}

/* ── 4 · REACTIVE GRID — shapes bloom under the cursor + click waves ──── */
export function ReactiveGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current!;
    const parent = canvas.parentElement!;
    const { ctx, size, dispose } = setupCanvas(canvas);
    const mouse = { x: -9999, y: -9999 };
    const waves: { x: number; y: number; t0: number }[] = [];
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() });
      if (waves.length > 4) waves.shift();
    };
    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", onLeave);
    parent.addEventListener("pointerdown", onDown, { passive: true });

    const GAP = 42;
    let sizes: Float32Array = new Float32Array(0);
    let cols = 0,
      rows = 0;
    const build = () => {
      const { w, h } = size();
      cols = Math.ceil(w / GAP) + 1;
      rows = Math.ceil(h / GAP) + 1;
      sizes = new Float32Array(cols * rows).fill(3);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const stop = runLoop(canvas, ctx, size, (t, c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * GAP;
          const y = j * GAP;
          const idx = j * cols + i;
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          let target = 3 + 15 * Math.exp(-((d / 165) ** 2));
          for (const wv of waves) {
            const age = t - wv.t0;
            const front = 40 + age * 0.42;
            const dd = Math.abs(Math.hypot(x - wv.x, y - wv.y) - front);
            if (dd < 52 && age < 2200) target += 11 * (1 - dd / 52) * (1 - age / 2200);
          }
          sizes[idx] += (target - sizes[idx]) * 0.16;
          const s = sizes[idx];
          const boost = (s - 3) / 26;
          c.fillStyle = PALETTE_SEQ[(i * 3 + j * 5) % 4];
          c.globalAlpha = 0.13 + Math.min(0.55, boost * 0.85);
          c.strokeStyle = c.fillStyle;
          const kind = (i + j) % 3;
          if (kind === 0) {
            c.beginPath();
            c.arc(x, y, s / 2, 0, Math.PI * 2);
            c.fill();
          } else if (kind === 1) {
            c.lineWidth = Math.max(1, s / 6);
            c.beginPath();
            c.moveTo(x - s / 2, y);
            c.lineTo(x + s / 2, y);
            c.moveTo(x, y - s / 2);
            c.lineTo(x, y + s / 2);
            c.stroke();
          } else {
            c.save();
            c.translate(x, y);
            c.rotate(Math.PI / 4);
            c.fillRect(-s / 2.6, -s / 2.6, s / 1.3, s / 1.3);
            c.restore();
          }
        }
      }
      c.globalAlpha = 1;
    });

    return () => {
      stop();
      dispose();
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      parent.removeEventListener("pointerdown", onDown);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/* ── 5 · DOT GLOBE — fibonacci sphere · graticule · geo markers · drag ── */
export function DotGlobe({ markers }: { markers: { lat: number; lon: number; label: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current!;
    const { ctx, size, dispose } = setupCanvas(canvas);
    // fibonacci point cloud
    const N = 1250;
    const GA = Math.PI * (3 - Math.sqrt(5));
    const cloud: [number, number, number][] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = GA * i;
      cloud.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    const toXYZ = (lat: number, lon: number): [number, number, number] => {
      const phi = (lat * Math.PI) / 180;
      const lam = (lon * Math.PI) / 180;
      return [Math.cos(phi) * Math.cos(lam), Math.sin(phi), Math.cos(phi) * Math.sin(lam)];
    };
    const marks = markers.map((m) => ({ ...m, xyz: toXYZ(m.lat, m.lon) }));
    // graticule sample circles
    const latLines = [-60, -30, 0, 30, 60].map((la) =>
      Array.from({ length: 72 }, (_, k) => toXYZ(la, (k / 72) * 360))
    );
    const lonLines = Array.from({ length: 8 }, (_, j) =>
      Array.from({ length: 72 }, (_, k) => toXYZ(-90 + (k / 71) * 180, j * 45))
    );

    const st = { rot: 0.8, vel: 0, drag: false, lastX: 0 };
    const down = (e: PointerEvent) => {
      st.drag = true;
      st.lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!st.drag) return;
      const dx = e.clientX - st.lastX;
      st.lastX = e.clientX;
      st.rot += dx * 0.005;
      st.vel = dx * 0.0009;
    };
    const up = () => (st.drag = false);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    const project = (p: [number, number, number], R: number, cx: number, cy: number, rot: number, tilt: number) => {
      const [x, y, z] = p;
      const cs = Math.cos(rot),
        sn = Math.sin(rot);
      const x1 = x * cs + z * sn;
      const z1 = -x * sn + z * cs;
      const ct = Math.cos(tilt),
        stn = Math.sin(tilt);
      const y2 = y * ct - z1 * stn;
      const z2 = y * stn + z1 * ct;
      return { sx: cx + x1 * R, sy: cy - y2 * R, z: z2 };
    };

    const stop = runLoop(canvas, ctx, size, (t, c, w, h) => {
      c.clearRect(0, 0, w, h);
      if (!st.drag) st.rot += 0.0024;
      st.rot += st.vel;
      st.vel *= 0.95;
      const R = Math.min(w, h) * 0.37;
      const cx = w / 2,
        cy = h / 2;
      const tilt = 0.42;
      // rim
      c.strokeStyle = "rgba(245,232,221,0.3)";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.stroke();
      // graticule
      c.strokeStyle = "rgba(245,232,221,0.09)";
      const drawPoly = (pts: [number, number, number][]) => {
        c.beginPath();
        let started = false;
        for (const p of pts) {
          const q = project(p, R, cx, cy, st.rot, tilt);
          if (q.z < -0.05) {
            started = false;
            continue;
          }
          if (!started) {
            c.moveTo(q.sx, q.sy);
            started = true;
          } else c.lineTo(q.sx, q.sy);
        }
        c.stroke();
      };
      latLines.forEach(drawPoly);
      lonLines.forEach(drawPoly);
      // land dots
      for (const p of cloud) {
        const q = project(p, R, cx, cy, st.rot, tilt);
        if (q.z < -0.4) continue;
        const f = (q.z + 0.4) / 1.4;
        c.globalAlpha = 0.08 + f * 0.6;
        c.fillStyle = q.z > 0.25 ? "#A2B38B" : "#B5C0D0";
        c.beginPath();
        c.arc(q.sx, q.sy, 0.8 + f * 1.15, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      // markers
      marks.forEach((m, mi) => {
        const q = project(m.xyz, R, cx, cy, st.rot, tilt);
        if (q.z < 0.12) return;
        const pr = ((t + mi * 520) % 1700) / 1700;
        c.strokeStyle = `rgba(238,211,217,${0.85 * (1 - pr)})`;
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(q.sx, q.sy, 3 + pr * 17, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = mi === 0 ? "#EED3D9" : "#A2B38B";
        c.beginPath();
        c.arc(q.sx, q.sy, mi === 0 ? 3 : 2.2, 0, Math.PI * 2);
        c.fill();
        if (m.label && q.z > 0.35) {
          c.font = "10px 'Space Grotesk', sans-serif";
          c.fillStyle = "rgba(245,232,221,0.85)";
          c.fillText(m.label, q.sx + 14, q.sy - 8);
          c.fillRect(q.sx + 4, q.sy - 2, 8, 1);
        }
      });
    });

    return () => {
      stop();
      dispose();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [markers, reduced]);

  return (
    <canvas
      ref={ref}
      aria-label="Interactive globe — home marker: Karnataka, India"
      className={`aspect-square w-full max-w-[440px] touch-none ${reduced ? "" : "cursor-grab active:cursor-grabbing"}`}
    />
  );
}
