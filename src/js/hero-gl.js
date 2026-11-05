// WebGL "lens" hero: the reel is rendered as a VIRGA-violet duotone; a lens following the
// pointer reveals the true colours (with magnification + chromatic aberration). Slides
// change through a noise "burn" transition. One full-screen triangle, one fragment shader.
import { gsap, damp, reduced, loadImage } from './core.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uLens;
uniform float uProgress;
uniform float uTime;
uniform float uIntro;
uniform float uVel;

vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 coverUv(vec2 uv, vec2 img){
  float rs = uRes.x / uRes.y;
  float ri = img.x / img.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 scene(vec2 uv, float mixv, float wob){
  vec2 d = vec2(wob, -wob * 0.6);
  vec3 a = texture2D(uTexA, coverUv(uv + d, uSizeA)).rgb;
  vec3 b = texture2D(uTexB, coverUv(uv - d, uSizeB)).rgb;
  return mix(a, b, mixv);
}

vec3 duotone(vec3 c){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  l = smoothstep(0.03, 0.97, l);
  vec3 c0 = vec3(0.016, 0.012, 0.065);
  vec3 c1 = vec3(0.20, 0.065, 0.42);
  vec3 c2 = vec3(0.50, 0.20, 0.86);
  vec3 c3 = vec3(0.84, 0.70, 1.0);
  vec3 col = mix(c0, c1, smoothstep(0.0, 0.45, l));
  col = mix(col, c2, smoothstep(0.4, 0.82, l));
  col = mix(col, c3, smoothstep(0.82, 1.0, l) * 0.5);
  return col;
}

void main(){
  vec2 uv = vUv;
  vec2 px = uv * uRes;
  float aspect = uRes.x / uRes.y;
  float zoom = 1.0 - 0.07 * (1.0 - uIntro);
  vec2 drift = vec2(sin(uTime * 0.07), cos(uTime * 0.05)) * 0.006;
  vec2 uvz = (uv - 0.5) * zoom + 0.5 + drift;

  float n = snoise(vec2(uv.x * aspect, uv.y) * 2.3 + vec2(uTime * 0.035, 0.0)) * 0.5 + 0.5;
  float edge = uProgress * 1.26 - 0.13;
  float mixv = smoothstep(n - 0.09, n + 0.09, edge);
  float active = step(0.001, uProgress) * step(uProgress, 0.999);
  float burn = pow(1.0 - abs(mixv * 2.0 - 1.0), 5.0) * active;
  float wob = (n - 0.5) * 0.045 * sin(uProgress * 3.14159);

  vec3 col = duotone(scene(uvz, mixv, wob));

  vec2 dv = px - uMouse;
  float d = length(dv);
  float R = uRadius * (1.0 + uVel * 0.1);
  float inside = (1.0 - smoothstep(R - 1.5, R + 1.0, d)) * uLens;
  if (inside > 0.0) {
    float rim = smoothstep(R * 0.4, R, d);
    vec2 dir = dv / uRes;
    vec2 luv = uMouse / uRes + dir * (0.9 - rim * 0.08);
    luv = (luv - 0.5) * zoom + 0.5 + drift;
    vec2 off = dir * (0.05 + uVel * 0.12) * rim;
    vec3 lens;
    lens.r = scene(luv + off, mixv, wob).r;
    lens.g = scene(luv, mixv, wob).g;
    lens.b = scene(luv - off, mixv, wob).b;
    lens = pow(lens, vec3(0.94)) * 1.05;
    col = mix(col, lens, inside);
  }

  float ring = (1.0 - smoothstep(0.0, 2.4, abs(d - R))) * uLens;
  float ang = atan(dv.y, dv.x);
  vec3 ringCol = mix(vec3(0.18, 0.94, 0.71), vec3(0.72, 0.26, 0.97), 0.5 + 0.5 * sin(ang + uTime * 0.9));
  col += ringCol * ring;
  float glow = exp(-max(d - R, 0.0) / 30.0) * (1.0 - inside) * uLens;
  col += vec3(0.42, 0.14, 0.78) * glow * 0.2;

  col += vec3(0.78, 0.32, 1.0) * burn * 0.85 + vec3(0.18, 0.95, 0.7) * pow(burn, 3.0) * 0.45;

  vec2 vq = (uv - 0.5) * vec2(aspect, 1.0);
  col *= 1.0 - smoothstep(0.25, 1.3, length(vq));
  col += (hash(px * 0.5 + fract(uTime * 7.0) * 91.7) - 0.5) * 0.05;
  col *= uIntro;
  gl_FragColor = vec4(col, 1.0);
}`;

export class HeroLens {
  constructor(canvas, slides, { onSlide } = {}) {
    this.canvas = canvas;
    this.slides = slides;
    this.onSlide = onSlide;
    this.index = 0;
    this.u = { progress: 0, intro: 0, lens: 0, vel: 0 };
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, last: 0, active: false };
    this.visible = true;
    this.running = false;
    this.time = 0;
    // dev QA: keep rendering in background tabs when ?forcetick is set
    this.force = import.meta.env.DEV && new URLSearchParams(window.location.search).has('forcetick');
  }

  init() {
    const gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    this.gl = gl;
    const prog = this.program(VERT, FRAG);
    if (!prog) return false;
    this.prog = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.loc = {};
    ['uTexA', 'uTexB', 'uSizeA', 'uSizeB', 'uRes', 'uMouse', 'uRadius', 'uLens', 'uProgress', 'uTime', 'uIntro', 'uVel'].forEach((n) => {
      this.loc[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform1i(this.loc.uTexA, 0);
    gl.uniform1i(this.loc.uTexB, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.textures = this.slides.map(() => null);
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);

    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting), { threshold: 0 });
    this.io.observe(this.canvas);

    const pointer = (e) => {
      const r = this.canvas.getBoundingClientRect();
      if (e.clientY > r.bottom || e.clientY < r.top) return;
      this.mouse.tx = e.clientX - r.left;
      this.mouse.ty = e.clientY - r.top;
      this.mouse.last = performance.now();
      this.mouse.active = true;
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerdown', pointer, { passive: true });

    this.tick = this.tick.bind(this);
    return true;
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, vs);
    const f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  async load(i) {
    if (this.textures[i]) return this.textures[i];
    const img = await loadImage(`/media/${this.slides[i].img}.webp`);
    if (!img) return null;
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    this.textures[i] = { tex, w: img.naturalWidth, h: img.naturalHeight };
    return this.textures[i];
  }

  bind(unit, t) {
    const gl = this.gl;
    gl.activeTexture(unit === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.uniform2f(unit === 0 ? this.loc.uSizeA : this.loc.uSizeB, t.w, t.h);
  }

  resize() {
    const mobile = window.innerWidth <= 800;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.cw = w;
    this.ch = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.radius = Math.max(96, Math.min(240, Math.min(w, h) * (mobile ? 0.24 : 0.2)));
    if (!this.mouse.active) {
      this.mouse.x = this.mouse.tx = w * 0.68;
      this.mouse.y = this.mouse.ty = h * 0.42;
    }
  }

  async start() {
    const first = await this.load(0);
    if (!first) return false;
    this.bind(0, first);
    this.bind(1, first);
    this.running = true;
    gsap.ticker.add(this.tick);
    // preload the rest in the background
    this.slides.forEach((_, i) => i && this.load(i));
    if (!reduced) this.schedule();
    return true;
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.next(), 5200);
  }

  async next() {
    if (!this.visible || (document.hidden && !this.force)) return this.schedule();
    const ni = (this.index + 1) % this.slides.length;
    const t = await this.load(ni);
    if (!t) return this.schedule();
    this.bind(1, t);
    this.onSlide?.(ni, this.slides[ni]);
    gsap.fromTo(
      this.u,
      { progress: 0 },
      {
        progress: 1,
        duration: 1.9,
        ease: 'power2.inOut',
        onComplete: () => {
          this.index = ni;
          this.bind(0, t);
          this.u.progress = 0;
          this.schedule();
        },
      },
    );
  }

  intro() {
    gsap.to(this.u, { intro: 1, duration: 2.2, ease: 'power2.out' });
    gsap.to(this.u, { lens: 1, duration: 1.4, delay: 0.9, ease: 'expo.out' });
  }

  tick(time, deltaMS) {
    if (!this.running || !this.visible || (document.hidden && !this.force)) return;
    const dt = Math.min(deltaMS / 1000, 0.05);
    this.time += dt;
    const m = this.mouse;
    const idle = !m.active || performance.now() - m.last > 4000;
    if (idle) {
      // drift along a lissajous path when nobody steers the lens
      const t = this.time;
      m.tx = this.cw * (0.62 + Math.sin(t * 0.33) * 0.22);
      m.ty = this.ch * (0.42 + Math.sin(t * 0.47 + 1.2) * 0.16);
    }
    const k = damp(idle ? 0.03 : 0.16, dt * 1);
    m.x += (m.tx - m.x) * k;
    m.y += (m.ty - m.y) * k;
    const vx = (m.x - m.px) / Math.max(dt, 0.001);
    const vy = (m.y - m.py) / Math.max(dt, 0.001);
    m.px = m.x;
    m.py = m.y;
    const speed = Math.min(Math.hypot(vx, vy) / 2400, 1);
    this.u.vel += (speed - this.u.vel) * damp(0.12, dt);

    const gl = this.gl;
    const L = this.loc;
    gl.uniform2f(L.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(L.uMouse, m.x * this.dpr, (this.ch - m.y) * this.dpr);
    gl.uniform1f(L.uRadius, this.radius * this.dpr);
    gl.uniform1f(L.uLens, this.u.lens);
    gl.uniform1f(L.uProgress, this.u.progress);
    gl.uniform1f(L.uTime, this.time);
    gl.uniform1f(L.uIntro, this.u.intro);
    gl.uniform1f(L.uVel, this.u.vel);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
