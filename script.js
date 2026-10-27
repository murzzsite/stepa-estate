const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/TW4LB5RQYK';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== rail: старт на середине экрана, стыковка вверху =====
  const rail = $('#header');
  const opening = $('#opening');
  const pic2img = $('.pic2 img');
  const pic2 = $('.pic2');
  const root = document.documentElement;
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    root.style.setProperty('--sy', y + 'px');
    const end = opening.offsetTop + opening.offsetHeight;
    rail.classList.toggle('is-docked', y + rail.offsetHeight > end);
    if (!reduce && pic2img && pic2) {
      const r = pic2.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        pic2img.style.transform = `translate3d(0, ${(-p * 9).toFixed(2)}%, 0)`;
      }
    }
    sceneUpdate();
    barUpdate();
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ===== menu =====
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(true));
  $('#menuClose')?.addEventListener('click', () => setMenu(false));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ===== smooth anchors =====
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - (href === '#top' ? 0 : 0);
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // ===== split headings + reveal (классы добавляет только JS) =====
  const splitTargets = $$('h2:not(.svc__head h2):not(.contact__card h2)');
  splitTargets.forEach(h => {
    if (reduce) return;
    const text = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = text.map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--i:${i}">${w}</span></span>`).join(' ');
    h.classList.add('split');
  });
  const revealSel = [
    '.calc__intro p', '.field', '.res', '.calc__note',
    '.proc__btns', '.moment', '.after__pic', '.table li',
    '.facts', '.qa details', '.faq__cta', '.faq__tall', '.faq__sq',
    '.contact__card > *', '.foot__bar', '.credits', '.hero__cta'
  ];
  const revealEls = $$(revealSel.join(','));
  revealEls.forEach(el => {
    if (reduce) return;
    el.classList.add('reveal');
    const sibs = [...el.parentElement.children].filter(c => c.matches(revealSel.join(',')));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * 80 + 'ms');
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  [...splitTargets, ...$$('.reveal')].forEach(el => io.observe(el));
  // страховка: если что-то не успело появиться — показать
  setTimeout(() => $$('.reveal:not(.is-visible), .split:not(.is-visible)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) el.classList.add('is-visible');
  }), 2500);

  // footer wordmark by letters
  const fn = $('#footName');
  if (fn) {
    const txt = fn.textContent;
    if (!reduce) {
      fn.innerHTML = [...txt].map((c, i) => `<span style="--i:${i}" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      io.observe(fn);
    }
  }

  // ===== services svc =====
  const svc = $('#services');
  const tabs = $$('.svc__list button');
  const panels = $$('.panel');
  const pics = $$('.svc__pics img');
  let cur = 0;
  const setScene = i => {
    if (i === cur) return;
    cur = i;
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    panels.forEach((p, k) => p.classList.toggle('is-on', k === i));
    pics.forEach((p, k) => p.classList.toggle('is-on', k === i));
  };
  function sceneUpdate() {
    if (!svc) return;
    const r = svc.getBoundingClientRect();
    const total = svc.offsetHeight - innerHeight;
    const p = clamp(-r.top / total, 0, 0.9999);
    setScene(Math.floor(p * tabs.length));
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    const total = svc.offsetHeight - innerHeight;
    const top = svc.getBoundingClientRect().top + window.scrollY + total * ((i + 0.5) / tabs.length);
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));
  // lazy-картинки сцены грузим заранее — иначе кроссфейд моргнёт
  pics.forEach(p => { p.loading = 'eager'; });

  // ===== calculator =====
  const f = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const price = $('#cPrice'), rent = $('#cRent'), cost = $('#cCost'), rate = $('#cRate');
  const outs = { y: $('#rYield'), p: $('#rPay'), r: $('#rRub') };
  const shown = { y: 0, p: 0, r: 0 };
  const targets = { y: 0, p: 0, r: 0 };
  const fmt = {
    y: v => v.toFixed(1).replace('.', ',') + ' %',
    p: v => (v > 99 ? '99+' : v.toFixed(1).replace('.', ',')) + ' л.',
    r: v => (v / 1e6).toFixed(2).replace('.', ',') + ' млн ₽'
  };
  let raf = 0;
  const tween = () => {
    let moving = false;
    for (const k of ['y', 'p', 'r']) {
      const d = targets[k] - shown[k];
      if (Math.abs(d) > Math.abs(targets[k]) * 0.002 + 0.001) { shown[k] += d * 0.18; moving = true; } else shown[k] = targets[k];
      outs[k].textContent = fmt[k](shown[k]);
    }
    raf = moving ? requestAnimationFrame(tween) : 0;
  };
  const calc = () => {
    const P = +price.value, R = +rent.value, C = +cost.value, X = +rate.value;
    $('#oPrice').textContent = f(P) + ' ฿';
    $('#oRent').textContent = f(R) + ' ฿';
    $('#oCost').textContent = C + ' %';
    $('#oRate').textContent = X.toFixed(2).replace('.', ',') + ' ₽';
    const net = R * 12 * (1 - C / 100);
    targets.y = (net / P) * 100;
    targets.p = net > 0 ? P / net : 99.9;
    targets.r = P * X;
    if (reduce) { for (const k in targets) shown[k] = targets[k]; for (const k of ['y', 'p', 'r']) outs[k].textContent = fmt[k](shown[k]); }
    else if (!raf) raf = requestAnimationFrame(tween);
  };
  [price, rent, cost, rate].forEach(el => el.addEventListener('input', calc));
  calc();

  // ===== process row =====
  const row = $('#row'), fill = $('#barFill');
  function barUpdate() {
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    const share = row.clientWidth / row.scrollWidth;
    const p = max > 0 ? row.scrollLeft / max : 0;
    fill.style.width = (share * 100) + '%';
    fill.style.transform = `translateX(${p * (1 / share - 1) * 100}%)`;
  }
  row?.addEventListener('scroll', barUpdate, { passive: true });
  const step = () => (row.querySelector('.moment')?.offsetWidth || 300) + 32;
  $('#prev')?.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#next')?.addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));
  let drag = null;
  row?.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, l: row.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) { drag.moved = true; row.classList.add('is-drag'); }
    if (drag.moved) row.scrollLeft = drag.l - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    row.classList.remove('is-drag');
    drag = null;
  });
  row?.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') row.scrollBy({ left: step(), behavior: 'smooth' });
    if (e.key === 'ArrowLeft') row.scrollBy({ left: -step(), behavior: 'smooth' });
  });

  // ===== form -> Cloudflare Worker -> Telegram =====
  const form = $('#leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { alert('Заполните имя и контакт для связи'); return; }
    if (!payload.consent) { alert('Нужно согласие на обработку данных'); return; }
    delete payload.consent;
    payload.comment = `Цель: ${payload.goal}; бюджет: ${payload.budget}`;
    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3500);
    }
  });

  frame();
})();
