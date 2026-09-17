/* ===== Каталог собирается из таблицы tovary.csv =====
   Магазин ведёт таблицу в Excel и сохраняет её в формате CSV.
   Excel сохраняет CSV по-разному: «CSV UTF-8» — в кодировке UTF-8,
   старый «CSV (разделители — запятые)» — в кодировке Windows-1251.
   В русской версии разделитель столбцов — точка с запятой, но встречается и запятая.
   Скрипт читает все эти варианты. */

const state = {
  items: [],
  section: 'Все разделы',
  materials: new Set(),
  colors: new Set(),
  priceMin: null,
  priceMax: null,
  query: '',
  sort: 'default'
};

/* ===== Кодировка: сначала UTF-8, если файл не в ней — Windows-1251 ===== */
function decode(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch (e) {
    return new TextDecoder('windows-1251').decode(buffer);
  }
}

/* ===== Разбор CSV: кавычки, переносы строк внутри ячейки, ; или , ===== */
function splitCSV(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = firstLine.split(';').length >= firstLine.split(',').length ? ';' : ',';

  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delim) {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const REQUIRED = ['Раздел', 'Название', 'Артикул', 'Цена'];

function parseTable(text) {
  const rows = splitCSV(text);
  if (!rows.length) return { items: [], error: 'Таблица пустая' };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => headers.indexOf(name.toLowerCase());
  const missing = REQUIRED.filter((name) => col(name) === -1);
  if (missing.length) return { items: [], error: `В таблице нет колонок: ${missing.join(', ')}` };

  let skipped = 0;
  const get = (cells, name) => { const i = col(name); return i === -1 ? '' : (cells[i] || '').trim(); };

  const items = rows.slice(1).map((cells) => {
    // цену пишут по-разному: «28 900», «28900,00», «28 900 ₽»
    const price = Number(get(cells, 'Цена').replace(/[\s ₽]/g, '').replace(',', '.'));
    const item = {
      section:  get(cells, 'Раздел') || 'Без раздела',
      name:     get(cells, 'Название'),
      sku:      get(cells, 'Артикул'),
      price,
      material: get(cells, 'Материал'),
      color:    get(cells, 'Цвет'),
      hex:      get(cells, 'ЦветHEX'),
      size:     get(cells, 'Размеры'),
      desc:     get(cells, 'Описание'),
      photo:    get(cells, 'Фото'),
      hit:      get(cells, 'Хит').toLowerCase() === 'да'
    };
    if (!item.name || !item.sku || !Number.isFinite(price) || price <= 0) { skipped++; return null; }
    return item;
  }).filter(Boolean);

  return { items, skipped };
}

/* ===== Картинка товара: фото из колонки «Фото» или рисунок кодом ===== */
function shade(hex, amount) {
  const n = parseInt((/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#b0b6bc').slice(1), 16);
  const ch = (c) => Math.max(0, Math.min(255, Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function drawItem(item) {
  if (item.photo) {
    return `<img src="img/${encodeURI(item.photo)}" alt="${escapeHTML(item.name)}" loading="lazy">`;
  }
  const base = /^#[0-9a-f]{6}$/i.test(item.hex) ? item.hex : '#b0b6bc';
  const dark = shade(base, -0.22);
  const light = shade(base, 0.16);

  if (item.section === 'Фурнитура') {
    return `<svg viewBox="0 0 120 160" aria-hidden="true">
      <rect x="34" y="52" width="52" height="56" rx="10" fill="${base}"/>
      <rect x="42" y="60" width="36" height="40" rx="7" fill="${light}"/>
      <circle cx="60" cy="80" r="9" fill="${dark}"/>
      <rect x="52" y="108" width="16" height="26" rx="5" fill="${dark}"/>
    </svg>`;
  }
  if (item.section === 'Раздвижные системы') {
    return `<svg viewBox="0 0 120 160" aria-hidden="true">
      <rect x="6" y="14" width="52" height="136" rx="3" fill="${base}"/>
      <rect x="13" y="24" width="38" height="116" rx="2" fill="${light}"/>
      <rect x="58" y="14" width="52" height="136" rx="3" fill="${dark}"/>
      <rect x="65" y="24" width="38" height="116" rx="2" fill="${base}"/>
      <rect x="4" y="8" width="112" height="7" rx="3" fill="${shade(base, -0.4)}"/>
      <rect x="50" y="74" width="5" height="18" rx="2" fill="${shade(base, -0.5)}"/>
      <rect x="65" y="74" width="5" height="18" rx="2" fill="${shade(base, -0.5)}"/>
    </svg>`;
  }
  const glass = item.name.includes('Стекло');
  return `<svg viewBox="0 0 120 160" aria-hidden="true">
    <rect x="14" y="8" width="92" height="146" rx="4" fill="${dark}"/>
    <rect x="20" y="14" width="80" height="134" rx="3" fill="${base}"/>
    ${glass
      ? `<rect x="32" y="26" width="56" height="60" rx="3" fill="rgba(255,255,255,.55)"/>
         <rect x="32" y="94" width="56" height="44" rx="3" fill="${light}"/>`
      : `<rect x="32" y="26" width="56" height="46" rx="3" fill="${light}"/>
         <rect x="32" y="80" width="56" height="58" rx="3" fill="${light}"/>`}
    <circle cx="92" cy="86" r="3.6" fill="${shade(base, -0.5)}"/>
  </svg>`;
}

const money = (n) => n.toLocaleString('ru-RU');

/* текст из таблицы вставляем как текст, а не как разметку */
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ===== Фильтрация ===== */
function visibleItems() {
  const q = state.query.trim().toLowerCase();

  let list = state.items.filter((item) => {
    if (state.section !== 'Все разделы' && item.section !== state.section) return false;
    if (state.materials.size && !state.materials.has(item.material)) return false;
    if (state.colors.size && !state.colors.has(item.color)) return false;
    if (state.priceMin !== null && item.price < state.priceMin) return false;
    if (state.priceMax !== null && item.price > state.priceMax) return false;
    if (q && !(`${item.name} ${item.sku}`.toLowerCase().includes(q))) return false;
    return true;
  });

  const sorters = {
    cheap:     (a, b) => a.price - b.price,
    expensive: (a, b) => b.price - a.price,
    name:      (a, b) => a.name.localeCompare(b.name, 'ru')
  };
  if (sorters[state.sort]) list = list.slice().sort(sorters[state.sort]);
  return list;
}

/* ===== Отрисовка ===== */
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');

function renderGrid() {
  const list = visibleItems();
  document.getElementById('count').textContent = list.length;
  empty.hidden = list.length > 0;

  grid.innerHTML = list.map((item) => `
    <button type="button" class="card" data-sku="${escapeHTML(item.sku)}">
      <span class="card__shot">
        ${item.hit ? '<span class="card__hit">хит</span>' : ''}
        ${drawItem(item)}
      </span>
      <span class="card__body">
        <span class="card__name">${escapeHTML(item.name)}</span>
        <span class="card__meta">${escapeHTML([item.material, item.color].filter(Boolean).join(' · '))}<br>арт. ${escapeHTML(item.sku)}</span>
        <span class="card__price">${money(item.price)} ₽</span>
      </span>
    </button>`).join('');
}

function renderSections() {
  const counts = new Map();
  state.items.forEach((item) => counts.set(item.section, (counts.get(item.section) || 0) + 1));
  const rows = [['Все разделы', state.items.length], ...counts];
  document.getElementById('sections').innerHTML = rows.map(([name, num]) => `
    <li>
      <button type="button" class="${name === state.section ? 'is-active' : ''}" data-section="${escapeHTML(name)}">
        <span>${escapeHTML(name)}</span><span class="num">${num}</span>
      </button>
    </li>`).join('');
}

function renderChecks(id, field, selected) {
  const list = [...new Set(state.items.map((i) => i[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
  document.getElementById(id).innerHTML = list.map((v) => `
    <li><label><input type="checkbox" value="${escapeHTML(v)}" ${selected.has(v) ? 'checked' : ''}> ${escapeHTML(v)}</label></li>`).join('');
}

function renderAll() {
  renderSections();
  renderChecks('materials', 'material', state.materials);
  renderChecks('colors', 'color', state.colors);
  renderGrid();
}

/* ===== Загрузка таблицы ===== */
const source = document.getElementById('source');
const restore = document.getElementById('restore');

function applyTable(buffer, label) {
  const { items, skipped, error } = parseTable(decode(buffer));
  if (error) {
    source.textContent = `${label}: ${error}. Каталог не изменился.`;
    source.classList.add('is-error');
    return false;
  }
  state.items = items;
  state.section = 'Все разделы';
  state.materials.clear();
  state.colors.clear();
  source.classList.remove('is-error');
  source.textContent = `${label}: ${items.length} ${plural(items.length, 'товар', 'товара', 'товаров')}` +
    (skipped ? ` · пропущено строк без названия, артикула или цены: ${skipped}` : '');
  renderAll();
  return true;
}

function loadDefault() {
  return fetch('tovary.csv')
    .then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
    .then((buf) => applyTable(buf, 'Таблица tovary.csv'))
    .catch(() => { source.textContent = 'Не удалось загрузить файл каталога tovary.csv'; source.classList.add('is-error'); });
}

document.getElementById('upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (/\.xlsx?$/i.test(file.name)) {
    source.textContent = `Файл «${file.name}» — это формат Excel. Сохраните таблицу в CSV («Файл → Сохранить как → CSV UTF-8») и загрузите снова.`;
    source.classList.add('is-error');
    e.target.value = '';
    return;
  }
  file.arrayBuffer().then((buf) => {
    if (applyTable(buf, `Ваш файл «${file.name}»`)) {
      restore.hidden = false;
      document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' });
    }
    e.target.value = '';
  });
});

restore.addEventListener('click', () => { loadDefault().then(() => { restore.hidden = true; }); });

function plural(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

/* ===== События фильтров ===== */
document.getElementById('sections').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-section]');
  if (!btn) return;
  state.section = btn.dataset.section;
  renderSections();
  renderGrid();
});

[['materials', 'materials'], ['colors', 'colors']].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('change', (e) => {
    const box = e.target;
    if (box.checked) state[key].add(box.value); else state[key].delete(box.value);
    renderGrid();
  });
});

document.getElementById('search').addEventListener('input', (e) => { state.query = e.target.value; renderGrid(); });
document.getElementById('sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });

['priceMin', 'priceMax'].forEach((id) => {
  document.getElementById(id).addEventListener('input', (e) => {
    state[id] = e.target.value === '' ? null : Number(e.target.value);
    renderGrid();
  });
});

document.getElementById('reset').addEventListener('click', () => {
  state.section = 'Все разделы';
  state.materials.clear();
  state.colors.clear();
  state.priceMin = state.priceMax = null;
  state.query = '';
  state.sort = 'default';
  ['search', 'priceMin', 'priceMax'].forEach((id) => { document.getElementById(id).value = ''; });
  document.getElementById('sort').value = 'default';
  renderAll();
});

const sidebar = document.getElementById('sidebar');
document.getElementById('filtersToggle').addEventListener('click', (e) => {
  const open = sidebar.classList.toggle('is-open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

/* ===== Карточка товара ===== */
const modal = document.getElementById('modal');
let current = null;

function openModal(sku) {
  const item = state.items.find((i) => i.sku === sku);
  if (!item) return;
  current = item;

  document.getElementById('modalShot').innerHTML = drawItem(item);
  document.getElementById('modalSection').textContent = item.section;
  document.getElementById('modalTitle').textContent = item.name;
  document.getElementById('modalDesc').textContent = item.desc;
  document.getElementById('modalDesc').hidden = !item.desc;
  document.getElementById('modalPrice').textContent = `${money(item.price)} ₽`;

  const specs = [['Артикул', item.sku], ['Материал', item.material], ['Цвет', item.color], ['Размеры', item.size]]
    .filter(([, v]) => v && v !== '—');
  document.getElementById('modalSpecs').innerHTML = specs.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHTML(v)}</dd>`).join('');

  ['askName', 'askPhone'].forEach((id) => { document.getElementById(id).value = ''; });
  document.getElementById('askConsent').checked = false;
  document.getElementById('askSend').disabled = true;
  document.getElementById('askOk').hidden = true;
  document.getElementById('askError').hidden = true;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('[data-sku]');
  if (card) openModal(card.dataset.sku);
});
modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* Заявка: без галочки согласия кнопка не работает */
document.getElementById('askConsent').addEventListener('change', (e) => {
  document.getElementById('askSend').disabled = !e.target.checked;
});

document.getElementById('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const error = document.getElementById('askError');
  const ok = document.getElementById('askOk');
  const name = document.getElementById('askName').value.trim();
  const digits = document.getElementById('askPhone').value.replace(/\D/g, '');

  let problem = '';
  if (!document.getElementById('askConsent').checked) problem = 'Отметьте согласие на обработку данных';
  else if (name.length < 2) problem = 'Напишите, как к вам обращаться';
  else if (digits.length < 10 || digits.length > 11) problem = 'Проверьте номер — нужно 10–11 цифр';

  if (problem) { error.textContent = problem; error.hidden = false; ok.hidden = true; return; }

  error.hidden = true;
  ok.textContent = `Запрос по «${current.name}» (арт. ${current.sku}) принят. На настоящем сайте он пришёл бы продавцу в Telegram или на почту. Это демо — данные никуда не отправлены.`;
  ok.hidden = false;
  document.getElementById('askSend').disabled = true;
});

/* ===== Старт ===== */
loadDefault();
