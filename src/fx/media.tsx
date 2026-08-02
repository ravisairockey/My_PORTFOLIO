/* ════════════════════════════════════════════════════════════════════
   MEDIA FX — LiquidMedia (WebGL liquid-ripple, poster→video upgrade)
              BlobReveal (organic clip-path dissolve) · PeelSticker
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./util";

/* ── 8 · LIQUID DISTORTION ────────────────────────────────────────────
   Raw WebGL1. A 24-point cursor trail is fed to the fragment shader as
   uniforms; each point injects a radial velocity field that warps the
   texture with chromatic RGB splitting. If the video file exists it
   becomes the live texture — until then the poster plays through.      */

const N = 24;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCanvas;
uniform vec2 uTexRes;
uniform vec4 uPts[${N}];
uniform float uTime;
vec2 coverUV(vec2 uv){
  float ca = uCanvas.x / uCanvas.y;
  float ta = uTexRes.x / uTexRes.y;
  vec2 s = ca > ta ? vec2(1.0, ta / ca) : vec2(ca / ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = vUv;
  float aspect = uCanvas.x / uCanvas.y;
  vec2 flow = vec2(0.0);
  for(int i = 0; i < ${N}; i++){
    float s = uPts[i].z;
    if(s > 0.001){
      vec2 d = uv - uPts[i].xy;
      d.x *= aspect;
      float f = exp(-dot(d, d) * 26.0);
      flow += normalize(d + vec2(0.0001)) * f * s;
    }
  }
  float m = min(1.0, length(flow) * 2.0);
  vec2 off = flow * 0.05;
  off += 0.0038 * (0.35 + m) * vec2(sin(uv.y * 16.0 + uTime * 0.8), cos(uv.x * 14.0 - uTime * 0.65));
  vec2 ca = flow * 0.02;
  float r = texture2D(uTex, coverUV(uv + off + ca)).r;
  vec4  g = texture2D(uTex, coverUV(uv + off));
  float b = texture2D(uTex, coverUV(uv + off - ca)).b;
  vec3 col = vec3(r, g.g, b);
  float vig = smoothstep(0.98, 0.42, length(vUv - 0.5));
  col *= mix(0.88, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function LiquidMedia({
  poster,
  video,
  ratio = "16 / 9",
  eyebrow,
}: {
  poster: string;
  video?: string;
  ratio?: string;
  eyebrow: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glFailed, setGlFailed] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      setGlFailed(true);
      return;
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setGlFailed(true);
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setGlFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      canvas: gl.getUniformLocation(prog, "uCanvas"),
      texRes: gl.getUniformLocation(prog, "uTexRes"),
      pts: gl.getUniformLocation(prog, "uPts[0]"),
      time: gl.getUniformLocation(prog, "uTime"),
    };

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    const params = () => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    params();
    // sage placeholder pixel until poster arrives
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([162, 179, 139, 255])
    );

    let texW = 1;
    let texH = 1;
    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      params();
      texW = img.naturalWidth;
      texH = img.naturalHeight;
    };
    img.src = poster;

    /* optional video upgrade — silently stays in poster mode on 404 */
    let vid: HTMLVideoElement | null = null;
    let vidReady = false;
    if (video) {
      vid = document.createElement("video");
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "auto";
      vid.addEventListener(
        "canplay",
        () => {
          if (disposed || !vid) return;
          vidReady = true;
          texW = vid.videoWidth || texW;
          texH = vid.videoHeight || texH;
          setHasVideo(true);
          vid.play().catch(() => {});
        },
        { once: true }
      );
      vid.src = video;
    }

    /* cursor trail → shader uniforms */
    const pts = new Float32Array(N * 4);
    let head = 0;
    let lastX = -1;
    let lastY = -1;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < -0.12 || x > 1.12 || y < -0.12 || y > 1.12) return;
      let str = 0.35;
      if (lastX >= 0) str = Math.min(1, Math.hypot(x - lastX, y - lastY) * 5 + 0.22);
      lastX = x;
      lastY = y;
      pts[head * 4] = x;
      pts[head * 4 + 1] = y;
      pts[head * 4 + 2] = str;
      pts[head * 4 + 3] = 0;
      head = (head + 1) % N;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let w = 1;
    let h = 1;
    const dpr = Math.min(1.6, window.devicePixelRatio || 1);
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.02 });
    io.observe(wrap);

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      for (let i = 0; i < N; i++) pts[i * 4 + 2] *= 0.94;
      if (vid && vidReady && vid.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
        } catch {
          /* ignore mid-decode frames */
        }
        params();
      }
      gl.uniform2f(U.canvas, w, h);
      gl.uniform2f(U.texRes, texW, texH);
      gl.uniform4fv(U.pts, pts);
      gl.uniform1f(U.time, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (vid) {
        vid.pause();
        vid.removeAttribute("src");
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [poster, video, reduced]);

  return (
    <div
      ref={wrapRef}
      className="group relative w-full overflow-hidden rounded-2xl border border-cream/10 bg-abyss"
      style={{ aspectRatio: ratio }}
    >
      {glFailed || reduced ? (
        /* DOM fallback — plain media, zero shader */
        <>
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {video && (
            <video
              src={video}
              muted
              loop
              playsInline
              autoPlay
              onCanPlay={(e) => {
                setHasVideo(true);
                e.currentTarget.play().catch(() => {});
              }}
              onError={() => setHasVideo(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </>
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      )}

      {/* grade + vignette overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/80 via-transparent to-abyss/25" />

      <span className="absolute left-4 top-4 rounded-md bg-abyss/55 px-2.5 py-1 text-[9px] tracking-[0.3em] text-cream/90 backdrop-blur-sm">
        {eyebrow}
      </span>
      <span className="absolute right-4 top-4 hidden rounded-md border border-cream/20 px-2.5 py-1 text-[9px] tracking-[0.25em] text-cream/70 md:block">
        {hasVideo ? "LIVE · LIQUID DISTORTION" : "UNREAL ENGINE 5 RENDER"}
      </span>
    </div>
  );
}

/* ── 9 · FLUID IMAGE REVEAL (blob mask dissolve) ────────────────────── */
function blobPath(w: number, h: number, p: number, t: number) {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.hypot(w, h) * 0.63 * p + 0.01;
  const n = 10;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = ((i % n) / n) * Math.PI * 2;
    const wob = 1 + 0.2 * Math.sin(t * 1.9 + i * 2.4) + 0.08 * Math.sin(t * 3.1 + i * 1.1);
    d += `${i === 0 ? "M" : " L"}${(cx + Math.cos(a) * R * wob).toFixed(1)} ${(
      cy +
      Math.sin(a) * R * wob
    ).toFixed(1)}`;
  }
  return d + " Z";
}

export function BlobReveal({
  src,
  alt,
  ratio = "4 / 5",
  className = "",
  children,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState("M0 0 H0 V0 H0 Z");
  const [done, setDone] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (reduced) {
          setDone(true);
          return;
        }
        const t0 = performance.now();
        const DUR = 1500;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / DUR);
          if (p >= 1) {
            setDone(true);
            return;
          }
          const e2 = 1 - Math.pow(1 - p, 3);
          const r = el.getBoundingClientRect();
          setPath(blobPath(r.width, r.height, e2, t * 0.001));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{
          clipPath: done ? undefined : `path("${path}")`,
          transform: done ? "scale(1.02)" : "scale(1.14)",
          transition: "transform 1.8s cubic-bezier(.22,1,.36,1)",
        }}
      />
      {children}
    </div>
  );
}

/* ── 14 · STICKER PEEL ────────────────────────────────────────────────
   A sticker badge whose corner curls up on hover (52px) and deeper on
   press (96px), revealing its dyed underside + fold shadow.             */
const TONES: Record<string, { face: string; under: string }> = {
  sage: { face: "#A2B38B", under: "#6c7c55" },
  blush: { face: "#EED3D9", under: "#c2a4ad" },
  mist: { face: "#B5C0D0", under: "#8a99b1" },
  cream: { face: "#F5E8DD", under: "#d9c3b3" },
};

export function PeelSticker({
  icon,
  name,
  meta,
  tone,
}: {
  icon: ReactNode;
  name: string;
  meta: string;
  tone: string;
}) {
  const [peel, setPeel] = useState(0);
  const s = peel === 2 ? 96 : peel === 1 ? 54 : 0;
  const t = TONES[tone] ?? TONES.sage;
  const spring = "cubic-bezier(.2,1.4,.3,1)";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${name} — ${meta}`}
      className="group relative flex select-none flex-col justify-between gap-7 overflow-hidden rounded-2xl p-5 text-left text-ink transition-all duration-500 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 md:p-6"
      style={{
        background: `linear-gradient(160deg, ${t.face} 0%, ${t.face} 55%, ${t.under}33 100%)`,
        border: "1px solid rgba(20,23,15,0.14)",
        transform: peel ? "translateY(-6px) rotate(-1.3deg)" : "none",
        boxShadow: peel
          ? "0 26px 44px -18px rgba(20,23,15,.5)"
          : "0 12px 26px -18px rgba(20,23,15,.35)",
        transitionTimingFunction: spring,
        minHeight: 168,
      }}
      onMouseEnter={() => setPeel(1)}
      onMouseLeave={() => setPeel(0)}
      onMouseDown={() => setPeel(2)}
      onMouseUp={() => setPeel(1)}
      onFocus={() => setPeel(1)}
      onBlur={() => setPeel(0)}
    >
      <div className="text-ink/80 [&>svg]:h-7 [&>svg]:w-7">{icon}</div>
      <div className="pr-2">
        <p className="font-display text-lg leading-tight md:text-xl">{name}</p>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-ink/60">{meta}</p>
      </div>

      {/* peel corner — underside + fold shadow */}
      <div
        aria-hidden
        className="absolute right-0 top-0 overflow-hidden rounded-tr-2xl transition-[width,height] duration-500"
        style={{ width: s, height: s, transitionTimingFunction: spring }}
      >
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)", background: t.under }}
        />
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%)",
            background: "linear-gradient(315deg, rgba(20,23,15,.35) 0%, rgba(20,23,15,0) 55%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(20,23,15,0) 48%, rgba(20,23,15,.28) 50%, rgba(20,23,15,0) 54%)" }}
        />
      </div>

      <span className="pointer-events-none absolute bottom-2 right-3 text-[9px] uppercase tracking-[0.3em] text-ink/0 transition-colors duration-300 group-hover:text-ink/50">
        peel
      </span>
    </div>
  );
}
