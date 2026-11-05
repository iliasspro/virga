import { gsap, $, $$, finePointer, reduced, damp } from './core.js';

const LABELS = { view: 'Voir', play: 'Play', brief: 'Brief', drag: 'Glisser' };

export function initCursor() {
  if (!finePointer) return;
  document.documentElement.classList.add('has-cursor');
  const root = $('.cursor');
  const dot = $('.cursor__dot', root);
  const ring = $('.cursor__ring', root);
  const label = $('.cursor__label', root);
  const p = { x: window.innerWidth / 2, y: window.innerHeight / 2, rx: window.innerWidth / 2, ry: window.innerHeight / 2 };
  let current = '';

  const setState = (s) => {
    if (s === current) return;
    current = s;
    root.dataset.state = s;
    if (LABELS[s]) label.textContent = LABELS[s];
  };

  const resolve = (t) => {
    if (!(t instanceof Element)) return setState('');
    // embedded players get the native cursor
    root.style.opacity = t.closest('iframe, .vmodal__player') ? 0 : 1;
    const c = t.closest('[data-cursor]');
    if (c) return setState(c.dataset.cursor);
    if (t.closest('input, textarea')) return setState('text');
    if (t.closest('a, button, label.chip, [role="tab"]')) return setState('link');
    if (t.closest('.hero')) return setState('lens');
    setState('');
  };
  let moved = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      p.x = e.clientX;
      p.y = e.clientY;
      moved = true;
      resolve(e.target);
    },
    { passive: true },
  );
  // content moves under a still pointer while scrolling: re-check what is below it
  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!moved || queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        resolve(document.elementFromPoint(p.x, p.y));
      });
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => (root.style.opacity = 0));

  gsap.ticker.add((time, delta) => {
    const k = damp(0.2, delta / 1000);
    p.rx += (p.x - p.rx) * k;
    p.ry += (p.y - p.ry) * k;
    dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    ring.style.transform = `translate3d(${p.rx}px, ${p.ry}px, 0)`;
  });

  if (reduced) return;
  // magnetic buttons
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
