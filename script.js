// Сообщаем страховке в <head>, что скрипт загрузился и анимации можно не снимать
window.__motionReady = true;
const MOTION = document.documentElement.classList.contains('motion');

// ===== Меню на телефоне: открыть / закрыть по кнопке =====
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

function closeMenu() {
  nav.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Открыть меню');
}

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});

// Закрываем меню после нажатия на пункт
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));


// ===== Кнопки «Показать ещё» (работы, отзывы) =====
document.querySelectorAll('.more__btn').forEach((btn) => {
  const rest = document.getElementById(btn.getAttribute('aria-controls'));
  if (!rest) return;

  btn.addEventListener('click', () => {
    const opening = rest.hidden;
    rest.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    btn.textContent = opening ? btn.dataset.lessText : btn.dataset.moreText;

    // При сворачивании возвращаем к началу блока, чтобы не потеряться на странице
    if (!opening) btn.closest('.section').scrollIntoView({ behavior: 'smooth' });
  });
});


// ===== Просмотр фото крупно =====
const box = document.getElementById('lightbox');
const boxImg = box.querySelector('.lightbox__img');
const boxCount = box.querySelector('.lightbox__count');
let group = [];      // ссылки текущей галереи
let index = 0;
let lastFocus = null;

// Фото в свёрнутом блоке «Показать ещё» листаются только если блок открыт
function visibleLinks(name) {
  return [...document.querySelectorAll(`.zoom[data-gallery="${name}"]`)]
    .filter((a) => !a.closest('[hidden]'));
}

function show(i) {
  index = (i + group.length) % group.length;
  const link = group[index];
  // перезапускаем мягкое появление фото при каждом листании
  boxImg.classList.remove('is-anim');
  void boxImg.offsetWidth;
  boxImg.classList.add('is-anim');
  boxImg.src = link.getAttribute('href');
  boxImg.alt = link.querySelector('img')?.alt || '';
  boxCount.textContent = group.length > 1 ? `${index + 1} из ${group.length}` : '';
  const many = group.length > 1;
  box.querySelector('.lightbox__prev').hidden = !many;
  box.querySelector('.lightbox__next').hidden = !many;
}

function openBox(link) {
  group = visibleLinks(link.dataset.gallery);
  lastFocus = link;
  show(group.indexOf(link));
  box.hidden = false;
  document.body.classList.add('no-scroll');
  box.querySelector('.lightbox__close').focus();
}

function closeBox() {
  box.hidden = true;
  boxImg.removeAttribute('src');
  document.body.classList.remove('no-scroll');
  if (lastFocus) lastFocus.focus();
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('.zoom');
  if (!link) return;
  e.preventDefault();
  openBox(link);
});

box.querySelector('.lightbox__close').addEventListener('click', closeBox);
box.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
box.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));

// Клик по тёмному фону вокруг фото — закрыть
box.addEventListener('click', (e) => {
  if (e.target === box) closeBox();
});

document.addEventListener('keydown', (e) => {
  if (box.hidden) return;
  if (e.key === 'Escape') closeBox();
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});

// Свайп влево/вправо на телефоне
let touchX = null;
box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
box.addEventListener('touchend', (e) => {
  if (touchX === null || group.length < 2) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(dx < 0 ? index + 1 : index - 1);
  touchX = null;
});


// ===== Ветки эвкалипта: рисуем тонкой линией =====
// Стебель — плавная кривая, по бокам круглые листья по очереди слева/справа,
// у кончика — три медные ягодки. Каждая линия «прорисовывается» при появлении.
function sprigSVG(delay = 0) {
  const P = [[8, 112], [62, 104], [128, 42], [194, 8]];
  const r = (n) => Math.round(n * 10) / 10;
  const point = (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]);
  };
  const tangent = (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => 3 * u * u * (P[1][k] - P[0][k]) + 6 * u * t * (P[2][k] - P[1][k]) + 3 * t * t * (P[3][k] - P[2][k]));
  };

  let out = `<svg viewBox="-16 -34 244 182" focusable="false">`;
  out += `<path class="sp sp-stem" pathLength="1" style="--sd:${delay}s" d="M${P[0]} C${P[1]} ${P[2]} ${P[3]}"/>`;

  // Эвкалипт: круглые листья парами, друг напротив друга; к кончику мельче
  const pairs = 7;
  for (let i = 0; i < pairs; i++) {
    const t = 0.08 + i * (0.8 / (pairs - 1));
    const [x, y] = point(t);
    const [dx, dy] = tangent(t);
    const base = (Math.atan2(dy, dx) * 180) / Math.PI;
    const L = 31 - 15 * t;
    const p = 3;                    // черешок
    const w = 0.62 * L;             // ширина листа — почти круглый
    const leaf = `M0 0L${p} 0C${r(p + 0.04 * L)} ${r(-w)} ${r(p + 0.96 * L)} ${r(-w)} ${r(p + L)} 0` +
                 `C${r(p + 0.96 * L)} ${r(w)} ${r(p + 0.04 * L)} ${r(w)} ${p} 0`;
    [-1, 1].forEach((side, j) => {
      const angle = base + side * (62 - 8 * t);
      const d = r(delay + 0.4 + i * 0.16 + j * 0.06);
      out += `<g transform="translate(${r(x)} ${r(y)}) rotate(${r(angle)})">` +
             `<path class="sp sp-leaf" pathLength="1" style="--sd:${d}s" d="${leaf}"/>` +
             `<path class="sp sp-vein" pathLength="1" style="--sd:${r(d + 0.3)}s" d="M${p} 0L${r(p + 0.7 * L)} 0"/></g>`;
    });
  }

  // ягодки у кончика
  [[0.9, 10], [0.95, -9], [0.99, 7]].forEach(([t, off], i) => {
    const [x, y] = point(t);
    const [dx, dy] = tangent(t);
    const len = Math.hypot(dx, dy);
    const cx = x + (-dy / len) * off;
    const cy = y + (dx / len) * off;
    out += `<circle class="sp sp-berry" pathLength="1" style="--sd:${r(delay + 1.5 + i * 0.12)}s" cx="${r(cx)}" cy="${r(cy)}" r="2.6"/>`;
  });

  return out + '</svg>';
}

document.querySelectorAll('[data-sprig]').forEach((el) => {
  el.innerHTML = sprigSVG(parseFloat(el.dataset.sprigDelay || '0'));
});


// ===== Звёзды в отзывах: каждая отдельно, чтобы загорались по очереди =====
document.querySelectorAll('.review__stars').forEach((el) => {
  el.innerHTML = [...el.textContent].map((c, i) => `<span style="--s:${i}">${c}</span>`).join('');
});


// ===== Шапка: лёгкая тень, когда страница прокручена =====
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });


// ===== Тексты, цены и вопросы из Google Таблицы =====
// Как у сайта мамы: сначала сразу показываем сохранённое в браузере с прошлого раза
// (или текст, записанный в index.html), потом тихо обновляем из таблицы и сохраняем.
// На странице меняется только то, что в таблице действительно отличается, —
// если там то же самое, страница остаётся как есть.
const SHEET_ID = typeof GOOGLE_SHEET_ID === 'string' ? GOOGLE_SHEET_ID.trim() : '';
const CACHE_KEY = 'sofia-site-data-v1';
const NB = '\u00A0';   // неразрывный пробел
const WJ = '\u2060';   // невидимая «склейка»: строка не переносится на дефисе («2-х»)

function sheetUrl(name) {
  return 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(SHEET_ID) +
    '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(name);   // headers=1: заголовок ровно одна строка
}

// Разбор CSV с учётом кавычек и переносов строк внутри ячеек
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// head — проверка первой строки. Если листа с таким названием нет, Google молча отдаёт
// первый лист таблицы; по заголовкам колонок понимаем, что это не тот лист.
function fetchSheet(name, head) {
  return fetch(sheetUrl(name)).then((r) => {
    if (!r.ok) throw new Error(name);
    return r.text();
  }).then((t) => {
    const rows = parseCsv(t);
    if (!rows.length || !head.test(rows[0].join(' '))) throw new Error(name);
    return rows.slice(1).map((r) => r.map((c) => c.trim()));
  });
}

function loadFromSheet() {
  const optional = (p) => p.catch(() => null);   // нет листа — эта часть остаётся прежней
  return Promise.all([
    fetchSheet('Услуги', /услуг/i),
    optional(fetchSheet('О себе', /поле/i)),
    optional(fetchSheet('Контакты и график', /поле/i)),
    optional(fetchSheet('Вопросы', /вопрос/i)),
  ]).then(([services, about, contacts, faq]) => {
    // Если таблицу случайно испортили — не трогаем сайт
    if (!priceGroups(services).length) throw new Error('empty');
    const prev = readCache() || {};
    return {
      services,
      about: about || prev.about || null,
      contacts: contacts || prev.contacts || null,
      faq: faq || prev.faq || null,
    };
  });
}

function readCache() {
  try {
    const d = JSON.parse(localStorage.getItem(CACHE_KEY));
    return d && Array.isArray(d.services) ? d : null;
  } catch (e) { return null; }
}
function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
}

// --- Мелкие помощники ---

// Сравниваем тексты без учёта неразрывных пробелов и переносов
const norm = (s) => String(s).replace(/\u2060/g, '').replace(/\s+/g, ' ').trim();
const same = (el, text) => norm(el.textContent) === norm(text);
const keyOf = (s) => norm(s).toLowerCase().replace(/ё/g, 'е').replace(/[:.]$/, '');
const lines = (s) => String(s).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const display = (el, on) => { if (el.style.display !== (on ? '' : 'none')) el.style.display = on ? '' : 'none'; };

function make(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;   // только textContent: HTML из таблицы не выполняется
  return el;
}

// Короткие слова не остаются в конце строки, число не отрывается от слова
const SHORT = /(^|[\s(«"—–-])(в|во|и|а|но|на|по|за|из|от|до|не|ни|к|ко|с|со|у|о|об|обо|для|без|при|про|под|над|я|г\.|пр\.|ул\.)\s+/gi;
function typo(s) {
  const keep = (m, a, b) => a + b + NB;
  return String(s).replace(/[ \t]+/g, ' ').trim()
    .replace(SHORT, keep).replace(SHORT, keep)            // дважды — для «и в», «а на»
    .replace(/ (ли|же|бы)(?=[\s.,!?;:)»]|$)/gi, NB + '$1')  // частица — к предыдущему слову
    .replace(/ ([—–]) /g, NB + '$1 ')                     // тире не начинает строку
    .replace(/(\d) (?=\S)/g, '$1' + NB)                   // 7 лет, 2 000, 33 отзывам
    .replace(/ (\d{4})(?=$|[\s.,!?)])/g, NB + '$1')       // KANE 2026
    .replace(/(\d-[а-яё]{1,3}) /gi, '$1' + NB)           // «2-х пальцев» — одной строкой
    .replace(/(\d)-(?=[а-яё])/gi, '$1-' + WJ);            // и не рвётся на дефисе
}

// Склонение: 1 год, 2 года, 5 лет
function plural(n, one, few, many) {
  const a = n % 100, b = n % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  return b > 1 && b < 5 ? few : many;
}

// Ссылки — только http/https; «vk.ru/...» без https:// тоже принимаем
function safeUrl(v) {
  v = String(v || '').trim();
  if (!v) return '';
  if (!/^[a-z]+:/i.test(v) && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch (e) { return ''; }
}
const shortUrl = (u) => u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

// --- Вывод на страницу ---

function toMap(rows) {
  const m = {};
  (rows || []).forEach((r) => { if (r[0] && r[0].trim()) m[keyOf(r[0])] = (r[1] || '').trim(); });
  return m;
}

// Простой текст. Строки нет в таблице — оставляем как было.
// Пустая ячейка: необязательное поле (data-optional) прячем, обязательное оставляем как было.
function fillText(el, v) {
  const box = el.dataset.hide ? el.closest(el.dataset.hide) || el : el;
  if (v === undefined) return;
  if (!v) { if (el.hasAttribute('data-optional')) display(box, false); return; }
  display(box, true);
  if (same(el, v)) return;
  const hand = el.querySelector('.hero__hand');
  if (hand) {
    // Заголовок: два последних слова — рукописные
    const words = v.split(/\s+/);
    const k = words.length >= 3 ? 2 : words.length - 1;
    const tail = k > 0 ? words.splice(-k) : [];
    [...el.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); });
    el.insertBefore(document.createTextNode(typo(words.join(' ')) + ' '), hand);
    hand.textContent = typo(tail.join(' '));
    display(hand, tail.length > 0);
  } else if (el.hasAttribute('data-bold')) {
    // «1 место на чемпионате…»: число со словом (или первое слово) — жирным
    const m = v.match(/^(\d\S*\s+\S+|\S+)\s*([\s\S]*)$/);
    el.textContent = '';
    el.append(make('b', '', typo(m[1])), document.createTextNode(m[2] ? ' ' + typo(m[2]) : ''));
  } else {
    el.textContent = typo(v);
  }
}

// Абзацы: перенос строки в ячейке = новый абзац. Заменяются <p data-para> внутри блока.
function fillParas(box, v) {
  if (!v) return false;
  const texts = lines(v);
  const old = [...box.querySelectorAll(':scope > p[data-para]')];
  if (!texts.length || !old.length) return false;
  if (JSON.stringify(old.map((p) => norm(p.textContent))) === JSON.stringify(texts.map(norm))) return false;
  texts.forEach((t, i) => {
    const cls = (i === 0 && box.dataset.firstClass) || box.dataset.class || '';
    const p = make('p', cls, typo(t));
    p.setAttribute('data-para', '');
    box.insertBefore(p, old[0]);
  });
  old.forEach((p) => p.remove());
  return true;
}

// Стаж: крупная цифра «7» в «Обо мне» считается от 0 при появлении
const years = document.querySelector('.fact__big');
function setYears(n) {
  if (!years) return;
  years.dataset.to = String(n);
  if (!years.dataset.wait && !years.dataset.counting && years.textContent.trim() !== String(n)) years.textContent = String(n);
}

function fillNumbers(info) {
  const rating = info['рейтинг'];
  if (rating) {
    // 5 → 5,0; 4.85 → 4,9; текст вроде «5,0» — как написано
    const num = parseFloat(rating.replace(',', '.'));
    const r = /^\d+([.,]\d+)?$/.test(rating) ? num.toFixed(1).replace('.', ',') : rating;
    document.querySelectorAll('[data-rating]').forEach((el) => { if (!same(el, r)) el.textContent = r; });
    document.querySelectorAll('[data-rating-star]').forEach((el) => { if (!same(el, r + ' ★')) el.textContent = r + NB + '★'; });
  }

  const count = parseInt((info['число отзывов'] || '').replace(/\D/g, ''), 10);
  if (count > 0) {
    const t = count + NB + plural(count, 'отзыву', 'отзывам', 'отзывам');   // «по 33 отзывам», «по 21 отзыву»
    // Меняем «33 отзывам» прямо внутри текста блока, остальные слова и ссылки не трогаем
    document.querySelectorAll('[data-reviews-count]').forEach((box) => {
      box.childNodes.forEach((n) => {
        if (n.nodeType !== 3) return;
        const next = n.data.replace(/\d+\s+отзыв[а-яё]*/i, t);
        if (norm(next) !== norm(n.data)) n.data = next;
      });
    });
  }

  const n = parseInt(((info['стаж'] || '').match(/\d+/) || [])[0], 10);
  if (n > 0) {
    const word = plural(n, 'год', 'года', 'лет');
    setYears(n);
    document.querySelectorAll('[data-years]').forEach((el) => { if (!same(el, n + ' ' + word)) el.textContent = n + NB + word; });
    document.querySelectorAll('[data-years-word]').forEach((el) => { if (!same(el, word + ' опыта')) el.textContent = word + ' опыта'; });
  }
}

function fillLinks(info) {
  const phoneText = info['телефон'] || '';
  const phone = phoneText.replace(/[^\d+]/g, '');
  const links = {
    tel: phone.replace(/\D/g, '').length >= 5 ? 'tel:' + phone : '',
    vk: safeUrl(info['вконтакте (запись)']),
    vkpage: safeUrl(info['страница вконтакте']),
    group: safeUrl(info['группа с работами']),
    reviews: safeUrl(info['отзывы вконтакте']),
  };
  // Нет ссылки или она неправильная — остаётся та, что записана в index.html
  document.querySelectorAll('[data-link]').forEach((el) => {
    const href = links[el.dataset.link];
    if (!href) return;
    if (el.getAttribute('href') !== href) el.setAttribute('href', href);
    const text = el.dataset.show === 'phone' ? phoneText.replace(/\s+/g, NB)
      : el.dataset.show === 'url' ? shortUrl(href) : '';
    if (text && !same(el, text)) el.textContent = text;
  });
}

// --- Прайс ---

// Группы по «Категории» в порядке таблицы. Пустая категория — та же, что строкой выше.
// Строка с «нет» в колонке «Показывать» не выводится.
function priceGroups(rows) {
  const groups = [];
  let cat = '';
  (rows || []).forEach((r) => {
    if ((r[0] || '').trim()) cat = r[0].trim();
    const name = (r[1] || '').trim();
    if (!name || (r[4] || '').trim().toLowerCase() === 'нет') return;
    const title = cat || 'Другое';
    let g = groups.find((x) => x.title === title);
    if (!g) groups.push(g = { title, items: [] });
    g.items.push({ name, desc: (r[2] || '').trim().replace(/^\(([\s\S]*)\)$/, '$1').trim(), price: (r[3] || '').trim() });
  });
  return groups;
}

// Две колонки примерно поровну по высоте. Группы идут по порядку: первые — в левой колонке, остальные — в правой.
// Место разреза выбираем по настоящей высоте групп на странице (строки с пояснением и длинные названия выше).
// Сейчас так выходит: слева Маникюр и Дизайн, справа Педикюр — обе колонки одной высоты.
function splitAt(els) {
  const n = els.length;
  if (n < 2) return n;
  let h = els.map((g) => g.getBoundingClientRect().height);
  let gap = parseFloat(getComputedStyle(els[1]).marginTop) || 0;
  if (h.some((x) => !x)) { h = els.map((g) => g.querySelectorAll('li').length + 1.5); gap = 0; }   // страница ещё не нарисована
  const sum = (a, b) => h.slice(a, b).reduce((s, x) => s + x, 0);
  let best = 1, bestDiff = Infinity;
  for (let k = 1; k < n; k++) {
    const d = Math.abs((sum(0, k) + gap * (k - 1)) - (sum(k, n) + gap * (n - k - 1)));
    if (d < bestDiff - 1) { best = k; bestDiff = d; }
  }
  return best;
}

// То, что сейчас на странице, в том же виде — чтобы не перестраивать одинаковое
function pricesOnPage(box) {
  return [...box.querySelectorAll('.prices__group')]
    .map((g) => ({
      title: norm(g.querySelector('.prices__group-title').textContent),
      items: [...g.querySelectorAll('.price-list li')].map((li) => {
        const name = li.querySelector('.price-list__name').cloneNode(true);
        const small = name.querySelector('small');
        if (small) small.remove();
        return {
          name: norm(name.textContent),
          desc: small ? norm(small.textContent).replace(/^\(([\s\S]*)\)$/, '$1') : '',
          price: norm(li.querySelector('.price-list__price').textContent),
        };
      }),
    }));
}

function renderPrices(rows) {
  const box = document.querySelector('.prices__cols');
  const groups = priceGroups(rows);
  if (!box || !groups.length) return false;
  const wanted = groups.map((g) => ({
    title: norm(g.title),
    items: g.items.map((it) => ({ name: norm(it.name), desc: norm(it.desc), price: norm(it.price) })),
  }));
  if (JSON.stringify(pricesOnPage(box)) === JSON.stringify(wanted)) return false;

  const els = groups.map((g) => {
    const group = make('div', 'prices__group');
    const list = make('ul', 'price-list');
    g.items.forEach((it) => {
      const name = make('span', 'price-list__name', typo(it.name));
      if (it.desc) name.append(' ', make('small', '', '(' + typo(it.desc) + ')'));
      const li = make('li');
      li.append(name, make('span', 'price-list__price', it.price.replace(/\s+/g, NB)));   // цена как есть, без переносов
      list.append(li);
    });
    group.append(make('h3', 'prices__group-title', typo(g.title)), list);
    return group;
  });

  // Сначала все группы в левую колонку, меряем высоту, потом часть переносим вправо
  const left = make('div'), right = make('div');
  left.append(...els);
  box.replaceChildren(left, right);
  right.append(...els.slice(splitAt(els)));
  if (!right.children.length) right.remove();
  return true;
}

// --- Вопросы ---

function renderFaq(rows) {
  const box = document.querySelector('.faq__list');
  const items = (rows || []).filter((r) => (r[0] || '').trim())
    .map((r) => ({ q: r[0].trim(), a: lines(r[1] || '') }));
  if (!box || !items.length) return false;
  const onPage = [...box.querySelectorAll('.faq__item')].map((d) => ({
    q: norm(d.querySelector('.faq__q').textContent),
    a: [...d.querySelectorAll('.faq__a p')].map((p) => norm(p.textContent)),
  }));
  const wanted = items.map((it) => ({ q: norm(it.q), a: it.a.map(norm) }));
  if (JSON.stringify(onPage) === JSON.stringify(wanted)) return false;

  // Открытые вопросы остаются открытыми
  const open = [...box.querySelectorAll('.faq__item')].map((d) => d.open);
  box.replaceChildren(...items.map((it, i) => {
    const d = make('details', 'faq__item');
    d.open = !!open[i];
    const icon = make('span', 'faq__icon');
    icon.setAttribute('aria-hidden', 'true');
    const s = make('summary');
    s.append(make('span', 'faq__num', String(i + 1).padStart(2, '0')), make('span', 'faq__q', typo(it.q)), icon);
    const a = make('div', 'faq__a');
    it.a.forEach((t) => a.append(make('p', '', typo(t))));
    d.append(s, a);
    return d;
  }));
  return true;
}

// Возвращает блоки, которые пришлось перестроить (им нужно заново включить появление)
function render(data) {
  const info = Object.assign(toMap(data.about), toMap(data.contacts));
  const rebuilt = [];
  const steps = [
    () => document.querySelectorAll('[data-f]').forEach((el) => fillText(el, info[keyOf(el.dataset.f)])),
    () => document.querySelectorAll('[data-paras]').forEach((box) => fillParas(box, info[keyOf(box.dataset.paras)])),
    () => fillNumbers(info),
    () => fillLinks(info),
    () => data.services && renderPrices(data.services) && rebuilt.push(document.querySelector('.prices__cols')),
    () => data.faq && renderFaq(data.faq) && rebuilt.push(document.querySelector('.faq__list')),
  ];
  // Ошибка в одной части не ломает остальные: та часть остаётся как была
  steps.forEach((step) => { try { step(); } catch (e) { /* оставляем как было */ } });
  return rebuilt;
}

// Сохранённое с прошлого раза — сразу, до включения анимаций появления
try { const saved = readCache(); if (saved) render(saved); } catch (e) {}


// ===== Появление блоков при прокрутке =====
// write  — заголовок проявляется слева направо, как будто его пишут
// unfurl — блок раскрывается из нижнего левого угла, как лист
// land   — фото «опускается» на место с лёгким поворотом
// rise   — мягко поднимается снизу
// row    — строка прайса выезжает, пунктир дорисовывается
const REVEAL = [
  ['.section__title', 'write'],
  ['.about__intro', 'rise'],
  ['.fact', 'rise'],
  ['.about__photo', 'unfurl'],
  ['.care__points li', 'row'],
  ['.care__photo', 'land'],
  ['.room__title', 'rise'],
  ['.room__photo', 'land'],
  ['.care__label', 'rise'],
  ['.care__quote', 'land'],
  ['.works__item', 'land'],
  ['.works__cell', 'land'],
  ['.prices__card', 'rise'],    // высокая карточка: не прячем целиком, иначе на телефоне видна «дыра»
  ['.price-list li', 'row'],
  ['.prices__group-title', 'rise'],
  ['.gift__photo', 'land'],
  ['.gift__text', 'rise'],
  ['.certs__item', 'land'],
  ['.reviews__rating', 'rise'],
  ['.review', 'rise'],
  ['.contacts__inner', 'rise'],
  ['.more__bar', 'rise'],
  ['.faq__item', 'rise'],
  ['.faq__more', 'rise'],
  ['.footer__inner', 'rise'],
];

// Счётчик стажа: от 0 до числа из таблицы (data-to). Если число поменялось во время счёта — досчитает до нового.
function countUp(el) {
  const start = performance.now();
  const dur = 1100;
  delete el.dataset.wait;
  el.dataset.counting = '1';
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    const to = parseInt(el.dataset.to, 10) || 0;
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
    else delete el.dataset.counting;
  };
  requestAnimationFrame(step);
}

// Блоки, которые перестроились после загрузки таблицы, тоже должны появляться плавно
let revealNew = () => {};

if (MOTION && 'IntersectionObserver' in window) {
  const mark = (root) => REVEAL.forEach(([sel, type]) => {
    root.querySelectorAll(sel).forEach((el) => {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv');
      el.dataset.rv = type;
    });
  });
  mark(document);
  if (years) {
    years.dataset.to = years.textContent.trim();
    years.dataset.wait = '1';
    years.textContent = '0';
  }

  // Блоки, спрятанные через clip-path (unfurl, write), имеют «нулевую площадь»,
  // и браузер не сообщает, что они на экране. Поэтому за ними следит их родитель,
  // который виден всегда, а показываем — сам блок.
  const watchers = new Map();   // за кем следим -> какие блоки показать
  const watchOf = (el) => (el.dataset.rv === 'unfurl' || el.dataset.rv === 'write') ? el.parentElement : el;

  const reveal = (el, k) => {
    const delay = Math.min(k, 6) * 90;
    el.style.setProperty('--d', `${delay}ms`);
    el.classList.add('is-in');
    // после появления убираем задержку, чтобы наведение мышкой срабатывало сразу
    setTimeout(() => el.style.setProperty('--d', '0ms'), delay + 1600);
    if (el.classList.contains('fact--years') && years) countUp(years);
  };

  const io = new IntersectionObserver((entries) => {
    // то, что появилось одновременно, — по очереди, с небольшим шагом
    let k = 0;
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      (watchers.get(e.target) || []).forEach((el) => reveal(el, k++));
      watchers.delete(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });   // появляется, как только край заглянул на экран

  const watched = new WeakSet();
  const watch = (el) => {
    if (watched.has(el)) return;
    watched.add(el);
    const w = watchOf(el);
    if (!watchers.has(w)) { watchers.set(w, []); io.observe(w); }
    watchers.get(w).push(el);
  };
  document.querySelectorAll('.rv, [data-sprig]').forEach(watch);

  revealNew = (root) => {
    mark(root);
    root.querySelectorAll('.rv:not(.is-in)').forEach(watch);
  };
} else {
  // Без анимаций: ветки сразу нарисованы, «волны» стоят на месте
  document.querySelectorAll('[data-sprig]').forEach((el) => el.classList.add('is-in'));
  document.querySelectorAll('.wave animate').forEach((a) => a.remove());
}


// ===== Свежие данные из таблицы =====
// Не загрузилось (нет интернета, таблица закрыта, испорчена) — остаётся последнее хорошее.
if (SHEET_ID && window.fetch) {
  loadFromSheet().then((data) => {
    writeCache(data);
    render(data).forEach((box) => revealNew(box));
  }).catch(() => { /* оставляем то, что уже на странице */ });
}
