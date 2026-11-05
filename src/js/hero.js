import { gsap, ScrollTrigger, $, $$, reduced, timecode } from './core.js';
import { HeroLens } from './hero-gl.js';
import { heroReel } from '../data.js';

export function initHero() {
  const hero = $('.hero');
  const canvas = $('.hero__gl', hero);
  const sceneN = $('[data-scene-n]', hero);
  const sceneLabel = $('[data-scene-label]', hero);
  const sceneTag = $('[data-scene-tag]', hero);

  const lens = new HeroLens(canvas, heroReel, {
    onSlide: (i, s) => {
      gsap.to(sceneN, { duration: 0.6, scrambleText: { text: `SC.${String(i + 1).padStart(2, '0')}`, chars: '0123456789', speed: 0.6 } });
      gsap.to(sceneLabel, { duration: 0.9, scrambleText: { text: s.label, chars: 'upperCase', speed: 0.5 } });
      gsap.to(sceneTag, { duration: 0.9, scrambleText: { text: s.tag, chars: 'lowerCase', speed: 0.5 } });
    },
  });
  const glOk = lens.init();
  if (import.meta.env.DEV) window.__lens = lens;
  if (!glOk) document.documentElement.classList.add('no-webgl');

  // wrap each title line for a masked slide-up
  const lines = $$('.hero__line', hero);
  lines.forEach((line) => {
    const inner = document.createElement('span');
    inner.className = 'hero__line-in';
    while (line.firstChild) inner.appendChild(line.firstChild);
    const mask = document.createElement('span');
    mask.className = 'hero__mask';
    mask.appendChild(inner);
    line.appendChild(mask);
  });
  const inners = $$('.hero__line-in', hero);

  const curve = $('.hero__curve-line', hero);
  const glow = $('.hero__curve-glow', hero);
  const node = $('.hero__node', hero);
  const svg = $('.hero__curve', hero);
  const arrow = $('.hero__arrow', hero);
  const seal = $('.hero__seal', hero);
  const len = curve.getTotalLength();
  const nodeState = { f: 0.07 };

  const placeNode = () => {
    const pt = curve.getPointAtLength(len * nodeState.f);
    const w = svg.clientWidth;
    const h = svg.clientHeight;
    node.style.transform = `translate3d(${(pt.x / 1440) * w}px, ${(pt.y / 900) * h}px, 0)`;
  };

  // running camera timecode
  const tcEl = $('[data-hero-tc]', hero);
  const t0 = performance.now();
  let lastTc = '';
  gsap.ticker.add(() => {
    const s = timecode((performance.now() - t0) / 1000);
    if (s !== lastTc) {
      tcEl.textContent = s;
      lastTc = s;
    }
  });

  const fades = [$('.hero__eyebrow', hero), $('.hero__lead', hero), ...$$('.hero__ctas .btn', hero), $('.hero__scroll', hero)];

  if (!reduced) {
    gsap.set(inners, { yPercent: 115, rotate: 3 });
    gsap.set(fades, { opacity: 0, y: 24 });
    gsap.set([curve, glow], { drawSVG: '0%' });
    gsap.set('.vf-corner', { scale: 0.4, opacity: 0 });
    gsap.set(['.vf-top', '.vf-bottom'], { opacity: 0 });
  } else {
    gsap.set(node, { opacity: 1 });
    gsap.set([arrow, seal], { opacity: 1 });
  }

  function intro() {
    if (glOk) {
      lens.start().then((ok) => {
        if (!ok) document.documentElement.classList.add('no-webgl');
      });
      if (reduced) {
        lens.u.intro = 1;
        lens.u.lens = 1;
      } else lens.intro();
    }
    placeNode();
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'virga' } });
    tl.to(inners, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.11 }, 0.15)
      .to(fades, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.55)
      .to([glow, curve], { drawSVG: '100%', duration: 2.2, ease: 'power2.inOut' }, 0.2)
      .to(node, { opacity: 1, duration: 0.6 }, 1.2)
      .fromTo(node, { scale: 0 }, { scale: 1, duration: 0.9, ease: 'back.out(3)' }, 1.2)
      .to(arrow, { opacity: 1, duration: 0.8 }, 1.6)
      .fromTo(seal, { opacity: 0, scale: 0.6, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.4 }, 1.1)
      .to('.vf-corner', { scale: 1, opacity: 1, duration: 1, stagger: 0.05 }, 0.4)
      .to(['.vf-top', '.vf-bottom'], { opacity: 1, duration: 0.8 }, 0.9);
  }

  // the global HUD only appears once the hero viewfinder is gone
  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 85%',
    endTrigger: 'html',
    end: 'bottom bottom',
    refreshPriority: -1,
    onToggle: (self) => $('.hud').classList.toggle('is-past-hero', self.isActive),
  });

  // the node rides the curve like a playhead while the hero scrolls away
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      nodeState.f = 0.07 + self.progress * 0.6;
      placeNode();
    },
  });
  if (!reduced) {
    gsap.to('.hero__content', {
      yPercent: -18,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  window.addEventListener('resize', placeNode);

  return { intro, lens };
}
