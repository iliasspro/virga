import { gsap, ScrollTrigger, SplitText, $, $$, reduced, finePointer, isMobile, damp, clamp, timecode, state } from './core.js';

function splitHeadings() {
  if (reduced) return;
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 108,
          duration: 1.25,
          ease: 'virga',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }),
    });
  });
}

function reveals() {
  if (reduced) return;
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.15, ease: 'virga', stagger: 0.09, overwrite: true }),
  });
  ScrollTrigger.batch('[data-reveal-card]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.3, ease: 'virga', stagger: 0.13, overwrite: true }),
  });
  ScrollTrigger.batch('.vmd__card', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.from(els, { opacity: 0, y: 70, rotate: 1.5, duration: 1.3, ease: 'virga', stagger: 0.12 }),
  });
  gsap.from('.svc__item', {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'virga',
    stagger: 0.06,
    scrollTrigger: { trigger: '.svc', start: 'top 80%', once: true },
  });
  gsap.from('.lab__window', {
    opacity: 0,
    y: 80,
    rotateX: 12,
    transformPerspective: 1200,
    duration: 1.4,
    ease: 'virga',
    scrollTrigger: { trigger: '.lab__demo', start: 'top 85%', once: true },
  });
  gsap.from('.direct > *', {
    opacity: 0,
    x: 30,
    duration: 1,
    ease: 'virga',
    stagger: 0.08,
    scrollTrigger: { trigger: '.direct', start: 'top 85%', once: true },
  });
  gsap.from('.brief', {
    opacity: 0,
    y: 60,
    duration: 1.2,
    ease: 'virga',
    scrollTrigger: { trigger: '.brief', start: 'top 88%', once: true },
  });
}

function aboutWords() {
  const el = $('[data-scrub-words]');
  if (!el || reduced) return;
  const split = SplitText.create(el, { type: 'words', wordsClass: 'word' });
  const pills = $$('.pill', el);
  const targets = [...split.words, ...pills].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: true } });
  tl.fromTo(targets, { opacity: 0.13 }, { opacity: 1, stagger: 0.1, ease: 'none' }, 0);
  tl.fromTo(pills, { scale: 0.2, rotate: -10 }, { scale: 1, rotate: 0, stagger: 0.4, ease: 'back.out(2)', duration: 0.6 }, 0.2);
}

function marquee() {
  const rows = $$('.marquee__row');
  if (reduced || !rows.length) return;
  let dirSign = 1;
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe($('.marquee'));
  const items = rows.map((row) => {
    const track = $('.marquee__track', row);
    const group = $('.marquee__group', track);
    return { track, group, dir: Number(row.dataset.marquee) || 1, x: 0, w: group.offsetWidth, skew: 0 };
  });
  window.addEventListener('resize', () => items.forEach((it) => (it.w = it.group.offsetWidth)));
  gsap.ticker.add((time, delta) => {
    if (!visible) return;
    const dt = Math.min(delta / 1000, 0.05);
    const v = state.lenis ? state.lenis.velocity : 0;
    if (Math.abs(v) > 0.4) dirSign = v > 0 ? 1 : -1;
    const speed = 70 + Math.min(Math.abs(v) * 40, 1600);
    items.forEach((it) => {
      it.x -= speed * dt * it.dir * dirSign;
      if (it.x <= -it.w) it.x += it.w;
      if (it.x > 0) it.x -= it.w;
      it.skew += (clamp(-v * 0.35, -10, 10) - it.skew) * damp(0.1, dt);
      it.track.style.transform = `translate3d(${it.x.toFixed(2)}px,0,0) skewX(${it.skew.toFixed(2)}deg)`;
    });
  });
}

function fly() {
  const sec = $('.fly');
  if (!sec) return;
  const pin = $('.fly__pin', sec);
  const frame = $('.fly__frame', sec);
  const zoom = $('.fly__zoom', sec);
  const ghosts = $$('.fly__ghost', sec);
  const hud = $('.fly__hud', sec);
  const alt = $('[data-fly-alt]', sec);
  const spd = $('[data-fly-spd]', sec);
  const parts = $$('.fly__text > *', sec);
  if (reduced) {
    frame.style.clipPath = 'none';
    return;
  }
  gsap.set(parts, { opacity: 0, y: 50 });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: sec, start: 'top top', end: () => (isMobile() ? '+=130%' : '+=200%'), pin, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
    onUpdate() {
      const p = this.progress();
      alt.textContent = `ALT ${String(Math.round(12 + p * 30)).padStart(3, '0')} m`;
      spd.textContent = `SPD ${String(Math.round(p < 0.7 ? p * 64 : 45 + (p - 0.7) * 420)).padStart(2, '0')} km/h`;
    },
  });
  tl.fromTo(frame, { clipPath: 'inset(16% 20% 16% 20% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
    .fromTo(zoom, { scale: 1.3 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
    .to(hud, { opacity: 1, duration: 0.3 }, 0.7)
    .to(parts, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, 0.75)
    .to(zoom, { scale: 1.3, duration: 1.1, ease: 'none' }, 1)
    .to(parts, { opacity: 0, y: -40, stagger: 0.04, duration: 0.35, ease: 'power2.in' }, 2.1)
    .to(zoom, { scale: 3.4, duration: 0.95, ease: 'power3.in' }, 2.1)
    .to(ghosts, { opacity: (i) => [0.5, 0.32][i], duration: 0.45 }, 2.15)
    .to(hud, { opacity: 0, duration: 0.2 }, 2.4)
    .to(frame, { opacity: 0, duration: 0.35 }, 2.7);
}

function servicesFloat() {
  if (!finePointer || reduced) return;
  const float = $('.svc-float');
  const inner = $('.svc-float__inner', float);
  const medias = $$('.svc-media', float);
  const map = Object.fromEntries(medias.map((m) => [m.dataset.svcMedia, m]));
  const p = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 };
  let on = false;
  let active = null;
  gsap.set(inner, { scale: 0.5 });
  const show = (v) => {
    on = v;
    gsap.to(float, { opacity: v ? 1 : 0, duration: 0.4 });
    gsap.to(inner, { scale: v ? 1 : 0.5, duration: 0.6, ease: 'virga' });
  };
  $$('.svc__list').forEach((list) => {
    list.addEventListener('pointerenter', (e) => {
      if (!on) {
        p.x = p.tx = e.clientX;
        p.y = p.ty = e.clientY;
      }
      show(true);
    });
    list.addEventListener('pointerleave', () => show(false));
  });
  $$('.svc__item').forEach((item) =>
    item.addEventListener('pointerenter', () => {
      const m = map[item.dataset.svc];
      if (!m || m === active) return;
      active?.classList.remove('is-active');
      m.classList.add('is-active');
      active = m;
    }),
  );
  window.addEventListener(
    'pointermove',
    (e) => {
      p.tx = e.clientX;
      p.ty = e.clientY;
    },
    { passive: true },
  );
  gsap.ticker.add((time, delta) => {
    if (!on && Number(gsap.getProperty(float, 'opacity')) < 0.01) return;
    const k = damp(0.13, delta / 1000);
    const nx = p.x + (p.tx - p.x) * k;
    p.vx += (nx - p.x - p.vx) * 0.2;
    p.x = nx;
    p.y += (p.ty - p.y) * k;
    const rot = clamp(p.vx * 0.7, -14, 14);
    float.style.transform = `translate3d(${(p.x + 210).toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
  });
}

function work() {
  const sec = $('.work');
  const pin = $('.work__pin', sec);
  const track = $('[data-strip-track]', sec);
  const frames = $$('.frame', track);
  const holes = $$('.strip__holes', sec);
  const idxEl = $('[data-work-i]', sec);
  const bar = $('[data-work-bar]', sec);
  const tcEl = $('[data-work-tc]', sec);
  let dist = 0;
  let current = -1;
  const measure = () => {
    dist = Math.max(0, track.scrollWidth - window.innerWidth);
  };
  measure();
  const update = (x) => {
    track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
    holes.forEach((h) => {
      h.style.webkitMaskPosition = `${-x}px 0`;
      h.style.maskPosition = `${-x}px 0`;
    });
    const vw = window.innerWidth;
    let best = 0;
    let bestD = Infinity;
    frames.forEach((f, i) => {
      const center = f.offsetLeft - x + f.offsetWidth / 2;
      const d = (center - vw / 2) / vw;
      const ad = Math.abs(d);
      f.style.transform = `rotateY(${(d * -26).toFixed(2)}deg) translateZ(${(-ad * 160).toFixed(1)}px)`;
      f.style.setProperty('--px', `${(d * -7).toFixed(2)}%`);
      if (ad < bestD) {
        bestD = ad;
        best = i;
      }
    });
    if (best !== current) {
      frames[current]?.classList.remove('is-center');
      frames[best].classList.add('is-center');
      current = best;
      idxEl.textContent = String(Math.min(best + 1, frames.length - 1)).padStart(2, '0');
    }
  };
  // frames sit off-screen inside a transformed track: fetch them before the strip arrives
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 300%',
    once: true,
    onEnter: () => $$('img[loading="lazy"]', track).forEach((img) => (img.loading = 'eager')),
  });
  const proxy = { x: 0 };
  gsap.to(proxy, {
    x: () => dist,
    ease: 'none',
    onUpdate: () => {
      update(proxy.x);
      const p = dist ? proxy.x / dist : 0;
      bar.style.transform = `scaleX(${p})`;
      tcEl.textContent = timecode(p * 26);
    },
    scrollTrigger: {
      trigger: sec,
      start: 'top top',
      end: () => `+=${dist}`,
      pin,
      scrub: 0.9,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
    },
  });
  update(0);
  return () => {
    track.style.transform = '';
    frames.forEach((f) => (f.style.transform = ''));
  };
}

function method() {
  const sec = $('.method');
  const pin = $('.method__pin', sec);
  const nle = $('[data-nle]', sec);
  const shots = $$('.nle__shot', nle);
  const clips = $$('.nle__clip', nle);
  const head = $('[data-playhead]', nle);
  const tcEl = $('[data-nle-tc]', nle);
  const wave = $('[data-wave]', nle);
  const lane = $('.nle__track--v1 .nle__lane', nle);
  let active = 0;
  shots.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0 }));
  clips[0].classList.add('is-active');
  const setActive = (i) => {
    if (i === active) return;
    clips.forEach((c, j) => c.classList.toggle('is-active', j === i));
    gsap.to(shots[active], { autoAlpha: 0, x: -24, duration: 0.25, ease: 'power2.in' });
    gsap.fromTo(shots[i], { autoAlpha: 0, x: 36, filter: 'blur(8px)' }, { autoAlpha: 1, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'virga' });
    gsap.fromTo($('.nle__screen', nle), { filter: 'brightness(1.8) saturate(1.6)' }, { filter: 'brightness(1) saturate(1)', duration: 0.35 });
    active = i;
  };
  const proxy = { p: 0 };
  gsap.to(proxy, {
    p: 1,
    ease: 'none',
    onUpdate: () => {
      const p = proxy.p;
      head.style.transform = `translateX(${(p * lane.clientWidth).toFixed(1)}px)`;
      wave.style.setProperty('--p', p.toFixed(4));
      tcEl.textContent = timecode(p * 20);
      setActive(Math.min(clips.length - 1, Math.floor(p * clips.length * 0.9999)));
    },
    scrollTrigger: { trigger: sec, start: 'top top', end: '+=230%', pin, scrub: 0.6 },
  });
  return () => shots.forEach((s) => gsap.set(s, { clearProps: 'all' }));
}

function waveform() {
  const wave = $('[data-wave]');
  if (!wave) return;
  let bars = '';
  for (let i = 0; i < 150; i++) {
    const h = 16 + Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.113)) * 64 + ((i * 7919) % 17);
    bars += `<i style="height:${Math.min(96, h).toFixed(0)}%"></i>`;
  }
  wave.innerHTML = `<div class="nle__wave-base">${bars}</div><div class="nle__wave-on">${bars}</div>`;
}

function footer() {
  const svg = $('.footer__word svg');
  if (!svg || reduced) return;
  const strokes = $$('.wm-v, .wm-r, .wm-g, .wm-arm, .wm-a', svg);
  const bars = $$('.wm-i, .wm-stem', svg);
  const dots = $$('.wm-dot, .wm-ball', svg);
  gsap
    .timeline({ scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: 1 } })
    .from(strokes, { drawSVG: '0%', stagger: 0.1, duration: 1, ease: 'none' })
    .from(bars, { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.1, duration: 0.6 }, 0.2)
    .from(dots, { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.4 }, 0.6);
}

function atmos() {
  if (reduced) return;
  const st = { start: 0, end: 'max', scrub: 1.5 };
  gsap.to('.atmos__a', { yPercent: 45, xPercent: 12, ease: 'none', scrollTrigger: st });
  gsap.to('.atmos__b', { yPercent: -35, xPercent: -10, ease: 'none', scrollTrigger: { ...st } });
  gsap.to('.atmos__c', { xPercent: -70, yPercent: 60, ease: 'none', scrollTrigger: { ...st } });
}

export function initSections() {
  waveform();
  splitHeadings();
  reveals();
  aboutWords();
  marquee();
  fly();
  servicesFloat();
  footer();
  atmos();
  const mm = gsap.matchMedia();
  mm.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    const a = work();
    const b = method();
    return () => {
      a?.();
      b?.();
    };
  });
}
