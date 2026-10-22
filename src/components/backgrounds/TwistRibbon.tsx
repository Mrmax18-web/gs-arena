// Twist Ribbon — Originkit DriftingLeftSmooth
import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useBackground } from '../../context/BackgroundContext';

type RGBA = [number, number, number, number];

const COLOR_CACHE = new Map<string, RGBA | null>();

function parseColor(input: string | undefined, fallback: RGBA): RGBA {
  if (typeof input !== 'string') return fallback;
  let hit = COLOR_CACHE.get(input);
  if (hit === undefined) {
    hit = parseColorRaw(input);
    COLOR_CACHE.set(input, hit);
  }
  return hit ?? fallback;
}

function parseColorRaw(raw: string): RGBA | null {
  let s = raw.trim();
  const v = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(s);
  if (v) s = v[1].trim();
  if (s[0] === '#') {
    const h = s.slice(1);
    const x = (a: string) => parseInt(a, 16);
    let r: number,
      g: number,
      b: number,
      a = 255;
    if (h.length === 3 || h.length === 4) {
      r = x(h[0] + h[0]);
      g = x(h[1] + h[1]);
      b = x(h[2] + h[2]);
      if (h.length === 4) a = x(h[3] + h[3]);
    } else if (h.length === 6 || h.length === 8) {
      r = x(h.slice(0, 2));
      g = x(h.slice(2, 4));
      b = x(h.slice(4, 6));
      if (h.length === 8) a = x(h.slice(6, 8));
    } else return null;
    const out: RGBA = [r / 255, g / 255, b / 255, a / 255];
    return out.every(Number.isFinite) ? out : null;
  }
  const m = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(s);
  if (!m) return null;
  const parts = m[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const num = (p: string, scale: number) =>
    p.endsWith('%') ? (parseFloat(p) / 100) * scale : parseFloat(p);
  const alpha = parts.length > 3 ? num(parts[3], 1) : 1;
  let rgb: [number, number, number];
  if (m[1].toLowerCase().startsWith('rgb')) {
    rgb = [num(parts[0], 255) / 255, num(parts[1], 255) / 255, num(parts[2], 255) / 255];
  } else {
    const hh = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360;
    const ss = num(parts[1], 1),
      ll = num(parts[2], 1);
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const f = (t: number) => {
      t = (t + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    rgb = [f(hh + 1 / 3), f(hh), f(hh - 1 / 3)];
  }
  const out: RGBA = [rgb[0], rgb[1], rgb[2], alpha];
  return out.every(Number.isFinite)
    ? (out.map((c) => Math.min(1, Math.max(0, c))) as RGBA)
    : null;
}

const ADVANCED_DEFAULTS = {
  driftSec: 64,
  twistRate: 300,
  breathe: 0,
  boxHeight: 110,
  positionY: 50,
  halfWidth: 50,
  pinchWidth: 50,
  curl: 90,
  topLight: 200,
  pinchLight: 0,
  fold: 105,
  blueSpan: 15,
  blueSide: 0,
  fullBlueAt: 89,
  fullBlue: 100,
  dither: 0,
  blueGlow: 35,
  edgeDither: 0,
  ribbonGrain: 0,
  grainPx: 1,
  cool: 80,
  coolEnd: 1,
  goldColor: '#FF0000',
  highColor: '#CF2A2A',
  blueDeep: '#E42222',
  blueHigh: '#A50B0B',
  paleColor: '#F8F4EA',
  coolTint: '#DCE6F5',
  vignette: 0,
};

interface EffectProps {
  thickness?: number;
  colorSplit?: number;
  direction?: number;
  advanced?: Partial<typeof ADVANCED_DEFAULTS>;
}

function clampN(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface Props extends EffectProps {
  background?: string;
  baseColor?: string;
  accentColor?: string;
  speed?: number;
  scale?: number;
  hover?: number;
  style?: CSSProperties;
}

function num(v: unknown, d: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d;
}

function effectUniforms(
  gl: WebGL2RenderingContext,
  u: (name: string) => WebGLUniformLocation | null,
  p: Props
): void {
  const adv = { ...ADVANCED_DEFAULTS, ...(p.advanced ?? {}) };
  const f = (name: string, v: number) => gl.uniform1f(u(name), v);
  const c3 = (name: string, v: string | undefined, fb: RGBA) => {
    const c = parseColor(v, fb);
    gl.uniform3f(u(name), c[0], c[1], c[2]);
  };
  const split = clampN(num(p.colorSplit, 52), 0, 100) / 100;
  f('uThick', clampN(num(p.thickness, 100), 20, 300) / 100);
  f('uBlueStart', split);
  f('uBlueEnd', split + clampN(num(adv.blueSpan, 14), 1, 50) / 100);
  f('uFullFrom', split + clampN(num(adv.fullBlueAt, 32), 0, 100) / 100);
  f('uFullBlue', clampN(num(adv.fullBlue, 100), 0, 100) / 100);
  f('uBlueSide', clampN(num(adv.blueSide, 0), -100, 100) / 100);
  f('uDrift', Math.max(1, num(adv.driftSec, 20)));
  f('uDirection', ((((num(p.direction, 0) % 360) + 360) % 360) * Math.PI) / 180);
  f('uTwistRate', clampN(num(adv.twistRate, 110), 0, 300) / 100);
  f('uBreathe', clampN(num(adv.breathe, 8), 0, 50) / 100);
  f('uAspect', clampN(num(adv.boxHeight, 100), 5, 200) / 100);
  f('uPosY', clampN(num(adv.positionY, 50), 0, 100) / 100);
  f('uWidth', clampN(num(adv.halfWidth, 17), 2, 50) / 100);
  f('uMinWidth', clampN(num(adv.pinchWidth, 10), 0, 50) / 100);
  f('uCurl', (clampN(num(adv.curl, 50), 0, 90) * Math.PI) / 180);
  f('uLight', clampN(num(adv.topLight, 100), 0, 200) / 100);
  f('uPinchLight', clampN(num(adv.pinchLight, 60), 0, 200) / 100);
  f('uFold', clampN(num(adv.fold, 100), 0, 200) / 100);
  f('uDither', clampN(num(adv.dither, 35), 0, 100) / 100);
  f('uBlueGlow', clampN(num(adv.blueGlow, 35), 0, 100) / 100);
  f('uEdgeDither', clampN(num(adv.edgeDither, 4), 0, 50) / 100);
  f('uRibbonGrain', clampN(num(adv.ribbonGrain, 25), 0, 100) / 100);
  f('uGrainPx', clampN(num(adv.grainPx, 1), 1, 6));
  f('uCool', clampN(num(adv.cool, 80), 0, 100) / 100);
  f('uCoolEnd', clampN(num(adv.coolEnd, 15), 1, 50) / 100);
  f('uVignette', clampN(num(adv.vignette, 0), 0, 100) / 100);
  c3('uGold', adv.goldColor, [0.89, 0.74, 0.47, 1]);
  c3('uHigh', adv.highColor, [0.98, 0.96, 0.89, 1]);
  c3('uBlueDeep', adv.blueDeep, [0.25, 0.49, 0.9, 1]);
  c3('uBlueHigh', adv.blueHigh, [0.35, 0.58, 0.94, 1]);
  c3('uPale', adv.paleColor, [0.97, 0.96, 0.92, 1]);
  c3('uCoolTint', adv.coolTint, [0.86, 0.9, 0.96, 1]);
}

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uBg;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform float uScale;
uniform float uThick;
uniform float uBlueStart;
uniform float uBlueEnd;
uniform float uFullFrom;
uniform float uFullBlue;
uniform float uBlueSide;
uniform float uDrift;
uniform float uDirection;
uniform float uTwistRate;
uniform float uBreathe;
uniform float uAspect;
uniform float uPosY;
uniform float uWidth;
uniform float uMinWidth;
uniform float uCurl;
uniform float uLight;
uniform float uPinchLight;
uniform float uFold;
uniform float uDither;
uniform float uBlueGlow;
uniform float uEdgeDither;
uniform float uRibbonGrain;
uniform float uGrainPx;
uniform float uCool;
uniform float uCoolEnd;
uniform float uVignette;
uniform vec3 uGold;
uniform vec3 uHigh;
uniform vec3 uBlueDeep;
uniform vec3 uBlueHigh;
uniform vec3 uPale;
uniform vec3 uCoolTint;
out vec4 outColor;

const float CL[16] = float[16](0.345, 0.30, 0.44, 0.57, 0.74, 0.63, 0.50, 0.56, 0.67, 0.62, 0.42, 0.33, 0.45, 0.66, 0.60, 0.42);
const float TW[16] = float[16](-0.3, 0.0, 0.68, 1.41, 1.89, 2.35, 2.9, 3.54, 4.1, 4.6, 5.3, 5.9, 6.6, 7.3, 8.0, 8.8);

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

int wrap16(int i) { return i - 16 * (i / 16); }
float clAt(int i) { return CL[wrap16(i)]; }
float twAt(int i) { int j = wrap16(i); return TW[j] + 10.0 * float(i / 16); }

float cr(float a, float b, float c, float d, float t) {
    return 0.5 * (2.0 * b + (-a + c) * t + (2.0 * a - 5.0 * b + 4.0 * c - d) * t * t + (-a + 3.0 * b - 3.0 * c + d) * t * t * t);
}
float crd(float a, float b, float c, float d, float t) {
    return 0.5 * ((-a + c) + 2.0 * (2.0 * a - 5.0 * b + 4.0 * c - d) * t + 3.0 * (-a + 3.0 * b - 3.0 * c + d) * t * t);
}

float centre(float s) {
    float u = s * 8.0;
    float fi = floor(u);
    int i = int(fi);
    return cr(clAt(i - 1), clAt(i), clAt(i + 1), clAt(i + 2), u - fi);
}
float centreSlope(float s) {
    float u = s * 8.0;
    float fi = floor(u);
    int i = int(fi);
    return crd(clAt(i - 1), clAt(i), clAt(i + 1), clAt(i + 2), u - fi) * 8.0;
}
float twist(float s) {
    float u = s * 8.0;
    float fi = floor(u);
    int i = int(fi);
    return cr(twAt(i - 1), twAt(i), twAt(i + 1), twAt(i + 2), u - fi);
}

void main() {
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    float sc = max(uScale, 0.05);
    float boxH = max(uRes.y * uAspect * sc, 1.0);

    float dirCa = cos(uDirection);
    float dirSa = sin(uDirection);
    vec2 dirCenter = vec2(uRes.x * 0.5, uRes.y * uPosY);
    vec2 dirRel = px - dirCenter;
    vec2 rp = vec2(dirRel.x * dirCa - dirRel.y * dirSa, dirRel.x * dirSa + dirRel.y * dirCa) + dirCenter;

    float xs = rp.x / max(uRes.x, 1.0);
    float xr = 0.5 + (xs - 0.5) / sc;
    float yr = 0.5 + (rp.y - uRes.y * uPosY) / boxH;

    float tt = uTime / max(uDrift, 0.1);
    float sC = xr + tt + 20.0;
    float sT = xr + tt * uTwistRate + 20.0;

    float breathe = 1.0 + uBreathe * sin(3.14159265 * tt);
    float c = 0.52 + (centre(sC) - 0.52) * breathe;
    float slope = centreSlope(sC) * breathe;
    float dd = 0.06;
    float c2 = (centre(sC + dd) - 2.0 * centre(sC) + centre(sC - dd)) / (dd * dd) * breathe;

    vec2 mousePx = vec2(uMouse.x * uRes.x, (1.0 - uMouse.y) * uRes.y);
    vec2 mouseRel = mousePx - dirCenter;
    vec2 mrp = vec2(mouseRel.x * dirCa - mouseRel.y * dirSa, mouseRel.x * dirSa + mouseRel.y * dirCa) + dirCenter;
    float mxr = 0.5 + (mrp.x / max(uRes.x, 1.0) - 0.5) / sc;
    float myr = 0.5 + (mrp.y - uRes.y * uPosY) / boxH;
    float sM = mxr + tt + 20.0;
    float dyM = (0.52 + (centre(sM) - 0.52) * breathe) - myr;
    float push = dyM / sqrt(dyM * dyM + 0.004) * exp(-dyM * dyM / 0.12);
    float gx = xr - mxr;
    float g = exp(-gx * gx / 0.02);
    float amp = uHover * 0.08 * push;
    c += amp * g;

    slope += amp * g * (-2.0 * gx / 0.02);

    float th = 3.14159265 * twist(sT);
    float cs = cos(th);

    float h = uWidth * uThick * sqrt(cs * cs + uMinWidth * uMinWidth) * sqrt(1.0 + slope * slope * 0.0686);
    h = max(h, 1e-4);
    float vs = (yr - c) / h;

    vec2 gp = floor(gl_FragCoord.xy / max(uGrainPx, 1.0));
    float n1 = h21(gp);
    float n2 = h21(gp + 17.31);
    float n3 = h21(gp + 91.7);

    float edge = 1.0 - uEdgeDither * n1;
    float aa = 1.0 / max(h * boxH, 1.0);
    float inside = 1.0 - smoothstep(edge - aa, edge, abs(vs));

    float thl = th + uCurl * vs;
    float cl = cos(thl);
    float face = cl >= 0.0 ? 1.0 : -1.0;
    float up = sin(thl) * face;
    float fold = clamp(c2 * 0.04, -1.0, 1.0);
    float s = 0.52 + 0.28 * uLight * up + 0.25 * uPinchLight * (1.0 - abs(cs)) - 0.5 * uFold * max(0.0, vs * fold);
    s = clamp(s, 0.0, 1.0);

    vec3 cream = s < 0.5 ? mix(uGold, uBase, s * 2.0) : mix(uBase, uHigh, (s - 0.5) * 2.0);
    vec3 blue = s < 0.5 ? mix(uBlueDeep, uAccent, s * 2.0) : mix(uAccent, uBlueHigh, (s - 0.5) * 2.0);

    float ramp = smoothstep(uBlueStart, max(uBlueEnd, uBlueStart + 1e-3), xs);
    float side = smoothstep(-0.3, 0.6, vs + uBlueSide);
    float full = smoothstep(uFullFrom, uFullFrom + 0.13, xs) * uFullBlue;
    float b = ramp * max(side, full);
    b = clamp(b + (n2 - 0.5) * uDither * (1.0 - abs(b * 2.0 - 1.0)), 0.0, 1.0);
    vec3 col = mix(cream, blue, b);

    float trans = 1.0 - abs(b * 2.0 - 1.0);
    col += (1.0 - col) * trans * uBlueGlow;

    float cool = (1.0 - smoothstep(0.0, max(uCoolEnd, 1e-3), xs)) * smoothstep(-0.2, 0.9, vs) * uCool;
    col = mix(col, mix(uPale, uCoolTint, smoothstep(0.4, 1.0, vs)), cool);

    col += (n3 - 0.5) * uRibbonGrain * 0.35 * (0.6 + 0.4 * max(b, trans));

    col = mix(uBg, clamp(col, 0.0, 1.0), inside);

    vec2 uv = gl_FragCoord.xy / uRes;
    col *= 1.0 - uVignette * smoothstep(0.3, 0.85, length(uv - 0.5) * 1.2);

    outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function __OriginkitBase_DriftingLeftSmooth(props: Props) {
  const {
    background = '#000000',
    baseColor = '#DE0202',
    accentColor = '#D10000',
    speed = 50,
    scale = 163,
    hover = 200,
    style,
  } = props;
  void [baseColor, accentColor, speed, scale, hover];
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
    if (!gl) return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('DriftingLeftSmooth shader:', gl.getShaderInfoLog(s));
      }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('DriftingLeftSmooth link:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const cache = new Map<string, WebGLUniformLocation | null>();
    const u = (name: string) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
      return cache.get(name) ?? null;
    };

    let W = 0;
    let H = 0;
    const resize = () => {
      W = root.offsetWidth;
      H = root.offsetHeight;
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(root);
    resize();

    let mx = 0.5;
    let my = 0.5;
    let tx = 0.5;
    let ty = 0.5;
    let over = 0;
    let hov = 0;
    const onMove = (e: PointerEvent) => {
      if (W <= 0 || H <= 0) return;
      const rect = root.getBoundingClientRect();
      tx = (e.clientX - rect.left) / W;
      ty = 1 - (e.clientY - rect.top) / H;
      over = 1;
    };
    const onLeave = () => {
      over = 0;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });

    // Performance optimizations: 30 FPS cap, frame skip, pause on hidden/offscreen
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // ~33.33ms
    let lastFrameTime = performance.now();
    let clock = 0;
    let raf = 0;
    let last = -1;
    let isPaused = false;
    let isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;
    let isIntersecting = true;

    const renderFrame = (dt: number) => {
      const p = propsRef.current;
      clock =
        (clock +
          dt *
            (Math.max(0, Math.min(100, num(p.speed, 50))) / 50)) %
        3600;
      const k = 1 - Math.exp(-dt * 6);
      mx += (tx - mx) * k;
      my += (ty - my) * k;
      hov += (over - hov) * k;
      const bg = parseColor(p.background, [0.03, 0.03, 0.04, 1]);
      const base = parseColor(p.baseColor, [0.23, 0.18, 0.55, 1]);
      const acc = parseColor(p.accentColor, [0.91, 0.42, 0.57, 1]);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
      gl.uniform1f(u('uTime'), clock);
      gl.uniform2f(u('uMouse'), mx, my);
      gl.uniform1f(u('uHover'), hov * (Math.max(0, Math.min(200, num(p.hover, 100))) / 100));
      gl.uniform3f(u('uBg'), bg[0], bg[1], bg[2]);
      gl.uniform3f(u('uBase'), base[0], base[1], base[2]);
      gl.uniform3f(u('uAccent'), acc[0], acc[1], acc[2]);
      gl.uniform1f(u('uScale'), Math.max(10, Math.min(300, num(p.scale, 100))) / 100);
      effectUniforms(gl, u, p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const updatePauseState = () => {
      const shouldPause = !isDocumentVisible || !isIntersecting;
      if (shouldPause && !isPaused) {
        isPaused = true;
      } else if (!shouldPause && isPaused) {
        isPaused = false;
        last = performance.now();
        lastFrameTime = performance.now();
      }
    };

    const onVisibilityChange = () => {
      isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;
      updatePauseState();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isIntersecting = entry.isIntersecting;
          }
          updatePauseState();
        },
        { threshold: 0.01 }
      );
      io.observe(root);
    }

    // Check prefers-reduced-motion once on mount: freeze animation to static frame if set
    if (reduced) {
      renderFrame(0);
      return () => {
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibilityChange);
        }
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerleave', onLeave);
        if (gl) {
          gl.deleteShader(vs);
          gl.deleteShader(fs);
          gl.deleteProgram(prog);
          gl.deleteBuffer(buf);
        }
      };
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (isPaused) return;

      const elapsed = now - lastFrameTime;
      if (elapsed < FRAME_INTERVAL) {
        return; // Cheap frame skip to maintain ~30 FPS
      }
      lastFrameTime = now - (elapsed % FRAME_INTERVAL);

      const dt = last < 0 ? 0 : Math.min((now - last) / 1000, 1 / 20);
      last = now;
      renderFrame(dt);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      if (gl) {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteProgram(prog);
        gl.deleteBuffer(buf);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        position: 'relative',
        minWidth: 1200,
        minHeight: 800,
        overflow: 'hidden',
        background,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

const __originkitPresetProps = {
  speed: 30,
  scale: 100,
  hover: 99,
  direction: 7,
  advanced: {
    cool: 80,
    curl: 90,
    fold: 105,
    grain: 0,
    dither: 0,
    breathe: 0,
    coolEnd: 1,
    grainPx: 1,
    blueDeep: '#E42222',
    blueGlow: 35,
    blueHigh: '#A50B0B',
    blueSide: 0,
    blueSpan: 15,
    coolTint: '#DCE6F5',
    driftSec: 64,
    fullBlue: 100,
    topLight: 200,
    vignette: 0,
    boxHeight: 110,
    goldColor: '#FF0000',
    halfWidth: 50,
    highColor: '#CF2A2A',
    paleColor: '#F8F4EA',
    positionY: 50,
    twistRate: 300,
    edgeDither: 0,
    fullBlueAt: 89,
    pinchLight: 0,
    pinchWidth: 50,
    ribbonGrain: 0,
  },
};

export default function DriftingLeftSmooth(props: Record<string, unknown>) {
  const mergedAdvanced = {
    ...__originkitPresetProps.advanced,
    ...((props.advanced as Record<string, unknown>) || {}),
  };
  return (
    <__OriginkitBase_DriftingLeftSmooth
      {...(__originkitPresetProps as Record<string, unknown>)}
      {...props}
      advanced={mergedAdvanced}
    />
  );
}

/**
 * App-wide background layer embedding DriftingLeftSmooth in a full-screen fixed container.
 * Defers mounting WebGL context by ~500ms after first paint to optimize initial paint time,
 * clearing the mount timer cleanly if unmounted earlier.
 */
export const TwistRibbon: React.FC = () => {
  const { config } = useBackground();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!config.enabled || !isReady) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-[#000000]"
      />
    );
  }

  const overrides: Record<string, unknown> = {};
  overrides.background = config.background || '#000000';
  overrides.baseColor = config.baseColor || config.colors?.[0] || '#DE0202';
  overrides.accentColor = config.accentColor || config.colors?.[1] || '#D10000';

  if (typeof config.speed === 'number') overrides.speed = config.speed;
  if (typeof config.scale === 'number') overrides.scale = config.scale;
  if (typeof config.hover === 'number') overrides.hover = config.hover;
  if (typeof config.colorSplit === 'number') overrides.colorSplit = config.colorSplit;
  if (typeof config.ribbonGrain === 'number') overrides.ribbonGrain = config.ribbonGrain;

  overrides.advanced = {
    ...ADVANCED_DEFAULTS,
    ...(config.advanced || {}),
  };

  return (
    <DriftingLeftSmooth
      {...overrides}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
