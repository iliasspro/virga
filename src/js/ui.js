import { gsap, ScrollTrigger, $, $$, state, scrollToTarget, lockScroll, timecode } from './core.js';
import { contact } from '../data.js';

function rollText() {
  $$('[data-roll]').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    el.classList.add('roll');
    const a = document.createElement('span');
    a.className = 'roll__a';
    a.textContent = text;
    const b = document.createElement('span');
    b.className = 'roll__b';
    b.textContent = text;
    b.setAttribute('aria-hidden', 'true');
    el.append(a, b);
  });
}

function grain() {
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--noise', `url(${c.toDataURL('image/png')})`);
}

function clock() {
  const fmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: contact.timezone });
  const tick = () => $$('[data-clock]').forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 15000);
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

function header() {
  const el = $('[data-header]');
  let lastY = 0;
  const update = (y) => {
    el.classList.toggle('is-scrolled', y > 30);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    if (!menuOpen && y > 500 && y > lastY + 4) el.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 500) el.classList.remove('is-hidden');
    lastY = y;
  };
  if (state.lenis) state.lenis.on('scroll', ({ scroll }) => update(scroll));
  else window.addEventListener('scroll', () => update(window.scrollY), { passive: true });

  // active link
  const links = $$('.nav__link');
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive),
    });
  });
}

function menu() {
  const html = document.documentElement;
  const btn = $('.burger');
  const panel = $('#menu');
  const set = (open) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    panel.setAttribute('aria-hidden', String(!open));
    lockScroll(open);
  };
  btn.addEventListener('click', () => set(!html.classList.contains('menu-open')));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && html.classList.contains('menu-open') && set(false));
}

function anchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.startsWith('#projet-')) return; // handled by the project modal
    if (id === '#' || id.length < 2) return;
    const target = id === '#top' ? $('#top') : $(id);
    if (!target) return;
    e.preventDefault();
    if (a.dataset.brief) window.dispatchEvent(new CustomEvent('virga:brief', { detail: a.dataset.brief }));
    const delay = document.documentElement.classList.contains('menu-open') ? 450 : 0;
    setTimeout(() => scrollToTarget(target, { offset: id === '#contact' ? -40 : 0 }), delay);
  });
}

function spotlight() {
  $$('[data-spotlight], .sig__card').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

function hud() {
  const el = $('.hud');
  const tc = $('[data-hud-tc]', el);
  const sc = $('[data-hud-sc]', el);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => (tc.textContent = timecode(self.progress * 180)),
  });
  const sections = $$('[data-section]');
  sections.forEach((s, i) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        gsap.to(sc, { duration: 0.6, scrambleText: { text: `SC.${String(i + 1).padStart(2, '0')} — ${s.dataset.section}`, chars: 'upperCase', speed: 0.6 } });
      },
    });
  });
  // sections with their own timecode (film strip, NLE timeline) take over the HUD
  $$('.work, .method').forEach((s) =>
    ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 40%', onToggle: (self) => el.classList.toggle('is-muted', self.isActive) }),
  );
  return () => el.classList.add('is-on');
}

function contactLinks() {
  const mail = $('[data-contact-email]');
  if (mail) {
    mail.href = `mailto:${contact.email}`;
    $('[data-email-text]', mail).textContent = contact.email;
  }
  const phone = $('[data-contact-phone]');
  if (contact.phone && phone) {
    phone.hidden = false;
    phone.href = `tel:${contact.phone.replace(/\s+/g, '')}`;
    $('[data-phone-text]', phone).textContent = contact.phone;
  }
  const wa = $('[data-contact-wa]');
  if (contact.whatsapp && wa) {
    wa.hidden = false;
    wa.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent('Bonjour VIRGA, je souhaite parler d’un projet.')}`;
  }
  const soc = $('[data-socials]');
  const names = { instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube' };
  Object.entries(contact.socials).forEach(([k, url]) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = names[k] ?? k;
    soc.append(a);
  });
}

export function initUI() {
  rollText();
  grain();
  clock();
  contactLinks();
  anchors();
  menu();
  spotlight();
}

export function initChrome() {
  header();
  return hud();
}
