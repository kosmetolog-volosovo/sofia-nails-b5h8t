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


// ===== Появление блоков при прокрутке =====
// write  — заголовок проявляется слева направо, как будто его пишут
// unfurl — блок раскрывается из нижнего левого угла, как лист
// land   — фото «опускается» на место с лёгким поворотом
// rise   — мягко поднимается снизу
// row    — строка прайса выезжает, пунктир дорисовывается
const REVEAL = [
  ['.section__title', 'write'],
  ['.fact', 'rise'],
  ['.about__photo', 'unfurl'],
  ['.care__points li', 'row'],
  ['.care__label', 'rise'],
  ['.care__quote', 'land'],
  ['.works__item', 'land'],
  ['.works__cell', 'land'],
  ['.prices__card', 'rise'],    // высокая карточка: не прячем целиком, иначе на телефоне видна «дыра»
  ['.price-list li', 'row'],
  ['.prices__group-title', 'rise'],
  ['.certs__item', 'land'],
  ['.reviews__rating', 'rise'],
  ['.review', 'rise'],
  ['.contacts__inner', 'rise'],
  ['.more__bar', 'rise'],
  ['.footer__inner', 'rise'],
];

// Счётчик «7 лет»: от 0 до 7
const years = document.querySelector('.fact__big');
function countUp(el, to) {
  const start = performance.now();
  const dur = 1100;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

if (MOTION && 'IntersectionObserver' in window) {
  REVEAL.forEach(([sel, type]) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('rv');
      el.dataset.rv = type;
    });
  });
  if (years) years.textContent = '0';

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
    if (el.classList.contains('fact--years') && years) countUp(years, 7);
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

  document.querySelectorAll('.rv, [data-sprig]').forEach((el) => {
    const w = watchOf(el);
    if (!watchers.has(w)) { watchers.set(w, []); io.observe(w); }
    watchers.get(w).push(el);
  });
} else {
  // Без анимаций: ветки сразу нарисованы, «волны» стоят на месте
  document.querySelectorAll('[data-sprig]').forEach((el) => el.classList.add('is-in'));
  document.querySelectorAll('.wave animate').forEach((a) => a.remove());
}
