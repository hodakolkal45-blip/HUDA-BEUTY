/* Language toggle + booking form -> WhatsApp. Facts come from client.md. */

const WA_NUMBER = '905340793685';              // client.md
const PHONE_DISPLAY = '+90 534 079 36 85';     // client.md
const STORAGE_KEY = 'hgs-lang';
const THEME_KEY = 'hgs-theme';
const DEFAULT_LANG = 'tr';                     // Turkish default, no auto-detect

// Same order as i18n[lang].services
const SERVICE_IMAGES = [
  'svc-bridal', 'svc-cut', 'svc-color', 'svc-keratin',
  'svc-blowdry', 'svc-updo', 'svc-care', 'svc-makeup',
  'epilasyon-1', 'cilt-1'                       // thumbnails reuse the first photo of each pair
];
const GALLERY_IMAGES = [
  'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9',
  'g10', 'g11', 'g12', 'g13', 'g14', 'g15', 'g16', 'g17', 'g18'
];

// Sub-service photos, keyed by index in services, in the same order as svc.items.
// They reuse the gallery files — no separate thumbnails to keep in step.
const SUB_IMAGES = {
  1: ['g7', 'g8'],                    // Türk Stili, Suriye Stili
  2: ['g10', 'g11', 'g12', 'g13'],    // Röfle, Ombre, Sombre, Sarı Hatlı
  7: ['g14', 'g16', 'g17', 'g18'],    // Gelin, Porselen, Gece / Nişan, Günlük / Soft
  // Services with `photos` (no named items): two photos, books as the service itself.
  8: ['epilasyon-1', 'epilasyon-2'],
  9: ['cilt-1', 'cilt-2']
};

// Real salon photos, same order as i18n[lang].salon
const SALON_IMAGES = Array.from({ length: 10 }, (_, i) => `salon-${i + 1}`);

const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

let lang = DEFAULT_LANG;

function applyLang(next) {
  lang = i18n[next] ? next : DEFAULT_LANG;
  const t = i18n[lang];

  document.documentElement.lang = t.htmlLang;
  document.documentElement.dir = t.dir;
  localStorage.setItem(STORAGE_KEY, lang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t[el.dataset.i18n] || '';
  });

  // data-i18n-attr="placeholder:booking.namePh" or several, comma-separated
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      el.setAttribute(attr, t[key] || '');
    });
  });

  document.querySelectorAll('.lang-toggle').forEach((btn) => {
    btn.textContent = t.langToggleText;
    btn.setAttribute('aria-label', t.langToggleLabel);
  });

  document.getElementById('wa-float').href = waLink(t['wa.greeting']);
  document.getElementById('wa-float').setAttribute('aria-label', t['wa.aria']);
  syncThemeButton();

  renderServices(t);
  renderDeck(document.getElementById('gallery-deck'), GALLERY_IMAGES, t.gallery, t, t['gallery.title']);
  renderDeck(document.getElementById('salon-deck'), SALON_IMAGES, t.salon, t, t['salon.title']);
}

/* Theme is independent of language: stored choice wins, otherwise the system decides.
   The inline script in <head> already set it before paint; this keeps the two in step. */
function applyTheme(dark) {
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  syncThemeButton();
}

function syncThemeButton() {
  const btn = document.getElementById('theme-toggle');
  const dark = document.documentElement.dataset.theme === 'dark';
  btn.setAttribute('aria-pressed', String(dark));
  // Label names what the press will do, not what the theme currently is.
  btn.setAttribute('aria-label', i18n[lang][dark ? 'theme.toLight' : 'theme.toDark']);
}

function renderServices(t) {
  const list = document.getElementById('service-list');
  const select = document.getElementById('f-service');

  list.innerHTML = '';
  select.innerHTML = '';

  const placeholder = new Option(t['booking.servicePh'], '');
  placeholder.disabled = true;
  placeholder.selected = true;
  select.add(placeholder);

  t.services.forEach((svc, i) => {
    const featured = i === 0;                   // bridal preparation is the flagship
    const expands = Boolean(svc.items || svc.photos);
    const li = document.createElement('li');
    li.className = 'reveal';

    const rowInner = `
        <img src="assets/img/${SERVICE_IMAGES[i]}-t.webp" alt="" loading="lazy" width="200" height="250">
        <span>
          ${featured ? '<span class="service-eyebrow"></span>' : ''}
          <span class="service-name"></span>
          <span class="service-desc"></span>
        </span>
        <span class="service-arrow" aria-hidden="true">${expands ? '&#9662;' : '&rarr;'}</span>`;

    if (expands) {
      // Native <details> does the toggling, so there is no open/close JS — and a
      // closed row never fetches its sub-service photos.
      li.innerHTML = `
      <details class="service-group">
        <summary class="service-row">${rowInner}</summary>
        <ul class="service-subs"></ul>
      </details>`;
    } else {
      li.innerHTML = `
      <a class="service-row${featured ? ' service-row-featured' : ''}" href="#booking">${rowInner}</a>`;
      li.querySelector('.service-row').dataset.service = svc.name;
    }

    li.querySelector('img').alt = svc.alt;
    li.querySelector('.service-name').textContent = svc.name;
    li.querySelector('.service-desc').textContent = svc.desc;
    if (featured) li.querySelector('.service-eyebrow').textContent = t['services.featured'];

    if (expands) {
      const subs = li.querySelector('.service-subs');
      (svc.items || svc.photos).forEach((item, n) => {
        const file = SUB_IMAGES[i][n];
        const link = document.createElement('a');
        link.href = '#booking';
        // Named items book the sub-service; photo-only services book the service itself.
        link.dataset.service = svc.items ? `${svc.name} — ${item}` : svc.name;
        const img = document.createElement('img');
        img.src = `assets/img/${file}.webp`;
        // The photo's own description, not the name repeated under it.
        img.alt = svc.items ? t.gallery[GALLERY_IMAGES.indexOf(file)].alt : item;
        img.loading = 'lazy';
        img.width = 800;
        img.height = 800;
        link.append(img);
        if (svc.items) {
          const label = document.createElement('span');
          label.textContent = item;
          link.append(label);
        }
        const subLi = document.createElement('li');
        subLi.style.setProperty('--i', n);
        subLi.appendChild(link);
        subs.appendChild(subLi);
      });
    }

    list.appendChild(li);

    // A service with sub-services books the sub-service, not the category.
    if (svc.items) {
      const group = document.createElement('optgroup');
      group.label = svc.name;
      svc.items.forEach((item) => group.appendChild(new Option(item, `${svc.name} — ${item}`)));
      select.add(group);
    } else {
      select.add(new Option(svc.name, svc.name));
    }
  });

  observeReveals();
}

/* Swipeable card deck (Gallery + Salon). order[0] is the top card. Drag it sideways:
   past 30% of its width, or flicked faster than 0.11 px/ms, it flies off to the back. */
const DECK_FLY_MS = 280;                         // keep in step with --deck-ms in style.css

function renderDeck(el, files, texts, t, label) {
  const n = files.length;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Cards leave toward the reading-start edge, so "next" feels the same in RTL.
  const side = () => (document.documentElement.dir === 'rtl' ? 1 : -1);

  el.innerHTML = `
    <div class="deck-stack" role="group" tabindex="0"></div>
    <div class="deck-bar">
      <button type="button" class="deck-btn deck-prev"><span aria-hidden="true">&larr;</span></button>
      <div class="deck-info">
        <p class="deck-cap" aria-live="polite"></p>
        <p class="deck-count"></p>
      </div>
      <button type="button" class="deck-btn deck-next"><span aria-hidden="true">&rarr;</span></button>
    </div>
    <p class="deck-hint"></p>`;

  const stack = el.querySelector('.deck-stack');
  const cap = el.querySelector('.deck-cap');
  const count = el.querySelector('.deck-count');
  stack.setAttribute('aria-label', `${label} — ${t['deck.hint']}`);
  el.querySelector('.deck-hint').textContent = t['deck.hint'];
  el.querySelector('.deck-prev').setAttribute('aria-label', t['deck.prev']);
  el.querySelector('.deck-next').setAttribute('aria-label', t['deck.next']);

  const cards = files.map((file, i) => {
    const card = document.createElement('div');
    card.className = 'deck-card';
    const img = document.createElement('img');
    img.dataset.src = `assets/img/${file}.webp`;   // set only once the card is near the top
    img.alt = texts[i].alt;
    img.width = 680;
    img.height = 907;
    img.draggable = false;
    img.loading = 'lazy';                         // below the fold: decks fetch only when near the viewport
    card.appendChild(img);
    stack.appendChild(card);
    return card;
  });

  // Survives a language switch: the deck is rebuilt but stays on the same photo.
  let top = el._top || 0;
  const order = cards.map((_, i) => (i + top) % n);
  let busy = false;

  function layout() {
    order.forEach((idx, pos) => {
      const card = cards[idx];
      card.dataset.pos = Math.min(pos, 3);        // 3 = tucked away, invisible
      card.style.zIndex = n - pos;
      card.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      const img = card.firstChild;
      if (pos < 3 && !img.src) img.src = img.dataset.src;
    });
    top = order[0];
    el._top = top;
    cap.textContent = texts[top].cap;
    count.textContent = `${top + 1} / ${n}`;
  }

  function next(animate, dir) {
    if (busy) return;
    const card = cards[order[0]];
    order.push(order.shift());
    layout();
    if (!animate || reduced()) {
      card.style.transition = '';                 // clear any drag offset; layout() already restacked
      card.style.transform = '';
      card.style.opacity = '';
      return;
    }
    busy = true;
    card.style.transition = '';                   // drop the drag's "none"
    card.style.zIndex = n + 1;                    // stay above the stack while leaving
    card.style.transform = `translateX(${dir * 130}%) rotate(${dir * 12}deg)`;
    card.style.opacity = '0';
    setTimeout(() => {
      card.style.transition = 'none';
      card.style.transform = '';
      card.style.opacity = '';
      card.style.zIndex = 1;                      // back of the stack
      void card.offsetWidth;                      // commit the reset before transitions return
      card.style.transition = '';
      busy = false;
    }, DECK_FLY_MS + 10);
  }

  function prev(animate) {
    if (busy) return;
    order.unshift(order.pop());
    const card = cards[order[0]];
    if (!animate || reduced()) { layout(); return; }
    busy = true;
    const dir = -side();                          // enters from where "next" leaves
    card.style.transition = 'none';
    card.style.transform = `translateX(${dir * -130}%) rotate(${dir * -12}deg)`;
    card.style.opacity = '0';
    layout();
    void card.offsetWidth;
    card.style.transition = '';
    card.style.transform = '';
    card.style.opacity = '';
    setTimeout(() => { busy = false; }, DECK_FLY_MS + 10);
  }

  // --- drag (Pointer Events: mouse, touch and pen) ---
  let drag = null;
  stack.addEventListener('pointerdown', (e) => {
    if (busy || drag || !e.isPrimary || e.button > 0) return;   // 2nd finger / right click: ignore
    const card = cards[order[0]];
    drag = { id: e.pointerId, card, x0: e.clientX, lastX: e.clientX, lastT: e.timeStamp, vx: 0, dx: 0 };
    card.style.transition = 'none';
    stack.setPointerCapture(e.pointerId);
    stack.classList.add('is-dragging');
  });
  stack.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    drag.vx = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    drag.card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx * 0.04}deg)`;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { card, dx } = drag;
    const vx = e.timeStamp - drag.lastT > 100 ? 0 : drag.vx;   // a long pause before release is not a flick
    drag = null;
    stack.classList.remove('is-dragging');
    const far = Math.abs(dx) > card.offsetWidth * 0.3;
    const flick = Math.abs(vx) > 0.11 && Math.abs(dx) > 12 && Math.sign(vx) === Math.sign(dx);   // 12px: a tap's jitter is not a swipe
    if (e.type !== 'pointercancel' && (far || flick)) {
      next(true, Math.sign(dx));
    } else {
      card.style.transition = '';                 // springs back along the card's own transition
      card.style.transform = '';
    }
  };
  stack.addEventListener('pointerup', endDrag);
  stack.addEventListener('pointercancel', endDrag);

  // --- buttons + keyboard (keyboard never animates) ---
  el.querySelector('.deck-next').addEventListener('click', () => next(true, side()));
  el.querySelector('.deck-prev').addEventListener('click', () => prev(true));
  stack.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const forward = (e.key === 'ArrowRight') === (side() === -1);
    if (forward) next(false); else prev(false);
  });

  layout();
  observeReveals();
}

/* Fade sections in once, unless the visitor asked for less motion. */
let revealObserver = null;
function observeReveals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
  }
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));
}

function init() {
  document.getElementById('year').textContent = new Date().getFullYear();

  const tel = `tel:+${WA_NUMBER}`;
  document.getElementById('header-call').href = tel;
  const contactPhone = document.getElementById('contact-phone');
  contactPhone.href = tel;
  contactPhone.querySelector('bdi').textContent = PHONE_DISPLAY;

  // No appointments in the past.
  document.getElementById('f-date').min = new Date().toISOString().slice(0, 10);

  document.querySelectorAll('.lang-toggle').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(lang === 'tr' ? 'ar' : 'tr'));
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'dark');
  });

  // No stored choice yet? Keep following the system if it changes mid-visit.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      if (e.matches) document.documentElement.dataset.theme = 'dark';
      else delete document.documentElement.dataset.theme;
      syncThemeButton();
    }
  });

  // Delegated once here, not in renderServices — the list is rebuilt on every language switch.
  document.getElementById('service-list').addEventListener('click', (e) => {
    const el = e.target.closest('[data-service]');
    if (el) document.getElementById('f-service').value = el.dataset.service;
  });

  document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();                          // browser has already enforced `required`
    const f = e.target.elements;   // not e.target.name — that's the form's own name property
    const data = {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      service: f.service.value,
      date: f.date.value,
      time: f.time.value
    };
    window.open(waLink(i18n[lang].waTemplate(data)), '_blank', 'noopener');
  });

  applyLang(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
  observeReveals();
  document.documentElement.classList.add('ready');   // see the end of style.css

  // The lists exist now, so the document is its real height. Start at the top —
  // but never fight a deep link like index.html#booking shared from WhatsApp.
  if (!location.hash) window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', init);
