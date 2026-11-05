// Build-time HTML renderers (run in Node by the Vite plugin in vite.config.js).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { projects, services, method, partners, media } from './data.js';

const asset = (name) => readFileSync(fileURLToPath(new URL(`./assets/${name}`, import.meta.url)), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');

let uid = 0;
// Inline an SVG with unique gradient/clip ids so several copies can live on the same page.
function inlineSvg(file, extraClass = '') {
  const n = ++uid;
  let svg = asset(file)
    .replace(/id="(vm|wm)-/g, `id="$1${n}-`)
    .replace(/url\(#(vm|wm)-/g, `url(#$1${n}-`)
    .replace(/<svg /, `<svg class="${extraClass}" aria-hidden="true" focusable="false" `);
  return svg.trim();
}

function preloaderWordmark() {
  // Same wordmark, but the two "‖" bars become one morphable path per bar (pause → play).
  return inlineSvg('wordmark.svg', 'wordmark wordmark--pl')
    .replace(/<rect class="wm-i"[^>]*\/>/, '<path class="wm-i pl-bar pl-bar--1" d="M540,5 L630,5 L630,462 L540,462 Z" fill="url(#BAR)"/>')
    .replace(/<rect class="wm-stem"[^>]*\/>/, '<path class="wm-stem pl-bar pl-bar--2" d="M730,5 L820,5 L820,462 L730,462 Z" fill="url(#BAR)"/>')
    .replace(/url\(#BAR\)/g, () => `url(#wm${uid}-bar)`);
}

export function img(name, { sizes = '100vw', alt = '', cls = '', eager = false } = {}) {
  const [w, h] = media[name];
  return `<img${cls ? ` class="${cls}"` : ''} src="/media/${name}-sm.webp" srcset="/media/${name}-sm.webp 720w, /media/${name}.webp ${w}w" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h}"${eager ? '' : ' loading="lazy"'} decoding="async" />`;
}

const SEP = '<i class="mq-sep" aria-hidden="true"></i>';

function marquee(items) {
  const group = items.map((t) => `<span class="mq-item">${esc(t)}</span>${SEP}`).join('');
  return `<div class="marquee__group">${group}</div><div class="marquee__group" aria-hidden="true">${group}</div>`;
}

const viz = {
  gaming: `<div class="viz viz--gaming"><div class="viz-sky"></div><div class="viz-grid"></div><div class="viz-cube"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="viz-hud mono">LEVEL 03 · SCORE 08 420</span></div>`,
  growth: `<div class="viz viz--growth"><svg viewBox="0 0 300 380" aria-hidden="true"><defs><linearGradient id="gr-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b743f7" stop-opacity=".45"/><stop offset="1" stop-color="#b743f7" stop-opacity="0"/></linearGradient></defs><g class="g-grid"><path d="M0 95H300M0 190H300M0 285H300"/></g><path class="g-area" d="M0,330 C40,320 60,300 90,300 C130,300 140,250 175,240 C215,228 230,150 260,120 C275,105 288,92 300,85 L300,380 L0,380 Z" fill="url(#gr-a)"/><path class="g-line" d="M0,330 C40,320 60,300 90,300 C130,300 140,250 175,240 C215,228 230,150 260,120 C275,105 288,92 300,85"/><circle class="g-node" cx="175" cy="240" r="9"/><path class="g-arrow" d="M262,70 L292,62 L286,92"/></svg><span class="viz-hud mono">Leads ↗ · CPA ↘ · ROI ↗</span></div>`,
  web: `<div class="viz viz--web"><div class="vw-win"><div class="vw-bar"><i></i><i></i><i></i><span></span></div><div class="vw-hero"><b></b><b></b><em></em></div><div class="vw-row"><i></i><i></i></div><div class="vw-row vw-row--3"><i></i><i></i><i></i></div></div><div class="vw-phone"><i></i><b></b><b></b><em></em></div></div>`,
  ai: `<div class="viz viz--ai"><div class="va-orb"></div><div class="va-msg va-msg--u">Un devis pour un film corporate ?</div><div class="va-msg va-msg--a"><span></span><span></span><span></span></div><div class="va-msg va-msg--a va-msg--txt">Brief qualifié ✓ Envoyé à l’équipe.</div></div>`,
  flow: `<div class="viz viz--flow"><svg viewBox="0 0 300 380" aria-hidden="true"><path class="vf-l" d="M70,80 C150,80 150,190 230,190"/><path class="vf-l" d="M70,190 L230,190"/><path class="vf-l" d="M70,300 C150,300 150,190 230,190"/><circle class="vf-p" r="5"><animateMotion dur="2.2s" repeatCount="indefinite" path="M70,80 C150,80 150,190 230,190"/></circle><circle class="vf-p" r="5"><animateMotion dur="2.2s" begin=".7s" repeatCount="indefinite" path="M70,190 L230,190"/></circle><circle class="vf-p" r="5"><animateMotion dur="2.2s" begin="1.4s" repeatCount="indefinite" path="M70,300 C150,300 150,190 230,190"/></circle><g class="vf-n"><rect x="30" y="60" width="80" height="40" rx="10"/><rect x="30" y="170" width="80" height="40" rx="10"/><rect x="30" y="280" width="80" height="40" rx="10"/><rect class="vf-ai" x="200" y="150" width="80" height="80" rx="20"/></g><text x="240" y="196" text-anchor="middle">IA</text></svg></div>`,
};

export function renderServices() {
  const groups = [
    { key: 'studio', label: 'Studio', big: 'Création & production', note: 'Films, 3D, événements, gaming : on imagine, on tourne, on livre.' },
    { key: 'lab', label: 'Lab', big: 'Digital, data & tech', note: 'Marketing, web, IA et automatisations : on construit ce qui convertit.' },
  ];
  let i = 0;
  return `<div class="svc">${groups
    .map((g) => {
      const items = services.filter((s) => s.group === g.key);
      return `<div class="svc__group svc__group--${g.key}">
        <aside class="svc__aside"><p class="mono svc__label"><i></i>${g.label}</p><p class="svc__big">${esc(g.big)}</p><p class="svc__note">${esc(g.note)}</p></aside>
        <ul class="svc__list">${items
          .map((s) => {
            i += 1;
            return `<li class="svc__item" data-svc="${s.id}">
            <a href="#contact" class="svc__link" data-brief="${esc(s.name)}" data-cursor="brief">
              <span class="svc__idx mono">${pad(i)}</span>
              <span class="svc__name"><span>${esc(s.name)}</span></span>
              <span class="svc__text">${esc(s.text)}</span>
              <span class="svc__tags">${s.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</span>
              <span class="svc__go">En savoir plus<i class="btn__arrow" aria-hidden="true"></i></span>
            </a>
          </li>`;
          })
          .join('')}</ul>
      </div>`;
    })
    .join('')}</div>`;
}

export function renderServicesMedia() {
  return services
    .map((s) => `<div class="svc-media" data-svc-media="${s.id}">${s.media.img ? img(s.media.img, { sizes: '340px' }) : viz[s.media.viz]}</div>`)
    .join('');
}

export function renderProjects() {
  const cards = projects
    .map(
      (p, i) => `<a class="frame" href="#projet-${p.id}" data-project="${p.id}" data-cursor="view" aria-label="${esc(`Voir le projet ${p.title}`)}">
      <div class="frame__media">${img(p.cover, { sizes: '(max-width: 800px) 80vw, 42vw', alt: p.title })}<span class="frame__scan" aria-hidden="true"></span></div>
      <div class="frame__meta">
        <span class="frame__n mono">${pad(i + 1)}</span>
        <h3 class="frame__title">${esc(p.short)}</h3>
        <p class="frame__cat">${esc(p.category)}</p>
        <span class="frame__dur mono"><i aria-hidden="true"></i>${esc(p.duration)}</span>
      </div>
    </a>`,
    )
    .join('');
  const end = `<a class="frame frame--end" href="#contact" data-cursor="brief" data-brief="Production audiovisuelle">
      <div class="frame__media"><span class="frame__end-mark" aria-hidden="true">${inlineSvg('mark.svg')}</span><span class="frame__end-txt">Votre projet <em class="serif">ici</em> ?</span></div>
      <div class="frame__meta"><span class="frame__n mono">${pad(projects.length + 1)}</span><h3 class="frame__title">Prochaine production</h3><p class="frame__cat">Démarrer un projet →</p></div>
    </a>`;
  return cards + end;
}

export function renderMethodScreens() {
  return method
    .map(
      (m, i) => `<div class="nle__shot${i === 0 ? ' is-active' : ''}" data-shot="${i}">
      <p class="mono nle__shot-n">Étape ${pad(i + 1)} <span>/ ${pad(method.length)}</span></p>
      <h3 class="nle__shot-t">${esc(m.title)}</h3>
      <p class="nle__shot-p">${esc(m.text)}</p>
    </div>`,
    )
    .join('');
}

export function renderMethodClips() {
  const w = 100 / method.length;
  return method
    .map((m, i) => `<i class="nle__clip" data-clip="${i}" style="left:${(i * w + 0.6).toFixed(2)}%;width:${(w - 1.2).toFixed(2)}%"><b class="mono">${pad(i + 1)}</b> ${esc(m.title)}</i>`)
    .join('');
}

export function renderPartners() {
  const group = partners.map((p) => `<span class="partner">${esc(p)}</span>${SEP}`).join('');
  return `<div class="partners__group">${group}</div><div class="partners__group" aria-hidden="true">${group}</div>`;
}

export function renderBriefChips() {
  return (
    services.map((s) => `<label class="chip"><input type="checkbox" name="services" value="${esc(s.name)}" /><span>${esc(s.name)}</span></label>`).join('') +
    `<label class="chip"><input type="checkbox" name="services" value="Autre" /><span>Autre</span></label>`
  );
}

export function renderHtml(html) {
  uid = 0;
  return html
    .replace('<!--@svg:wordmark-preloader-->', () => preloaderWordmark())
    .replace(/<!--@svg:mark-->/g, () => inlineSvg('mark.svg', 'mark'))
    .replace('<!--@svg:wordmark-->', () => inlineSvg('wordmark.svg', 'wordmark'))
    .replace('<!--@svg:wordmark-footer-->', () => inlineSvg('wordmark.svg', 'wordmark wordmark--footer'))
    .replace('<!--@marquee:1-->', () => marquee(['Production audiovisuelle', 'Animation & 3D', 'Events', 'Gaming', 'Storytelling']))
    .replace('<!--@marquee:2-->', () => marquee(['Web & Apps', 'Intelligence artificielle', 'Automatisations', 'Marketing digital', 'Conseil']))
    .replace('<!--@services-->', () => renderServices())
    .replace('<!--@services-media-->', () => renderServicesMedia())
    .replace('<!--@projects-->', () => renderProjects())
    .replace('<!--@projects-count-->', () => pad(projects.length))
    .replace('<!--@method-screens-->', () => renderMethodScreens())
    .replace('<!--@method-clips-->', () => renderMethodClips())
    .replace(/<!--@partners-->/g, () => renderPartners())
    .replace('<!--@brief-chips-->', () => renderBriefChips());
}
