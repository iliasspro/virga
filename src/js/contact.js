import { gsap, $, $$, reduced } from './core.js';
import { contact } from '../data.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initContact() {
  const form = $('[data-brief-form]');
  if (!form) return;
  const steps = $$('.brief__step', form);
  const labels = $$('.brief__steps li', form);
  const fillPath = $('.brief__fill', form);
  const prev = $('[data-prev]', form);
  const next = $('[data-next]', form);
  const submit = $('[data-submit]', form);
  const error = $('[data-error]', form);
  const done = $('.brief__done', form);
  const nav = $('.brief__nav', form);
  const progress = $('.brief__progress', form);
  let step = 0;

  const len = fillPath.getTotalLength();
  fillPath.style.strokeDasharray = `${len}`;
  const paint = () => {
    fillPath.style.strokeDashoffset = `${len * (1 - (step + 1) / steps.length)}`;
    labels.forEach((l, i) => {
      l.classList.toggle('is-active', i === step);
      l.classList.toggle('is-done', i < step);
    });
    prev.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    submit.hidden = step !== steps.length - 1;
  };

  const show = (i, dir = 1) => {
    const from = steps[step];
    const to = steps[i];
    error.textContent = '';
    if (from === to) return;
    from.hidden = true;
    to.hidden = false;
    step = i;
    paint();
    if (!reduced) gsap.fromTo(to, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'virga' });
    const focusable = to.querySelector('input:not([type="hidden"])');
    focusable?.focus({ preventScroll: true });
  };

  const valid = () => {
    if (step === 0 && !$$('input[name="services"]:checked', form).length) {
      error.textContent = 'Choisissez au moins un type de projet.';
      return false;
    }
    if (step === 2) {
      const name = form.elements.name;
      const email = form.elements.email;
      name.closest('.field').classList.toggle('is-invalid', !name.value.trim());
      email.closest('.field').classList.toggle('is-invalid', !EMAIL_RE.test(email.value.trim()));
      if (!name.value.trim()) {
        error.textContent = 'Indiquez votre nom.';
        name.focus();
        return false;
      }
      if (!EMAIL_RE.test(email.value.trim())) {
        error.textContent = 'Cette adresse e-mail ne semble pas valide.';
        email.focus();
        return false;
      }
    }
    return true;
  };

  next.addEventListener('click', () => valid() && show(step + 1, 1));
  prev.addEventListener('click', () => show(step - 1, -1));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < steps.length - 1) {
      e.preventDefault();
      next.click();
    }
  });
  form.addEventListener('change', () => (error.textContent = ''));

  const compose = () => {
    const f = new FormData(form);
    const services = f.getAll('services').join(', ');
    const rows = [
      ['Projet', services],
      ['Budget', f.get('budget') || 'Non précisé'],
      ['Échéance', f.get('timing') || 'Non précisée'],
      ['Nom', f.get('name')],
      ['Entreprise', f.get('company') || '—'],
      ['E-mail', f.get('email')],
      ['Téléphone', f.get('phone') || '—'],
      ['Message', f.get('message') || '—'],
    ];
    return {
      data: Object.fromEntries(rows),
      text: `Nouveau brief — site VIRGA\n\n${rows.map(([k, v]) => `${k} : ${v}`).join('\n')}`,
      subject: `Brief VIRGA — ${services}`,
    };
  };

  const finish = (text) => {
    steps.forEach((s) => (s.hidden = true));
    nav.hidden = true;
    progress.hidden = true;
    done.hidden = false;
    $('[data-done-text]', done).textContent = text;
    if (!reduced) gsap.fromTo(done, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'virga' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid()) return;
    const { data, text, subject } = compose();
    submit.disabled = true;
    if (contact.formEndpoint) {
      try {
        const res = await fetch(contact.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, _subject: subject }),
        });
        if (res.ok) {
          finish('Votre brief est bien arrivé. Nous revenons vers vous très vite avec une première approche.');
          return;
        }
      } catch {
        /* fall back to e-mail below */
      }
    }
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    finish('Votre messagerie s’ouvre avec le brief pré-rempli : il ne reste plus qu’à l’envoyer.');
    if (contact.whatsapp) {
      const wa = document.createElement('a');
      wa.className = 'btn btn--teal';
      wa.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'Envoyer plutôt sur WhatsApp';
      wa.style.marginTop = '22px';
      done.append(wa);
    }
  });

  // services pre-selected from "En savoir plus" links
  window.addEventListener('virga:brief', (e) => {
    const value = e.detail;
    const input = $$('input[name="services"]', form).find((i) => i.value === value);
    if (!input) return;
    if (!done.hidden) return;
    input.checked = true;
    if (step !== 0) show(0, -1);
    const chip = input.nextElementSibling;
    if (!reduced) gsap.fromTo(chip, { scale: 0.85 }, { scale: 1, duration: 0.8, delay: 1.1, ease: 'elastic.out(1, 0.45)' });
  });

  paint();
}
