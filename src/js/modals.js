import { gsap, $, $$, reduced, lockScroll } from './core.js';
import { projects } from '../data.js';

const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function embedUrl(p) {
  if (p.youtube) return `https://www.youtube-nocookie.com/embed/${p.youtube}?autoplay=1&rel=0`;
  if (p.vimeo) return `https://player.vimeo.com/video/${p.vimeo}?autoplay=1`;
  if (p.drive) return `https://drive.google.com/file/d/${p.drive}/preview`;
  return null;
}
function openUrl(p) {
  if (p.youtube) return `https://youtu.be/${p.youtube}`;
  if (p.vimeo) return `https://vimeo.com/${p.vimeo}`;
  if (p.drive) return `https://drive.google.com/file/d/${p.drive}/view`;
  return null;
}

export function initModals() {
  const pm = $('[data-pmodal]');
  const vm = $('[data-vmodal]');
  let lastFocus = null;
  let galleryTimer = null;
  let currentId = null;

  const animateIn = (modal, panelSel) => {
    if (reduced) return;
    gsap.fromTo($('[class$="__bg"]', modal), { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo($(panelSel, modal), { opacity: 0, y: 50, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'virga' });
  };

  // ---------- video ----------
  const vPlayer = $('[data-vplayer]', vm);
  const vCaption = $('[data-vcaption]', vm);
  function openVideo(id) {
    const p = byId[id];
    if (!p) return;
    const src = embedUrl(p);
    if (!src) return;
    lastFocus = lastFocus ?? document.activeElement;
    vPlayer.innerHTML = `<p class="vmodal__loading">Chargement du film…</p><iframe src="${src}" title="${esc(p.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    vCaption.innerHTML = `<span>${esc(p.title)} — ${esc(p.duration)}</span><a href="${openUrl(p)}" target="_blank" rel="noopener">Ouvrir dans un nouvel onglet ↗</a>`;
    vm.hidden = false;
    lockScroll(true);
    animateIn(vm, '.vmodal__frame');
    $('.vmodal__close', vm).focus();
  }
  function closeVideo() {
    vm.hidden = true;
    vPlayer.innerHTML = '';
    if (pm.hidden) {
      lockScroll(false);
      lastFocus?.focus?.();
      lastFocus = null;
    }
  }

  // ---------- project ----------
  const media = $('[data-pm-media]', pm);
  function openProject(id) {
    const p = byId[id];
    if (!p) return;
    currentId = id;
    if (pm.hidden) lastFocus = document.activeElement;
    const imgs = p.gallery
      .map((g, i) => `<img src="/media/${g}.webp" alt="${i === 0 ? esc(p.title) : ''}" class="${i === 0 ? 'is-on' : ''}" decoding="async" />`)
      .join('');
    const dots = p.gallery.length > 1 ? `<div class="pmodal__dots">${p.gallery.map((_, i) => `<i class="${i === 0 ? 'is-on' : ''}"></i>`).join('')}</div>` : '';
    media.innerHTML = imgs + dots;
    $('[data-pm-meta]', pm).textContent = `${p.category} · ${p.duration}`;
    $('[data-pm-title]', pm).textContent = p.title;
    $('[data-pm-text]', pm).textContent = p.text;
    $('[data-pm-facts]', pm).innerHTML = [
      ['Client', p.client],
      ['Lieu', p.place],
      ['Format', p.category],
      ['Durée', p.duration],
    ]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join('');
    $('[data-pm-play]', pm).hidden = !embedUrl(p);
    clearInterval(galleryTimer);
    if (p.gallery.length > 1 && !reduced) {
      let i = 0;
      const imgsEl = $$('img', media);
      const dotsEl = $$('.pmodal__dots i', media);
      galleryTimer = setInterval(() => {
        imgsEl[i].classList.remove('is-on');
        dotsEl[i].classList.remove('is-on');
        i = (i + 1) % imgsEl.length;
        imgsEl[i].classList.add('is-on');
        dotsEl[i].classList.add('is-on');
      }, 3400);
    }
    const wasHidden = pm.hidden;
    pm.hidden = false;
    lockScroll(true);
    if (wasHidden) animateIn(pm, '.pmodal__panel');
    else if (!reduced) gsap.fromTo('.pmodal__body > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, ease: 'virga' });
    $('.pmodal__close', pm).focus();
  }
  function closeProject() {
    pm.hidden = true;
    clearInterval(galleryTimer);
    lockScroll(false);
    lastFocus?.focus?.();
    lastFocus = null;
  }

  $('[data-pm-play]', pm).addEventListener('click', () => openVideo(currentId));
  $('[data-pm-next]', pm).addEventListener('click', () => {
    const i = projects.findIndex((p) => p.id === currentId);
    openProject(projects[(i + 1) % projects.length].id);
  });
  $$('[data-close]', pm).forEach((b) => b.addEventListener('click', closeProject));
  $$('[data-close]', vm).forEach((b) => b.addEventListener('click', closeVideo));

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project]');
    if (card) {
      e.preventDefault();
      openProject(card.dataset.project);
      return;
    }
    const v = e.target.closest('[data-video]');
    if (v) {
      e.preventDefault();
      openVideo(v.dataset.video);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!vm.hidden) closeVideo();
      else if (!pm.hidden) closeProject();
    }
    if (e.key === 'Tab') {
      const open = !vm.hidden ? vm : !pm.hidden ? pm : null;
      if (!open) return;
      const f = $$('button, a[href], iframe, [tabindex]:not([tabindex="-1"])', open).filter((el) => !el.hidden && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // deep link: /#projet-fes
  const m = window.location.hash.match(/^#projet-(.+)$/);
  if (m && byId[m[1]]) setTimeout(() => openProject(m[1]), 600);
}
