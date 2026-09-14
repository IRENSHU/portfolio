'use strict';

/* ---------- Справочники ---------- */
const STORE_KEY = 'buzzExtranetDemo_v1';
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const AMENITIES = ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Фен', 'Сейф', 'Мини-бар', 'Халаты и тапочки',
  'Ванна', 'Душевая кабина', 'Рабочий стол', 'Кофемашина', 'Диван', 'Вид на город'];
const PHOTOS = [
  'linear-gradient(135deg, #C9A465 0%, #8A6A2E 100%)',
  'linear-gradient(135deg, #4F6D8F 0%, #13233D 100%)',
  'linear-gradient(135deg, #8FA58A 0%, #3F5C45 100%)',
  'linear-gradient(135deg, #C98B6B 0%, #7A4631 100%)',
  'linear-gradient(135deg, #9C8DB8 0%, #4B3F6B 100%)',
];
const STATUS = {
  new: { text: 'Новая', cls: 'st-new' },
  confirmed: { text: 'Подтверждена', cls: 'st-confirmed' },
  cancelled: { text: 'Отменена', cls: 'st-cancelled' },
};

/* ---------- Даты и форматы ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const fmtDate = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const fmtDay = s => DAYS[parse(s).getDay()];
const isWeekendNight = s => [5, 6].includes(parse(s).getDay()); // ночи с пятницы и субботы
const rub = n => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
const round100 = n => Math.round(n / 100) * 100;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Math.random().toString(36).slice(2, 8);
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/* ---------- Данные демо ---------- */
function seed() {
  const t = today();
  const data = {
    hotel: {
      name: 'Демо-отель «Уют»',
      address: 'г. Рязань, ул. Примерная, д. 1',
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Бесплатная отмена за 3 дня до заезда',
    },
    rooms: [
      { id: 'r1', name: 'Стандарт', area: 22, beds: 'Двуспальная или две односпальные кровати', guests: 2, count: 40, price: 3800, photo: 0,
        amenities: ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Фен', 'Рабочий стол'] },
      { id: 'r2', name: 'Полулюкс', area: 32, beds: 'Двуспальная кровать', guests: 2, count: 15, price: 5500, photo: 1,
        amenities: ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Фен', 'Мини-бар', 'Халаты и тапочки', 'Диван'] },
      { id: 'r3', name: 'Люкс', area: 48, beds: 'Двуспальная кровать и диван в гостиной', guests: 3, count: 6, price: 8000, photo: 3,
        amenities: ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Фен', 'Мини-бар', 'Халаты и тапочки', 'Ванна', 'Кофемашина', 'Вид на город'] },
      { id: 'r4', name: 'Семейный', area: 40, beds: 'Двуспальная и две односпальные кровати', guests: 4, count: 8, price: 6900, photo: 2,
        amenities: ['Wi-Fi', 'Кондиционер', 'Телевизор', 'Фен', 'Сейф', 'Душевая кабина'] },
    ],
    rates: {},
    bookings: [],
    notify: { email: true, emailAddr: 'bron@demo-hotel.ru', telegram: true, tg: '@demo_hotel_bron' },
    nextNo: 1041,
  };
  S = data;
  // выходные дороже на 15 %
  for (let i = 0; i < 120; i++) {
    const d = addDays(t, i);
    if (isWeekendNight(d)) data.rooms.forEach(r => { data.rates[`${r.id}|${d}`] = { price: round100(r.price * 1.15) }; });
  }
  // закрытая продажа люкса на ремонт
  [9, 10, 11].forEach(i => { const k = `r3|${addDays(t, i)}`; data.rates[k] = { ...(data.rates[k] || {}), closed: true }; });
  const add = (roomId, from, nights, qty, guests, name, status, comment = '') => {
    const checkIn = addDays(t, from), checkOut = addDays(t, from + nights);
    data.bookings.push({
      id: uid('b'), no: data.nextNo++, roomId, checkIn, checkOut, qty, guests, name, status, comment,
      phone: '+7 900 000-00-00', email: 'guest@example.com',
      total: stayQuote(roomId, checkIn, checkOut).total * qty, createdAt: new Date(Date.now() - (6 - data.bookings.length) * 3600e3).toISOString(),
    });
  };
  add('r1', 2, 2, 34, 2, 'ООО «Пример» — конференция', 'confirmed', 'Групповое размещение участников');
  add('r2', 1, 3, 1, 2, 'Мария Иванова', 'confirmed');
  add('r3', 4, 2, 1, 2, 'Алексей Петров', 'cancelled');
  add('r4', 5, 2, 1, 4, 'Ольга Сидорова', 'new', 'Нужна детская кроватка');
  add('r1', 0, 1, 1, 1, 'Дмитрий Кузнецов', 'new', 'Поздний заезд около 23:00');
  return data;
}

let S = null;
function load() {
  try { const v = localStorage.getItem(STORE_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* демо работает и без сохранения */ }
}

/* ---------- Расчёты ---------- */
const room = id => S.rooms.find(r => r.id === id);
const rateOf = (roomId, date) => S.rates[`${roomId}|${date}`] || {};
const priceFor = (roomId, date) => rateOf(roomId, date).price ?? room(roomId).price;
const isClosed = (roomId, date) => !!rateOf(roomId, date).closed;
function booked(roomId, date) {
  return S.bookings
    .filter(b => b.roomId === roomId && b.status !== 'cancelled' && b.checkIn <= date && date < b.checkOut)
    .reduce((sum, b) => sum + (b.qty || 1), 0);
}
const freeRooms = (roomId, date) => Math.max(0, room(roomId).count - booked(roomId, date));
function stayQuote(roomId, checkIn, checkOut) {
  const n = nightsBetween(checkIn, checkOut);
  let total = 0, minFree = Infinity, closed = false;
  for (let i = 0; i < n; i++) {
    const d = addDays(checkIn, i);
    total += priceFor(roomId, d);
    minFree = Math.min(minFree, freeRooms(roomId, d));
    if (isClosed(roomId, d)) closed = true;
  }
  return { nights: n, total, minFree: n ? minFree : 0, closed };
}

/* ---------- Окна и всплывающие сообщения ---------- */
const modalRoot = document.getElementById('modalRoot');
function openModal(html) {
  modalRoot.innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const bg = modalRoot.firstElementChild;
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) closeModal(); });
  const first = bg.querySelector('input, select, textarea');
  if (first) setTimeout(() => first.focus(), 50);
  return bg.querySelector('.modal');
}
function closeModal() { modalRoot.innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function toast(html, action) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html + (action ? `<div><button type="button" class="btn btn-gold btn-sm">${esc(action.text)}</button></div>` : '');
  if (action) el.querySelector('button').addEventListener('click', () => { action.run(); el.remove(); });
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), action ? 9000 : 4500);
}

/* ---------- Переключение режимов ---------- */
let view = 'extranet';
let tab = 'rooms';
function setView(v) {
  view = v;
  document.getElementById('extranet').hidden = v !== 'extranet';
  document.getElementById('guest').hidden = v !== 'guest';
  document.querySelectorAll('.switch button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}
function setTab(t) {
  tab = t;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; });
  renderExtranet();
}
function renderAll() {
  document.getElementById('hotelTitle').textContent = S.hotel.name;
  document.getElementById('hotelAddress').textContent = S.hotel.address;
  const n = S.bookings.filter(b => b.status === 'new').length;
  const badge = document.getElementById('newCount');
  badge.hidden = n === 0;
  badge.textContent = n;
  if (view === 'extranet') renderExtranet(); else renderGuest();
}

function init() {
  S = load() || seed();
  save();
  document.querySelectorAll('.switch button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  document.querySelector('[data-go-guest]').addEventListener('click', () => setView('guest'));
  document.getElementById('resetBtn').addEventListener('click', () => {
    seed(); save(); setTab('rooms'); setView(view);
    toast('Демо сброшено: вернулись примерные данные');
  });
  setTab('rooms');
  renderAll();
}
