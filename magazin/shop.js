/* Лучина — демо интернет-магазина.
   Товары лежат в tovary.csv (одна строка = один вариант товара),
   корзина хранится в браузере покупателя, заказ в демо никуда не отправляется. */

const FREE_FROM = 3000;          // бесплатная курьерская доставка от этой суммы
const COURIER = 350;             // курьер по Казани
const BOX_SKU = 'LU-401';        // подарочная коробка — предлагаем в корзине
const CART_KEY = 'luchina-cart';

const ICONS = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};

/* ===== Мелочи ===== */
const $ = (s, root = document) => root.querySelector(s);
const money = (n) => n.toLocaleString('ru-RU') + ' ₽';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
};

/* ===== Таблица товаров ===== */
function decode(buffer) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch (e) { return new TextDecoder('windows-1251').decode(buffer); }
}

function splitCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const delim = first.split(';').length >= first.split(',').length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Строки с одинаковым «Товаром» собираются в один товар с вариантами.
// Общие поля (фото, описание, состав) достаточно заполнить в первой строке товара.
function buildCatalog(text) {
  const rows = splitCSV(text);
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const get = (cells, name) => { const i = head.indexOf(name); return i === -1 ? '' : (cells[i] || '').trim(); };
  const products = [];
  const byName = new Map();
  const bySku = new Map();

  rows.slice(1).forEach((cells) => {
    const name = get(cells, 'товар');
    const sku = get(cells, 'артикул');
    const price = Number(get(cells, 'цена').replace(/[\s ₽]/g, '').replace(',', '.'));
    if (!name || !sku || !(price > 0)) return;

    let p = byName.get(name);
    if (!p) {
      p = { id: sku, name, section: get(cells, 'раздел') || 'Разное', variants: [] };
      byName.set(name, p);
      products.push(p);
    }
    const fill = (key, col) => { const v = get(cells, col); if (v && !p[key]) p[key] = v; };
    fill('photo', 'фото'); fill('short', 'кратко'); fill('desc', 'описание'); fill('compose', 'состав');
    if (get(cells, 'хит').toLowerCase() === 'да') p.hit = true;

    const v = {
      sku, price, product: p,
      label: get(cells, 'вариант') || 'стандарт',
      inStock: get(cells, 'наличие').toLowerCase() !== 'нет',
      burn: get(cells, 'горение')
    };
    p.variants.push(v);
    bySku.set(sku, v);
  });

  products.forEach((p) => {
    const prices = p.variants.map((v) => v.price);
    p.min = Math.min(...prices);
    p.max = Math.max(...prices);
    p.firstAvailable = p.variants.find((v) => v.inStock) || null;
  });
  return { products, bySku };
}

let CATALOG = null;
function loadCatalog() {
  return fetch('tovary.csv')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((buf) => { CATALOG = buildCatalog(decode(buf)); return CATALOG; });
}
const photo = (p) => 'img/' + (p.photo || 'korobka.jpg');
const thumb = (p) => 'img/sm/' + (p.photo || 'korobka.jpg');   // 480×600 для сетки и корзины

/* ===== Корзина: [{ sku, qty }] в localStorage ===== */
let memoryCart = [];
function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    memoryCart = Array.isArray(raw) ? raw : [];
  } catch (e) { /* приватный режим или запрет — живём в памяти */ }
  // выбрасываем то, чего больше нет в таблице
  if (CATALOG) memoryCart = memoryCart.filter((l) => CATALOG.bySku.has(l.sku) && l.qty > 0);
  return memoryCart;
}
function writeCart(cart) {
  memoryCart = cart;
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ничего */ }
  renderBadge();
  renderDrawer();
  document.dispatchEvent(new CustomEvent('cart:change'));
}
function addToCart(sku, qty = 1) {
  const cart = readCart();
  const line = cart.find((l) => l.sku === sku);
  if (line) line.qty = Math.min(99, line.qty + qty); else cart.push({ sku, qty });
  writeCart(cart);
  const btn = $('.cart-btn');
  if (btn) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
}
function setQty(sku, qty) {
  const cart = readCart().map((l) => (l.sku === sku ? { sku, qty } : l)).filter((l) => l.qty > 0);
  writeCart(cart);
}
function cartLines() {
  return readCart().map((l) => ({ ...l, v: CATALOG.bySku.get(l.sku) })).filter((l) => l.v);
}
const cartCount = () => cartLines().reduce((s, l) => s + l.qty, 0);
const cartSum = () => cartLines().reduce((s, l) => s + l.qty * l.v.price, 0);

/* ===== Шапка: число в кнопке корзины ===== */
function renderBadge() {
  const n = CATALOG ? cartCount() : 0;
  document.querySelectorAll('.cart-btn__n').forEach((el) => {
    el.textContent = n;
    el.toggleAttribute('data-zero', n === 0);
  });
  document.querySelectorAll('.cart-btn').forEach((b) =>
    b.setAttribute('aria-label', n ? `Корзина: ${n} ${plural(n, 'товар', 'товара', 'товаров')}` : 'Корзина пуста'));
}

/* ===== Панель корзины ===== */
let lastFocus = null;
function mountDrawer() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay" id="overlay" hidden></div>
    <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" hidden>
      <div class="drawer__head"><h2 id="drawerTitle">Корзина</h2><button class="x" type="button" id="drawerClose" aria-label="Закрыть корзину">×</button></div>
      <div class="drawer__body" id="drawerBody"></div>
      <div class="drawer__foot" id="drawerFoot"></div>
    </aside>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);
  $('#overlay').addEventListener('click', closeDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });
  document.querySelectorAll('.cart-btn, [data-open-cart]').forEach((b) => b.addEventListener('click', openDrawer));

  // клики внутри корзины — одним обработчиком
  $('#drawer').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const sku = b.dataset.sku;
    const line = readCart().find((l) => l.sku === sku);
    if (b.dataset.act === 'inc' && line) setQty(sku, Math.min(99, line.qty + 1));
    if (b.dataset.act === 'dec' && line) setQty(sku, line.qty - 1);
    if (b.dataset.act === 'del') setQty(sku, 0);
    if (b.dataset.act === 'box') addToCart(BOX_SKU, 1);
    // корзина перерисовалась — возвращаем фокус на ту же кнопку, чтобы не терять место с клавиатуры
    const same = $(`#drawer button[data-act="${b.dataset.act}"][data-sku="${sku}"]`);
    (same && !same.disabled ? same : $('#drawerClose')).focus();
  });
}
function openDrawer() {
  lastFocus = document.activeElement;
  renderDrawer();
  const d = $('#drawer'), o = $('#overlay');
  d.hidden = false; o.hidden = false;
  requestAnimationFrame(() => { d.classList.add('show'); o.classList.add('show'); });
  document.body.classList.add('no-scroll');
  $('#drawerClose').focus();
}
function closeDrawer() {
  const d = $('#drawer'), o = $('#overlay');
  d.classList.remove('show'); o.classList.remove('show');
  document.body.classList.remove('no-scroll');
  setTimeout(() => { d.hidden = true; o.hidden = true; }, 250);
  if (lastFocus) lastFocus.focus();
}

function lineHTML(l, controls = true) {
  const p = l.v.product;
  const variant = p.variants.length > 1 ? `<div class="line__var">${esc(l.v.label)}</div>` : '';
  const ctrl = controls ? `
      <div class="line__ctrl">
        <div class="qty"><button type="button" data-act="dec" data-sku="${l.sku}" aria-label="Меньше">−</button><output aria-label="Количество">${l.qty}</output><button type="button" data-act="inc" data-sku="${l.sku}" aria-label="Больше" ${l.qty >= 99 ? 'disabled' : ''}>+</button></div>
        <button class="line__del" type="button" data-act="del" data-sku="${l.sku}">Удалить</button>
      </div>` : `<div class="line__var">${l.qty} × ${money(l.v.price)}</div>`;
  return `<div class="line">
      <img src="${thumb(p)}" alt="" width="72" height="90" loading="lazy">
      <div><div class="line__name">${esc(p.name)}</div>${variant}${ctrl}</div>
      <div class="line__sum">${money(l.qty * l.v.price)}</div>
    </div>`;
}

function freeHTML(sum) {
  if (sum >= FREE_FROM) return '<div class="free free--ok">Курьер по Казани — бесплатно</div>';
  const left = FREE_FROM - sum;
  return `<div class="free">До бесплатной доставки по Казани — ${money(left)}
    <div class="free__bar" role="progressbar" aria-valuemin="0" aria-valuemax="${FREE_FROM}" aria-valuenow="${sum}" aria-label="Сумма до бесплатной доставки"><i style="width:${Math.round((sum / FREE_FROM) * 100)}%"></i></div></div>`;
}

function renderDrawer() {
  const body = $('#drawerBody'), foot = $('#drawerFoot');
  if (!body || !CATALOG) return;
  const lines = cartLines();
  if (!lines.length) {
    body.innerHTML = '<div class="empty"><b>Пока пусто</b>Загляните в каталог: свечи, мыло и готовые наборы.</div>';
    foot.innerHTML = '<a class="btn btn--wide" href="index.html#katalog">Перейти в каталог</a>';
    return;
  }
  const sum = cartSum();
  const box = CATALOG.bySku.get(BOX_SKU);
  const hasBox = lines.some((l) => l.sku === BOX_SKU);
  const upsell = box && !hasBox ? `
    <div class="upsell">
      <img src="${thumb(box.product)}" alt="" width="52" height="64">
      <div><b>Упаковать в подарок?</b>Коробка с лентой и сургучом — ${money(box.price)}</div>
      <button type="button" data-act="box">Добавить</button>
    </div>` : '';
  body.innerHTML = lines.map((l) => lineHTML(l)).join('') + upsell;
  const n = cartCount();
  foot.innerHTML = `${freeHTML(sum)}
    <div class="total"><span>Итого</span><span>${money(sum)}</span></div>
    <div class="total-note">${n} ${plural(n, 'товар', 'товара', 'товаров')}, доставка считается при оформлении</div>
    <a class="btn btn--wide" href="oformlenie.html">Оформить заказ</a>`;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===== Карточка в сетке ===== */
function cardHTML(p) {
  const price = p.min === p.max ? money(p.min) : 'от ' + money(p.min);
  const add = p.firstAvailable
    ? `<button class="card__add" type="button" data-add="${p.firstAvailable.sku}" aria-label="В корзину: ${esc(p.name)}${p.variants.length > 1 ? ', ' + esc(p.firstAvailable.label) : ''}">${ICONS.plus}</button>`
    : '';
  return `<article class="card">
    <div class="card__photo">
      <img src="${thumb(p)}" srcset="${thumb(p)} 480w, ${photo(p)} 800w" sizes="(min-width: 900px) 270px, (min-width: 640px) 30vw, 46vw" alt="${esc(p.name)}" width="480" height="600" loading="lazy">
      ${p.hit ? '<span class="card__hit">Часто берут</span>' : ''}
    </div>
    <div class="card__body">
      <a class="card__name" href="tovar.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
      <div class="card__short">${esc(p.short || '')}</div>
      <div class="card__foot"><span class="card__price">${price}</span>${add}</div>
    </div>
  </article>`;
}
function bindAddButtons(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const v = CATALOG.bySku.get(b.dataset.add);
    addToCart(v.sku, 1);
    toast(`В корзине: ${v.product.name}${v.product.variants.length > 1 ? ', ' + v.label : ''}`);
  });
}

/* ===== Главная: витрина ===== */
function initHome() {
  const grid = $('#grid');
  const state = { section: 'Все', sort: 'popular' };
  const order = new Map(CATALOG.products.map((p, i) => [p, i]));

  function render() {
    let list = CATALOG.products.filter((p) => state.section === 'Все' || p.section === state.section);
    if (state.sort === 'cheap') list = [...list].sort((a, b) => a.min - b.min);
    else if (state.sort === 'dear') list = [...list].sort((a, b) => b.min - a.min);
    else list = [...list].sort((a, b) => (b.hit ? 1 : 0) - (a.hit ? 1 : 0) || order.get(a) - order.get(b));
    grid.innerHTML = list.map(cardHTML).join('');
    $('#found').textContent = `${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')}`;
  }

  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    state.section = t.dataset.section;
    document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    render();
  }));
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  bindAddButtons(grid);
  render();
}

/* ===== Страница товара ===== */
function initProduct() {
  const params = new URLSearchParams(location.search);
  const start = CATALOG.bySku.get(params.get('id')) || CATALOG.products[0].variants[0];
  const p = start.product;
  let current = start.inStock ? start : (p.firstAvailable || start);
  let qty = 1;
  const root = $('#product');

  document.title = `${p.name} — Лучина`;
  $('#crumbName').textContent = p.name;

  const isSoap = p.section === 'Мыло' || /мыл/i.test(p.name + ' ' + (p.compose || ''));
  const cert = isSoap ? `
      <div class="notice"><b>Декларация о соответствии</b> ЕАЭС N RU Д-RU.РА00.В.00000/26 — номер условный, в демо.
        На рабочем сайте здесь стоит настоящий номер и ссылка на проверку в <a href="https://pub.fsa.gov.ru/rds/declaration" target="_blank" rel="noopener">реестре Росаккредитации</a>.</div>` : '';

  root.innerHTML = `
    <div class="product__photo"><img src="${photo(p)}" alt="${esc(p.name)}" width="800" height="1000"></div>
    <div>
      <div class="product__cat">${esc(p.section)}</div>
      <h1>${esc(p.name)}</h1>
      <p class="product__short">${esc(p.short || '')}</p>
      <div class="product__price" id="price"></div>
      <div class="product__stock" id="stock"></div>
      ${p.variants.length > 1 ? `<div class="opt-title" id="optTitle">Вариант</div>
        <div class="opts" role="radiogroup" aria-labelledby="optTitle">${p.variants.map((v) =>
          `<button type="button" class="opt ${v.inStock ? '' : 'opt--out'}" role="radio" data-sku="${v.sku}" aria-checked="false">${esc(v.label)}${v.inStock ? '' : '<span class="sr"> — нет в наличии</span>'}</button>`).join('')}</div>` : ''}
      <div class="buy">
        <div class="qty"><button type="button" id="minus" aria-label="Меньше">−</button><output id="qty" aria-live="polite">1</output><button type="button" id="plusQty" aria-label="Больше">+</button></div>
        <button class="btn" type="button" id="toCart">В корзину</button>
      </div>
      <div class="added" id="added" role="status"></div>
      <p style="margin-top:14px">${esc(p.desc || '')}</p>
      <dl class="specs">
        ${p.compose ? `<div><dt>Состав</dt><dd>${esc(p.compose)}</dd></div>` : ''}
        <div id="burnRow" ${current.burn ? '' : 'hidden'}><dt>Время горения</dt><dd id="burn"></dd></div>
        <div><dt>Артикул</dt><dd id="sku"></dd></div>
        <div><dt>Изготовитель</dt><dd>ИП Соколова А. С., Казань (данные условные)</dd></div>
      </dl>
      ${cert}
      <div class="notice">Курьер по Казани — ${money(COURIER)}, бесплатно от ${money(FREE_FROM)}. Отправляем по России через пункты выдачи.
        Вернуть товар можно в течение 7 дней после получения, в том числе почтой. <a href="dostavka.html">Условия доставки и возврата</a></div>
    </div>`;

  function sync() {
    $('#price').textContent = money(current.price) + (p.variants.length > 1 ? ' за ' + current.label : '');
    const stock = $('#stock');
    stock.textContent = current.inStock ? 'В наличии, отправим за 1–2 дня' : 'Этого варианта сейчас нет — выберите другой';
    stock.className = 'product__stock' + (current.inStock ? '' : ' product__stock--no');
    $('#sku').textContent = current.sku;
    $('#burnRow').hidden = !current.burn;
    $('#burn').textContent = current.burn;
    $('#qty').textContent = qty;
    $('#minus').disabled = qty <= 1;
    $('#plusQty').disabled = qty >= 99;
    const btn = $('#toCart');
    btn.disabled = !current.inStock;
    btn.textContent = current.inStock ? `В корзину — ${money(current.price * qty)}` : 'Нет в наличии';
    document.querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.sku === current.sku)));
    history.replaceState(null, '', '?id=' + encodeURIComponent(current.sku));
  }

  root.addEventListener('click', (e) => {
    const o = e.target.closest('.opt');
    if (o) { current = CATALOG.bySku.get(o.dataset.sku); $('#added').textContent = ''; sync(); }
  });
  root.addEventListener('keydown', (e) => {   // стрелки внутри группы вариантов
    const o = e.target.closest('.opt');
    if (!o || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const all = [...document.querySelectorAll('.opt')];
    const i = all.indexOf(o) + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1);
    const next = all[(i + all.length) % all.length];
    next.focus(); next.click();
  });
  $('#minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); sync(); });
  $('#plusQty').addEventListener('click', () => { qty = Math.min(99, qty + 1); sync(); });
  $('#toCart').addEventListener('click', () => {
    addToCart(current.sku, qty);
    $('#added').innerHTML = `Добавлено в корзину: ${qty} шт. <button type="button" class="line__del" id="openCart">Открыть корзину</button>`;
    $('#openCart').addEventListener('click', openDrawer);
    qty = 1; sync();
  });
  sync();

  // «С этим берут» — по одному товару из других разделов
  const pool = CATALOG.products.filter((x) => x !== p && x.firstAvailable && x.id !== BOX_SKU);
  const pick = [];
  // сначала по товару из других разделов, потом добиваем популярными
  ['Свечи', 'Мыло', 'Наборы'].filter((s) => s !== p.section).forEach((s) => {
    const f = pool.find((x) => x.section === s && x.hit) || pool.find((x) => x.section === s);
    if (f) pick.push(f);
  });
  pool.filter((x) => x.hit).concat(pool).forEach((x) => { if (pick.length < 4 && !pick.includes(x)) pick.push(x); });
  const more = $('#more');
  more.innerHTML = pick.slice(0, 4).map(cardHTML).join('');
  bindAddButtons(more);
}

/* ===== Оформление заказа ===== */
function initCheckout() {
  const form = $('#order');
  const summary = $('#summary');
  const empty = $('#emptyCart');

  let ordered = false;   // после оформления корзина очищается — форму и «Корзина пуста» больше не показываем
  const ship = () => form.elements.ship.value;
  const shipCost = (sum) => ship() === 'courier' ? (sum >= FREE_FROM ? 0 : COURIER) : 0;

  function renderSummary() {
    if (ordered) return;
    const lines = cartLines();
    const hasItems = lines.length > 0;
    empty.hidden = hasItems;
    $('#checkoutWrap').hidden = !hasItems;
    if (!hasItems) return;
    const sum = cartSum();
    const cost = shipCost(sum);
    const shipText = ship() === 'pickup' ? 'бесплатно' : ship() === 'courier' ? (cost ? money(cost) : 'бесплатно') : 'по тарифу, от 290 ₽';
    summary.innerHTML = lines.map((l) => lineHTML(l, false)).join('') + `
      <div class="sum-row" style="margin-top:10px"><span>Товары</span><span>${money(sum)}</span></div>
      <div class="sum-row"><span>Доставка</span><span>${shipText}</span></div>
      <div class="sum-row sum-row--total"><span>К оплате</span><span>${money(sum + cost)}${ship() === 'pvz' ? ' + доставка' : ''}</span></div>
      ${ship() === 'courier' && sum < FREE_FROM ? `<p class="total-note" style="margin:8px 0 0">Добавьте товаров на ${money(FREE_FROM - sum)} — и курьер будет бесплатным.</p>` : ''}`;
    $('#courierPrice').textContent = sum >= FREE_FROM ? 'бесплатно' : money(COURIER);
  }

  function syncShip() {
    const s = ship();
    $('#addrCourier').hidden = s !== 'courier';
    $('#addrPvz').hidden = s !== 'pvz';
    const cash = form.querySelector('input[name="pay"][value="cash"]');
    cash.disabled = s === 'pvz';
    $('#cashNote').textContent = s === 'pvz' ? 'Для пунктов выдачи — только предоплата по ссылке' : 'Наличными или картой курьеру либо в мастерской';
    if (s === 'pvz' && cash.checked) form.querySelector('input[name="pay"][value="link"]').checked = true;
    renderSummary();
  }

  // кнопка работает только с двумя галочками
  const agree = [$('#consent'), $('#terms')];
  const send = $('#send');
  const syncAgree = () => { send.disabled = !agree.every((c) => c.checked); };
  agree.forEach((c) => c.addEventListener('change', syncAgree));
  form.addEventListener('change', (e) => { if (e.target.name === 'ship') syncShip(); });
  document.addEventListener('cart:change', renderSummary);

  function fieldError(input, msg) {
    input.setAttribute('aria-invalid', 'true');
    const box = input.closest('.field');
    let err = box.querySelector('.field__err');
    if (!err) { err = document.createElement('span'); err.className = 'field__err'; err.id = input.id + 'Err'; box.appendChild(err); }
    err.textContent = msg;
    input.setAttribute('aria-describedby', err.id);
  }
  function clearErrors() {
    form.querySelectorAll('[aria-invalid="true"]').forEach((i) => { i.setAttribute('aria-invalid', 'false'); i.removeAttribute('aria-describedby'); });
    form.querySelectorAll('.field__err').forEach((e) => e.remove());
    $('#formErr').hidden = true;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();
    const f = form.elements;
    const name = f.name.value.trim();
    const digits = f.phone.value.replace(/\D/g, '');
    const email = f.email.value.trim();
    const bad = [];
    if (name.length < 2) bad.push([f.name, 'Напишите, как к вам обращаться']);
    if (digits.length < 10 || digits.length > 11) bad.push([f.phone, 'Нужен номер из 10–11 цифр, например +7 900 123-45-67']);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push([f.email, 'Проверьте адрес почты']);
    if (ship() === 'courier' && f.address.value.trim().length < 8) bad.push([f.address, 'Укажите улицу, дом и квартиру']);
    if (ship() === 'pvz' && f.pvz.value.trim().length < 8) bad.push([f.pvz, 'Укажите город и адрес пункта выдачи']);
    if (bad.length) {
      bad.forEach(([input, msg]) => fieldError(input, msg));
      $('#formErr').textContent = bad.length === 1 ? 'Поправьте одно поле — оно отмечено.' : `Поправьте ${bad.length} ${plural(bad.length, 'поле', 'поля', 'полей')} — они отмечены.`;
      $('#formErr').hidden = false;
      bad[0][0].focus();
      return;
    }
    finish({ name, phone: f.phone.value.trim(), email, comment: f.comment.value.trim(),
      address: ship() === 'courier' ? f.address.value.trim() : ship() === 'pvz' ? f.pvz.value.trim() : '' });
  });

  function finish(data) {
    const lines = cartLines();
    const sum = cartSum();
    const cost = shipCost(sum);
    const d = new Date();
    const num = `ЛУ-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const shipName = { pickup: 'самовывоз из мастерской', courier: 'курьер по Казани', pvz: 'пункт выдачи' }[ship()];
    const payName = form.elements.pay.value === 'cash' ? 'при получении' : 'по ссылке после подтверждения';
    const msg = [
      `Новый заказ ${num}`,
      `${data.name}, ${data.phone}${data.email ? ', ' + data.email : ''}`,
      `Получение: ${shipName}`,
      data.address ? `Адрес: ${data.address}` : null,
      `Оплата: ${payName}`,
      '',
      ...lines.map((l) => `${l.v.product.name}${l.v.product.variants.length > 1 ? ', ' + l.v.label : ''} × ${l.qty} — ${money(l.qty * l.v.price)}`),
      '',
      `Доставка: ${ship() === 'pvz' ? 'по тарифу, сообщить покупателю' : cost ? money(cost) : '0 ₽'}`,
      `Итого: ${money(sum + cost)}`,
      data.comment ? `Комментарий: ${data.comment}` : null
    ].filter((x) => x !== null).join('\n');

    ordered = true;
    $('#checkoutWrap').hidden = true;
    $('#emptyCart').hidden = true;
    const done = $('#done');
    done.hidden = false;
    done.innerHTML = `
      <span class="done__num">Заказ ${num}</span>
      <h1>Спасибо, ${esc(data.name)}! Заказ принят</h1>
      <p class="section__lead">В рабочее время (10:00–20:00) напишем или позвоним в течение часа: подтвердим наличие${ship() === 'pvz' ? ', посчитаем доставку' : ''} и ${form.elements.pay.value === 'cash' ? 'договоримся о времени' : 'пришлём ссылку на оплату'}.</p>
      <div class="tg">
        <div class="tg__label">Так этот заказ пришёл бы мастерской в Telegram. Это демо — на самом деле ничего не отправлено.</div>
        <div class="tg__msg">${esc(msg)}</div>
      </div>
      <p style="margin-top:22px"><a class="btn btn--ghost" href="index.html">Вернуться в магазин</a></p>`;
    writeCart([]);
    window.scrollTo(0, 0);
    done.querySelector('h1').setAttribute('tabindex', '-1');
    done.querySelector('h1').focus();
  }

  syncShip();
  syncAgree();
}

/* ===== Запуск ===== */
document.addEventListener('DOMContentLoaded', () => {
  mountDrawer();
  const page = document.body.dataset.page;
  loadCatalog()
    .then(() => {
      readCart();
      renderBadge();
      renderDrawer();
      if (page === 'home') initHome();
      if (page === 'product') initProduct();
      if (page === 'checkout') initCheckout();
    })
    .catch(() => {
      const g = $('#grid') || $('#product') || $('#summary');
      if (g) g.innerHTML = '<p>Не удалось загрузить таблицу товаров. Откройте страницу через сайт, а не как файл с диска.</p>';
    });
});
