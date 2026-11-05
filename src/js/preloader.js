import { gsap, $, $$, reduced, loadImage, wait, timecode } from './core.js';

// Brand intro: the VIRGA wordmark draws itself, the "‖" (pause) bars of the logo
// morph into a "▶" (play) and an iris opens on the site from that play button.
const safe = (fn) => () => {
  try {
    fn?.();
  } catch (err) {
    console.error('[virga]', err);
  }
};

export function runPreloader({ onReady: ready_, onReveal: reveal_ }) {
  const onReady = safe(ready_);
  const onReveal = safe(reveal_);
  const el = $('.preloader');
  const finish = () => {
    el.classList.add('is-done');
    document.body.classList.remove('is-loading');
  };

  const ready = Promise.race([
    Promise.all([document.fonts.ready, loadImage('/media/villa-entrance.webp')]),
    wait(3200),
  ]);

  if (reduced) {
    ready.then(() => {
      onReady?.();
      finish();
      onReveal?.();
    });
    return;
  }

  const quick = sessionStorage.getItem('virga-intro') === '1';
  sessionStorage.setItem('virga-intro', '1');
  const k = quick ? 0.45 : 1;

  const svg = $('svg', el);
  const strokes = $$('.wm-v, .wm-r, .wm-g, .wm-arm, .wm-a', svg);
  const bars = $$('.pl-bar', svg);
  const dots = $$('.wm-dot, .wm-ball', svg);
  const sub = $('.preloader__sub', el);
  const fill = $('.preloader__bar span', el);
  const tcEl = $('[data-preload-tc]', el);
  const tc = { t: 0 };

  gsap.set(strokes, { drawSVG: '0%' });
  gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%' });
  gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(sub, { opacity: 0, letterSpacing: '1.6em' });

  const intro = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  intro
    .to(strokes, { drawSVG: '100%', duration: 1.1 * k, stagger: 0.09 * k }, 0)
    .to(bars, { scaleY: 1, duration: 0.8 * k, stagger: 0.12 * k, ease: 'expo.out' }, 0.25 * k)
    .to(dots, { scale: 1, duration: 0.6 * k, stagger: 0.1 * k, ease: 'back.out(3)' }, 0.75 * k)
    .to(sub, { opacity: 1, letterSpacing: '0.9em', duration: 1.2 * k, ease: 'expo.out' }, 0.4 * k)
    .to(fill, { scaleX: 0.85, duration: 1.4 * k, ease: 'power2.out' }, 0)
    .to(tc, { t: 1.4, duration: 1.4 * k, ease: 'none', onUpdate: () => (tcEl.textContent = timecode(tc.t)) }, 0);

  Promise.all([ready, new Promise((r) => intro.eventCallback('onComplete', r))]).then(() => {
    onReady?.();
    const [b1, b2] = bars;
    const out = gsap.timeline({ onComplete: finish });
    out
      .to(fill, { scaleX: 1, duration: 0.3 * k, ease: 'power2.out' })
      .to(tc, { t: 2, duration: 0.3 * k, ease: 'none', onUpdate: () => (tcEl.textContent = timecode(tc.t)) }, '<')
      // pause ‖ → play ▶
      .to(b1, { morphSVG: 'M560,5 L860,233.5 L560,233.5 Z', duration: 0.55 * k, ease: 'power3.inOut' })
      .to(b2, { morphSVG: 'M560,233.5 L860,233.5 L560,462 Z', duration: 0.55 * k, ease: 'power3.inOut' }, '<')
      .to(bars, { fill: '#b743f7', duration: 0.4 * k }, '<0.15')
      .to([...strokes, ...dots, sub, $('.preloader__bar', el), $('.preloader__tc', el)], { opacity: 0.15, duration: 0.4 * k }, '<')
      .add(() => {
        const r = b1.getBoundingClientRect();
        el.style.setProperty('--mx', `${r.left + r.width * 0.45}px`);
        el.style.setProperty('--my', `${r.bottom}px`);
      })
      .to(bars, { scale: 1.25, transformOrigin: '30% 50%', duration: 0.25 * k, ease: 'power2.out', yoyo: true, repeat: 1 })
      .add(() => onReveal?.(), '-=0.1')
      .fromTo(
        el,
        { '--hole': '0px' },
        { '--hole': `${Math.hypot(window.innerWidth, window.innerHeight) * 1.1}px`, duration: 1.3 * k, ease: 'expo.inOut' },
        '-=0.15',
      )
      .to($('.preloader__inner', el), { scale: 1.6, opacity: 0, duration: 1 * k, ease: 'expo.in' }, '<');
  });
}
