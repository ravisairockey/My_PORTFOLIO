/* ════════════════════════════════════════════════════════════════════
   LIQUID VIDEO — full fluid-simulation distortion (Originkit port)
   Velocity advection · pressure solve · divergence · gradient subtract.
   Unlike the original (image-only), this accepts a VIDEO element as the
   live texture source — the current frame is uploaded to the GPU every
   render tick, exactly like LiquidMedia does for the reel slots.

   Performance guards:
   · IntersectionObserver pauses the sim when scrolled off-screen.
   · The heavy fluid passes only run while hovering; when idle the
     video/poster is blitted straight through with zero distortion cost.
   · Falls back to plain <img> + <video> when WebGL is unavailable or
     the user prefers reduced motion.
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePrefersReducedMotion } from "./util";

/* eslint-disable @typescript-eslint/no-explicit-any */

const VERT = `
precision highp float;

varying vec2 vUv;
attribute vec2 a_position;

varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;

void main () {
  vUv = .5 * (a_position + 1.);
  vL = vUv - vec2(u_texel.x, 0.);
  vR = vUv + vec2(u_texel.x, 0.);
  vT = vUv + vec2(0., u_texel.y);
  vB = vUv - vec2(0., u_texel.y);
  gl_Position = vec4(a_position, 0., 1.);
}
`;

const FRAG_ADVECT = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform vec2 u_output_textel;
uniform float u_dt;
uniform float u_dissipation;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
  vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
  vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
  gl_FragColor = u_dissipation * velocity;
}
`;

const FRAG_DIVERGENCE = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_velocity_texture, vL).x;
  float R = texture2D(u_velocity_texture, vR).x;
  float T = texture2D(u_velocity_texture, vT).y;
  float B = texture2D(u_velocity_texture, vB).y;
  float div = .25 * (R - L + T - B);
  gl_FragColor = vec4(div, 0., 0., 1.);
}
`;

const FRAG_PRESSURE = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  float divergence = texture2D(u_divergence_texture, vUv).x;
  float pressure = (L + R + B + T - divergence) * .25;
  gl_FragColor = vec4(pressure, 0., 0., 1.);
}
`;

const FRAG_GRAD_SUB = `
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0., 1.);
}
`;

const FRAG_POINT = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform float u_img_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;

void main () {
  vec2 p = vUv - u_point.xy;
  p.x *= u_ratio;
  vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
  vec3 base = texture2D(u_input_texture, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.);
}
`;

const FRAG_OUTPUT = `
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_disturb_power;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_text_texture;
uniform vec2 u_point;
uniform float u_canvas_scale;
uniform float u_inner_scale;

vec2 get_img_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;

  float containerAspect = u_ratio;
  float imageAspect = u_img_ratio;
  vec2 scale = vec2(1.0);
  if (containerAspect > imageAspect) {
    scale.y = imageAspect / containerAspect;
  } else {
    scale.x = containerAspect / imageAspect;
  }
  uv *= scale;
  return uv + 0.5;
}

vec2 get_frame_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;
  return uv + 0.5;
}

float get_img_frame_alpha(vec2 uv, float img_frame_width) {
  float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
  img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
  return img_frame_alpha;
}

vec3 sample_image_smooth(vec2 uv) {
  vec2 uvc = clamp(uv, 0.0, 1.0);
  vec3 base = texture2D(u_text_texture, vec2(uvc.x, 1.0 - uvc.y)).rgb;

  float yBelow = step(uv.y, 0.0);
  float yAbove = step(1.0, uv.y);
  float xLeft = step(uv.x, 0.0);
  float xRight = step(1.0, uv.x);
  float outOfBounds = max(max(yBelow, yAbove), max(xLeft, xRight));

  if (outOfBounds > 0.0) {
    float d = 0.002;
    vec3 sum = vec3(0.0);
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    base = sum / 9.0;
  }
  return base;
}

void main () {
  float offset = texture2D(u_output_texture, vUv).r;

  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity += .001;

  vec2 img_uv = get_img_uv();
  img_uv -= u_disturb_power * normalize(velocity) * offset;
  img_uv -= u_disturb_power * normalize(velocity) * offset;

  vec2 frame_uv = get_frame_uv();
  frame_uv -= u_disturb_power * normalize(velocity) * offset;

  vec3 img = sample_image_smooth(img_uv);
  float opacity = get_img_frame_alpha(frame_uv, .002);
  gl_FragColor = vec4(img * opacity, opacity);
}
`;

type FBO = {
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach(id: number): number;
};

type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read(): FBO;
  write(): FBO;
  swap(): void;
};

type Program = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

export function LiquidVideo({
  poster,
  video,
  ratio = "16 / 9",
  eyebrow,
  resolution = 7,
  cursorSize = 60,
  intensity = 55,
  className = "",
}: {
  poster: string;
  video?: string;
  ratio?: string;
  eyebrow: string;
  resolution?: number;
  cursorSize?: number;
  intensity?: number;
  className?: string;
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

    const glMaybe = canvas.getContext("webgl", { alpha: true });
    if (!glMaybe) {
      setGlFailed(true);
      return;
    }
    const gl: any = glMaybe;
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");
    gl.clearColor(0, 0, 0, 0);

    const cp = intensity / 100;
    const params = {
      cursorRadiusPx: cursorSize,
      cursorPower: 5 + ((cp - 0.1) * (50 - 5)) / (1 - 0.1),
      distortionPower: intensity / 100,
    };
    const overscanFactor = 1.2;
    const innerScale = 5 / 6;
    const pointer = {
      x: 0.65 * wrap.clientWidth,
      y: 0.5 * wrap.clientHeight,
      dx: 0,
      dy: 0,
      moved: false,
    };
    const res = { w: 0, h: 0 };
    let outputColor: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let pressure: DoubleFBO;
    let imageTexture: WebGLTexture | null = null;
    let imgRatio = 1;
    let isHovering = false;
    let visible = true;

    /* ── video texture source (optional) ─────────────────────────────── */
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
          imgRatio = (vid.videoWidth || 1) / Math.max(1, vid.videoHeight || 1);
          setHasVideo(true);
          vid.play().catch(() => {});
        },
        { once: true }
      );
      vid.src = video;
    }

    /* ── shader helpers ──────────────────────────────────────────────── */
    function createShader(source: string, type: number) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || "Shader compile error";
        gl.deleteShader(shader);
        throw new Error(info);
      }
      return shader;
    }
    function createProgramFromSources(vsSource: string, fsSource: string): Program {
      const program = gl.createProgram();
      const vs = createShader(vsSource, gl.VERTEX_SHADER);
      const fs = createShader(fsSource, gl.FRAGMENT_SHADER);
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, "a_position");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) || "Program link error";
        throw new Error(info);
      }
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const active = gl.getActiveUniform(program, i);
        if (!active) continue;
        uniforms[active.name] = gl.getUniformLocation(program, active.name);
      }
      return { program, uniforms };
    }

    let quadVbo: WebGLBuffer | null = null;
    let quadEbo: WebGLBuffer | null = null;
    function blit(target: FBO | null = null) {
      if (!quadVbo) {
        quadVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
          gl.STATIC_DRAW
        );
        quadEbo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadEbo);
        gl.bufferData(
          gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array([0, 1, 2, 0, 2, 3]),
          gl.STATIC_DRAW
        );
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadEbo);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function createFBO(w: number, h: number): FBO {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      /* RGBA/UNSIGNED_BYTE — universally supported. Float textures need
         OES_texture_float + WEBGL_color_buffer_float which silently fail
         on many systems (blank canvas). 8-bit is plenty for this effect. */
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error("Framebuffer incomplete");
      }
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        fbo,
        width: w,
        height: h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }
    function createDoubleFBO(w: number, h: number): DoubleFBO {
      let fbo1 = createFBO(w, h);
      let fbo2 = createFBO(w, h);
      return {
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        read: () => fbo1,
        write: () => fbo2,
        swap() {
          const tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        },
      };
    }

    let splatProgram: Program;
    let divergenceProgram: Program;
    let pressureProgram: Program;
    let gradientSubtractProgram: Program;
    let advectionProgram: Program;
    let displayProgram: Program;
    try {
      splatProgram = createProgramFromSources(VERT, FRAG_POINT);
      divergenceProgram = createProgramFromSources(VERT, FRAG_DIVERGENCE);
      pressureProgram = createProgramFromSources(VERT, FRAG_PRESSURE);
      gradientSubtractProgram = createProgramFromSources(VERT, FRAG_GRAD_SUB);
      advectionProgram = createProgramFromSources(VERT, FRAG_ADVECT);
      displayProgram = createProgramFromSources(VERT, FRAG_OUTPUT);
    } catch {
      setGlFailed(true);
      return;
    }

    function initFBOs() {
      outputColor = createDoubleFBO(res.w, res.h);
      velocity = createDoubleFBO(res.w, res.h);
      divergence = createFBO(res.w, res.h);
      pressure = createDoubleFBO(res.w, res.h);
    }
    function resizeCanvas() {
      const width = wrap!.clientWidth;
      const height = wrap!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(2, Math.round(width * overscanFactor * dpr));
      canvas!.height = Math.max(2, Math.round(height * overscanFactor * dpr));
      const cssW = width * overscanFactor;
      const cssH = height * overscanFactor;
      canvas!.style.width = `${cssW}px`;
      canvas!.style.height = `${cssH}px`;
      const ratio = cssW / cssH;
      const baseResolution = 128 + ((resolution - 1) * (512 - 128)) / 9;
      res.w = Math.round(baseResolution * ratio);
      res.h = Math.round(baseResolution);
    }
    function getPointerUV() {
      const cssW = wrap!.clientWidth * overscanFactor;
      const cssH = wrap!.clientHeight * overscanFactor;
      const dx = 0.5 * (cssW - wrap!.clientWidth);
      const dy = 0.5 * (cssH - wrap!.clientHeight);
      const u = (pointer.x + dx) / cssW;
      const v = 1 - (pointer.y + dy) / cssH;
      return { u, v };
    }
    function updatePointerPosition(eX: number, eY: number) {
      pointer.moved = true;
      pointer.dx = 6 * (eX - pointer.x);
      pointer.dy = 6 * (eY - pointer.y);
      pointer.x = eX;
      pointer.y = eY;
    }

    /* ── poster image texture ────────────────────────────────────────── */
    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
      imageTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };
    img.src = poster;

    /* ── events ──────────────────────────────────────────────────────── */
    const onEnter = () => {
      isHovering = true;
    };
    const onLeave = () => {
      isHovering = false;
      pointer.moved = false;
    };
    const onClick = (e: MouseEvent) => {
      if (!isHovering) return;
      const rect = wrap.getBoundingClientRect();
      updatePointerPosition(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onMove = (e: MouseEvent) => {
      if (!isHovering) return;
      const rect = wrap.getBoundingClientRect();
      updatePointerPosition(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onTouchMove = (e: TouchEvent) => {
      isHovering = true;
      e.preventDefault();
      const t = e.targetTouches[0];
      const rect = wrap.getBoundingClientRect();
      updatePointerPosition(t.clientX - rect.left, t.clientY - rect.top);
    };
    const onTouchStart = () => {
      isHovering = true;
    };
    const onTouchEnd = () => {
      isHovering = false;
      pointer.moved = false;
    };
    const onResize = () => {
      try {
        resizeCanvas();
        initFBOs();
      } catch {
        /* keep last good state */
      }
      if (imageTexture) gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    };
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0.02 }
    );
    io.observe(wrap);

    try {
      resizeCanvas();
      initFBOs();
    } catch {
      setGlFailed(true);
      return;
    }

    /* ── render loop ─────────────────────────────────────────────────── */
    let raf = 0;
    const render = () => {
      raf = requestAnimationFrame(render);
      if (disposed || !visible || document.hidden) return;
      if (!imageTexture) return; // nothing to show until poster/video loads

      /* upload current video frame (or poster) as the live texture */
      if (vid && vidReady && vid.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
        } catch {
          /* ignore mid-decode frames */
        }
      }

      const dt = 1 / 60;

      /* heavy fluid passes only while hovering */
      if (isHovering && pointer.moved) {
        pointer.moved = false;
        gl.useProgram(splatProgram.program);
        gl.uniform1i(splatProgram.uniforms.u_input_texture, velocity.read().attach(1));
        gl.uniform1f(
          splatProgram.uniforms.u_ratio,
          wrap.clientWidth / Math.max(1, wrap.clientHeight)
        );
        const uv = getPointerUV();
        gl.uniform2f(splatProgram.uniforms.u_point, uv.u, uv.v);
        gl.uniform3f(splatProgram.uniforms.u_point_value, pointer.dx, -pointer.dy, 0);
        const ch = Math.max(1, wrap.clientHeight);
        const rr = params.cursorRadiusPx / ch;
        gl.uniform1f(splatProgram.uniforms.u_point_size, rr * rr);
        blit(velocity.write());
        velocity.swap();
        gl.uniform1i(splatProgram.uniforms.u_input_texture, outputColor.read().attach(1));
        gl.uniform3f(splatProgram.uniforms.u_point_value, params.cursorPower * 0.001, 0, 0);
        blit(outputColor.write());
        outputColor.swap();
      }

      if (isHovering) {
        gl.useProgram(divergenceProgram.program);
        gl.uniform2f(
          divergenceProgram.uniforms.u_texel,
          velocity.texelSizeX,
          velocity.texelSizeY
        );
        gl.uniform1i(divergenceProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
        blit(divergence);

        gl.useProgram(pressureProgram.program);
        gl.uniform2f(
          pressureProgram.uniforms.u_texel,
          velocity.texelSizeX,
          velocity.texelSizeY
        );
        gl.uniform1i(pressureProgram.uniforms.u_divergence_texture, divergence.attach(1));
        for (let i = 0; i < 16; i++) {
          gl.uniform1i(
            pressureProgram.uniforms.u_pressure_texture,
            pressure.read().attach(2)
          );
          blit(pressure.write());
          pressure.swap();
        }

        gl.useProgram(gradientSubtractProgram.program);
        gl.uniform2f(
          gradientSubtractProgram.uniforms.u_texel,
          velocity.texelSizeX,
          velocity.texelSizeY
        );
        gl.uniform1i(
          gradientSubtractProgram.uniforms.u_pressure_texture,
          pressure.read().attach(1)
        );
        gl.uniform1i(
          gradientSubtractProgram.uniforms.u_velocity_texture,
          velocity.read().attach(2)
        );
        blit(velocity.write());
        velocity.swap();

        gl.useProgram(advectionProgram.program);
        gl.uniform2f(
          advectionProgram.uniforms.u_texel,
          velocity.texelSizeX,
          velocity.texelSizeY
        );
        gl.uniform2f(
          advectionProgram.uniforms.u_output_textel,
          velocity.texelSizeX,
          velocity.texelSizeY
        );
        gl.uniform1i(advectionProgram.uniforms.u_velocity_texture, velocity.read().attach(1));
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, velocity.read().attach(1));
        gl.uniform1f(advectionProgram.uniforms.u_dt, dt);
        gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.97);
        blit(velocity.write());
        velocity.swap();

        gl.useProgram(advectionProgram.program);
        gl.uniform2f(
          advectionProgram.uniforms.u_output_textel,
          outputColor.texelSizeX,
          outputColor.texelSizeY
        );
        gl.uniform1i(advectionProgram.uniforms.u_input_texture, outputColor.read().attach(2));
        gl.uniform1f(advectionProgram.uniforms.u_dt, 8 * dt);
        gl.uniform1f(advectionProgram.uniforms.u_dissipation, 0.98);
        blit(outputColor.write());
        outputColor.swap();
      }

      /* display pass — distorted while hovering, clean blit when idle */
      gl.useProgram(displayProgram.program);
      const uv2 = getPointerUV();
      gl.uniform2f(displayProgram.uniforms.u_point, uv2.u, uv2.v);
      gl.uniform1i(displayProgram.uniforms.u_velocity_texture, velocity.read().attach(2));
      gl.uniform1f(
        displayProgram.uniforms.u_ratio,
        wrap.clientWidth / Math.max(1, wrap.clientHeight)
      );
      gl.uniform1f(displayProgram.uniforms.u_img_ratio, imgRatio);
      gl.uniform1f(
        displayProgram.uniforms.u_disturb_power,
        isHovering ? params.distortionPower : 0
      );
      gl.uniform1i(displayProgram.uniforms.u_output_texture, outputColor.read().attach(1));
      gl.uniform1f(displayProgram.uniforms.u_canvas_scale, 1);
      gl.uniform1f(displayProgram.uniforms.u_inner_scale, innerScale);
      if (imageTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.uniform1i(displayProgram.uniforms.u_text_texture, 0);
      }
      blit();
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
    raf = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      io.disconnect();
      if (vid) {
        vid.pause();
        vid.removeAttribute("src");
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [poster, video, resolution, cursorSize, intensity, reduced]);

  return (
    <div
      ref={wrapRef}
      className={`group relative w-full overflow-hidden rounded-2xl border border-cream/10 bg-abyss ${className}`}
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
        <canvas
          ref={canvasRef}
          className="absolute block h-full w-full"
          style={{ top: "-10%", left: "-10%", width: "120%", height: "120%" } as CSSProperties}
        />
      )}

      {/* grade + vignette overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/80 via-transparent to-abyss/25" />

      <span className="absolute left-4 top-4 rounded-md bg-abyss/55 px-2.5 py-1 text-[9px] tracking-[0.3em] text-cream/90 backdrop-blur-sm">
        {eyebrow}
      </span>
      <span className="absolute right-4 top-4 hidden rounded-md border border-cream/20 px-2.5 py-1 text-[9px] tracking-[0.25em] text-cream/70 md:block">
        {hasVideo ? "LIVE · FLUID DISTORTION" : "UNREAL ENGINE 5 RENDER"}
      </span>
    </div>
  );
}