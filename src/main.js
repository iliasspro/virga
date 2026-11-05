import '@fontsource-variable/unbounded';
import '@fontsource-variable/manrope';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { gsap, ScrollTrigger, initScroll, lockScroll, reduced } from './js/core.js';
import { runPreloader } from './js/preloader.js';
import { initHero } from './js/hero.js';
import { initCursor } from './js/cursor.js';
import { initUI, initChrome } from './js/ui.js';
import { initSections } from './js/sections.js';
import { initLab } from './js/lab.js';
import { initContact } from './js/contact.js';
import { initModals } from './js/modals.js';

document.documentElement.classList.add('js');
if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => console.error('[virga:error]', e.message, e.filename, e.lineno));
  window.addEventListener('unhandledrejection', (e) => console.error('[virga:rejection]', e.reason?.stack || e.reason));
  // ?forcetick: drive animations from a timer (for previews where requestAnimationFrame is throttled)
  if (new URLSearchParams(window.location.search).has('forcetick')) setInterval(() => gsap.ticker.tick(), 16);
}
if (reduced) document.documentElement.classList.add('rm');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

initUI();
initCursor();
initModals();
initContact();
initLab();
const lenis = initScroll();
if (import.meta.env.DEV) window.__lenis = lenis;
lockScroll(true);
const hero = initHero();
let showHud = () => {};

runPreloader({
  onReady() {
    initSections();
    // created after the pinned sections so their positions include pin spacing
    showHud = initChrome();
    ScrollTrigger.refresh();
  },
  onReveal() {
    lockScroll(false);
    hero.intro();
    showHud?.();
  },
});

// fonts or late images can shift layout: keep pins accurate
window.addEventListener('load', () => ScrollTrigger.refresh());
