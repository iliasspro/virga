import { gsap, $, $$, reduced } from './core.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hhmm = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function flowDemo(panel) {
  const svg = $('.flow', panel);
  const layer = $('.flow__packets', svg);
  const log = $('[data-log]', panel);
  const nodes = $$('.fnode', svg);
  const sources = [
    { p: 'fl-1', node: 0, label: 'Site web', msg: 'formulaire « Film corporate 60 s »' },
    { p: 'fl-2', node: 1, label: 'Instagram', msg: 'DM « Tarif pour un clip ? »' },
    { p: 'fl-3', node: 2, label: 'WhatsApp', msg: '« Site e-commerce + shooting »' },
  ];
  const tags = ['Production audiovisuelle', 'Clip musical', 'Web & Apps'];
  let lines = [];
  let timer = null;
  let running = false;
  let tweens = [];
  let k = 0;

  const write = (html) => {
    lines = [...lines, html].slice(-3);
    log.innerHTML = lines.join('\n');
  };
  const hit = (i) => {
    const n = nodes[i];
    n.classList.remove('is-hit');
    n.getBBox();
    n.classList.add('is-hit');
    setTimeout(() => n.classList.remove('is-hit'), 650);
  };
  const packet = (id, cls, dur, done) => {
    const p = svg.querySelector(`#${id}`);
    const len = p.getTotalLength();
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', '4.5');
    if (cls) c.classList.add(cls);
    layer.appendChild(c);
    const o = { t: 0 };
    tweens.push(
      gsap.to(o, {
        t: 1,
        duration: dur,
        ease: 'power1.inOut',
        onUpdate: () => {
          const pt = p.getPointAtLength(o.t * len);
          c.setAttribute('cx', pt.x.toFixed(1));
          c.setAttribute('cy', pt.y.toFixed(1));
        },
        onComplete: () => {
          c.remove();
          done?.();
        },
      }),
    );
  };
  const cycle = () => {
    if (!running) return;
    const s = sources[k % sources.length];
    const tag = tags[k % tags.length];
    k += 1;
    hit(s.node);
    write(`<b>${hhmm()}</b>  › Nouveau lead · ${s.label} — ${esc(s.msg)}`);
    packet(s.p, '', 1.1, () => {
      hit(3);
      const score = 72 + Math.floor(Math.random() * 25);
      write(`<b>${hhmm()}</b>  › Agent IA — score ${score}/100 · besoin résumé · priorité ${score > 86 ? 'haute' : 'normale'}`);
      packet('fl-4', 'is-violet', 0.9, () => {
        hit(4);
        write(`<b>${hhmm()}</b>  › CRM — fiche créée · tag « ${tag} »`);
      });
      packet('fl-5', 'is-violet', 1.15, () => {
        hit(5);
        write(`<b>${hhmm()}</b>  › Relance auto — WhatsApp envoyé · RDV proposé`);
      });
    });
    timer = setTimeout(cycle, 3300);
  };
  return {
    start() {
      if (running) return;
      if (reduced) {
        lines = [];
        write(`<b>${hhmm()}</b>  › Nouveau lead · Site web — formulaire « Film corporate 60 s »`);
        write(`<b>${hhmm()}</b>  › Agent IA — score 91/100 · priorité haute`);
        write(`<b>${hhmm()}</b>  › CRM — fiche créée · Relance WhatsApp envoyée`);
        return;
      }
      running = true;
      cycle();
    },
    stop() {
      running = false;
      clearTimeout(timer);
      tweens.forEach((t) => t.kill());
      tweens = [];
      layer.innerHTML = '';
    },
  };
}

function chatDemo(panel) {
  const p = $('[data-type]', panel);
  const full = p.textContent.trim();
  const chips = $('.chat__chips', panel);
  const user = $('.chat__msg--user', panel);
  let tw;
  return {
    start() {
      tw?.kill();
      chips.classList.remove('is-on');
      if (reduced) {
        p.textContent = full;
        chips.classList.add('is-on');
        return;
      }
      p.innerHTML = '<span class="caret"></span>';
      gsap.fromTo(user, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'virga' });
      const o = { n: 0 };
      tw = gsap.to(o, {
        n: full.length,
        duration: full.length * 0.021,
        delay: 1,
        ease: 'none',
        onUpdate: () => (p.innerHTML = `${esc(full.slice(0, Math.round(o.n)))}<span class="caret"></span>`),
        onComplete: () => {
          p.textContent = full;
          chips.classList.add('is-on');
        },
      });
    },
    stop() {
      tw?.kill();
    },
  };
}

const CODE = [
  ['c', '// virga.lab — landing page sur mesure\n'],
  ['k', 'const '],
  ['', 'site = '],
  ['t', 'createSite'],
  ['', '({\n  marque: '],
  ['s', "'Votre marque'"],
  ['', ',\n  hero: { titre: '],
  ['s', "'Une offre claire'"],
  ['', ', cta: '],
  ['s', "'Demander un devis'"],
  ['', ' },\n  sections: ['],
  ['s', "'services'"],
  ['', ', '],
  ['s', "'projets'"],
  ['', ', '],
  ['s', "'contact'"],
  ['', '],\n  langues: ['],
  ['s', "'fr'"],
  ['', ', '],
  ['s', "'en'"],
  ['', ', '],
  ['s', "'ar'"],
  ['', '],\n});\n\nsite.'],
  ['t', 'connect'],
  ['', '('],
  ['s', "'crm'"],
  ['', ', '],
  ['s', "'whatsapp'"],
  ['', ');\nsite.'],
  ['t', 'deploy'],
  ['', '(); '],
  ['c', '// ✓ en ligne'],
];
const CODE_LEN = CODE.reduce((n, [, t]) => n + t.length, 0);

function renderCode(n) {
  let out = '';
  let left = n;
  for (const [cls, text] of CODE) {
    if (left <= 0) break;
    const part = esc(text.slice(0, left));
    out += cls ? `<span class="${cls}">${part}</span>` : part;
    left -= text.length;
  }
  return out;
}

function codeDemo(panel) {
  const code = $('[data-code]', panel);
  const site = $('.mini-site', panel);
  let tw;
  return {
    start() {
      tw?.kill();
      site.className = 'mini-site';
      if (reduced) {
        code.innerHTML = renderCode(CODE_LEN);
        site.classList.add('s1', 's2', 's3');
        return;
      }
      const o = { n: 0 };
      tw = gsap.to(o, {
        n: CODE_LEN,
        duration: 6.5,
        ease: 'none',
        onUpdate: () => {
          const p = o.n / CODE_LEN;
          code.innerHTML = `${renderCode(Math.round(o.n))}<span class="caret"></span>`;
          site.classList.toggle('s1', p > 0.12);
          site.classList.toggle('s2', p > 0.3);
          site.classList.toggle('s3', p > 0.62);
        },
      });
    },
    stop() {
      tw?.kill();
    },
  };
}

export function initLab() {
  const root = $('[data-lab]');
  if (!root) return;
  const tabs = $$('[role="tab"]', root);
  const ink = $('.lab__tabs-ink', root);
  const title = $('[data-lab-title]', root);
  const cta = $('.lab__copy .btn');
  const panels = Object.fromEntries($$('.lab__panel', root).map((p) => [p.dataset.panel, p]));
  const meta = {
    flow: { title: 'virga.lab / workflow — lead-to-client', brief: 'Automatisations' },
    ai: { title: 'virga.lab / agent — assistant commercial', brief: 'Intelligence artificielle' },
    web: { title: 'virga.lab / web — landing page', brief: 'Web & Apps' },
  };
  const demos = { flow: flowDemo(panels.flow), ai: chatDemo(panels.ai), web: codeDemo(panels.web) };
  let current = 'flow';
  let visible = false;

  const selected = () => tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0];
  const moveInk = (btn) => {
    ink.style.left = `${btn.offsetLeft}px`;
    ink.style.width = `${btn.offsetWidth}px`;
  };
  const select = (name, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        moveInk(t);
        if (focus) t.focus();
      }
    });
    Object.entries(panels).forEach(([k, p]) => (p.hidden = k !== name));
    demos[current].stop();
    current = name;
    title.textContent = meta[name].title;
    if (cta) cta.dataset.brief = meta[name].brief;
    if (visible) demos[name].start();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      select(tabs[n].dataset.tab, true);
    });
  });
  if (cta) cta.dataset.brief = meta.flow.brief;
  moveInk(tabs[0]);
  document.fonts.ready.then(() => moveInk(selected()));
  window.addEventListener('resize', () => moveInk(selected()));
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) demos[current].start();
      else demos[current].stop();
    },
    { threshold: 0.2 },
  ).observe(root);
}
