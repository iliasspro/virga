import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, MorphSVGPlugin, DrawSVGPlugin, CustomEase);
CustomEase.create('virga', '0.22, 1, 0.36, 1');
CustomEase.create('virga-io', '0.76, 0, 0.24, 1');

export { gsap, ScrollTrigger, SplitText };

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobile = () => window.innerWidth <= 800;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// frame-rate independent smoothing factor
export const damp = (k, dt) => 1 - Math.pow(1 - k, dt * 60);

export function timecode(seconds, fps = 25) {
  const total = Math.max(0, Math.floor(seconds * fps));
  const f = total % fps;
  const s = Math.floor(total / fps);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f].map((n) => String(n).padStart(2, '0')).join(':');
}

export const state = { lenis: null };

export function initScroll() {
  if (reduced) return null;
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  state.lenis = lenis;
  return lenis;
}

export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el && target !== 0) return;
  if (state.lenis) {
    state.lenis.scrollTo(el ?? 0, { offset, duration: immediate ? 0 : 1.5, immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    const y = el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
    window.scrollTo({ top: y, behavior: reduced || immediate ? 'auto' : 'smooth' });
  }
}

export function lockScroll(lock) {
  if (state.lenis) lock ? state.lenis.stop() : state.lenis.start();
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}

export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
