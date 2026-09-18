/* Демо-карточка объекта BuzzTravel: галерея, расчёт, календарь, заявка.
   Все данные вымышленные, ничего никуда не отправляется. */

/* ===== Галерея ===== */
const PHOTOS = [
  { src: 'img/gostinaya.jpg',  alt: 'Гостиная с диваном и обеденной зоной' },
  { src: 'img/spalnya.jpg',    alt: 'Спальня с двуспальной кроватью' },
  { src: 'img/kuhnya.jpg',     alt: 'Светлая кухня с посудой' },
  { src: 'img/stol.jpg',       alt: 'Обеденный стол на кухне' },
  { src: 'img/vannaya.jpg',    alt: 'Ванная комната с душем и ванной' },
  { src: 'img/gostinaya2.jpg', alt: 'Вторая зона гостиной с рабочим местом' }
];

const shot = document.getElementById('shot');
const counter = document.getElementById('counter');
const thumbs = document.getElementById('thumbs');
let current = 0;

thumbs.innerHTML = PHOTOS.map((p, i) =>
  `<button type="button" data-i="${i}" aria-label="Фото ${i + 1}" aria-current="${i === 0}"><img src="${p.src}" alt=""></button>`
).join('');

function showPhoto(i) {
  current = (i + PHOTOS.length) % PHOTOS.length;
  shot.src = PHOTOS[current].src;
  shot.alt = PHOTOS[current].alt;
  counter.textContent = `${current + 1} / ${PHOTOS.length}`;
  thumbs.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-current', String(n === current)));
}

document.getElementById('prev').addEventListener('click', () => showPhoto(current - 1));
document.getElementById('next').addEventListener('click', () => showPhoto(current + 1));
thumbs.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (b) showPhoto(Number(b.dataset.i));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showPhoto(current - 1);
  if (e.key === 'ArrowRight') showPhoto(current + 1);
});

/* ===== Цены и занятые даты ===== */
const PRICE = { base: 3400, weekend: 1.15, cleaning: 800, longStay: 5, longDiscount: 0.1 };

const today = new Date(); today.setHours(0, 0, 0, 0);
const iso = (d) => d.toISOString().slice(0, 10);
const plus = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

// вымышленная занятость: три отрезка в ближайшие 30 дней
const BUSY = new Set();
[[4, 6], [12, 15], [22, 23]].forEach(([a, b]) => {
  for (let i = a; i <= b; i++) BUSY.add(iso(plus(i)));
});

/* ===== Календарь занятости ===== */
const cal = document.getElementById('cal');
const WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
let html = WD.map((w) => `<div class="cal__wd">${w}</div>`).join('');
const startShift = (plus(0).getDay() + 6) % 7;      // понедельник — первый
for (let i = 0; i < startShift; i++) html += '<div></div>';
for (let i = 0; i < 30; i++) {
  const d = plus(i);
  const busy = BUSY.has(iso(d));
  html += `<div class="cal__day ${busy ? 'cal__day--busy' : 'cal__day--free'}" title="${busy ? 'занято' : 'свободно'}">${d.getDate()}</div>`;
}
cal.innerHTML = html;

/* ===== Расчёт стоимости ===== */
const inDate = document.getElementById('inDate');
const outDate = document.getElementById('outDate');
const calc = document.getElementById('calc');
const money = (n) => n.toLocaleString('ru-RU') + ' ₽';

inDate.min = iso(today);
outDate.min = iso(plus(1));
inDate.value = iso(plus(1));
outDate.value = iso(plus(4));

function nightsBetween(a, b) {
  const list = [];
  const d = new Date(a);
  while (d < b) { list.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return list;
}

function priceOf(date) {
  const wd = date.getDay();                       // 5 — пятница, 6 — суббота
  return wd === 5 || wd === 6 ? Math.round(PRICE.base * PRICE.weekend) : PRICE.base;
}

function currentCalc() {
  const a = new Date(inDate.value), b = new Date(outDate.value);
  if (isNaN(a) || isNaN(b) || b <= a) return { error: 'Выберите даты: выезд должен быть позже заезда' };

  const nights = nightsBetween(a, b);
  const busy = nights.filter((d) => BUSY.has(iso(d)));
  if (busy.length) return { error: `На выбранные даты есть занятые дни: ${busy.map((d) => d.getDate()).join(', ')}. Посмотрите календарь ниже` };

  const stay = nights.reduce((sum, d) => sum + priceOf(d), 0);
  const weekendNights = nights.filter((d) => d.getDay() === 5 || d.getDay() === 6).length;
  const discount = nights.length >= PRICE.longStay ? Math.round(stay * PRICE.longDiscount) : 0;
  return { nights: nights.length, weekendNights, stay, discount, total: stay + PRICE.cleaning - discount };
}

function renderCalc() {
  const c = currentCalc();
  if (c.error) {
    calc.innerHTML = `<p class="calc__note" style="margin:0;color:var(--red)">${c.error}</p>`;
    return;
  }
  calc.innerHTML = `
    <div class="calc__row"><span>Проживание, ${c.nights} ${plural(c.nights, 'ночь', 'ночи', 'ночей')}${c.weekendNights ? `, из них ${c.weekendNights} в выходные +15%` : ''}</span><b>${money(c.stay)}</b></div>
    <div class="calc__row"><span>Уборка, разовая</span><b>${money(PRICE.cleaning)}</b></div>
    ${c.discount ? `<div class="calc__row"><span>Скидка за ${PRICE.longStay} ночей и больше, 10%</span><b>−${money(c.discount)}</b></div>` : ''}
    <div class="calc__total"><span>Итого</span><span>${money(c.total)}</span></div>
    <p class="calc__note">Цену, уборку и скидку владелец задаёт в своём кабинете — здесь показан пример расчёта.</p>`;
}

function plural(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

[inDate, outDate, document.getElementById('guests')].forEach((el) => el.addEventListener('change', renderCalc));
renderCalc();

/* ===== Заявка ===== */
const consent = document.getElementById('consent');
const send = document.getElementById('send');
consent.addEventListener('change', () => { send.disabled = !consent.checked; });

document.getElementById('bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = document.getElementById('err');
  const ok = document.getElementById('ok');
  const name = document.getElementById('name').value.trim();
  const digits = document.getElementById('phone').value.replace(/\D/g, '');
  const c = currentCalc();

  let problem = '';
  if (c.error) problem = c.error;
  else if (!consent.checked) problem = 'Отметьте согласие на обработку данных';
  else if (name.length < 2) problem = 'Напишите, как к вам обращаться';
  else if (digits.length < 10 || digits.length > 11) problem = 'Проверьте номер — нужно 10–11 цифр';

  if (problem) { err.textContent = problem; err.hidden = false; ok.hidden = true; return; }

  err.hidden = true;
  ok.innerHTML = `<b>${escapeHTML(name)}, заявка принята.</b><br>${c.nights} ${plural(c.nights, 'ночь', 'ночи', 'ночей')}, итого ${money(c.total)}. На рабочем сайте такая бронь падает владельцу в кабинет со статусом «Новая», а гостю уходит письмо. Это демо — данные никуда не отправлены.`;
  ok.hidden = false;
  send.disabled = true;
});

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ===== Карта по кнопке ===== */
const mapBtn = document.getElementById('mapBtn');
if (mapBtn) {
  mapBtn.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = mapBtn.dataset.src;
    frame.loading = 'lazy';
    frame.title = 'Карта района';
    document.getElementById('map').innerHTML = '';
    document.getElementById('map').appendChild(frame);
  });
}
