/* ===== Каталог собирается из файла tovary.csv =====
   Заказчик редактирует таблицу в Excel и заливает файл — сайт подхватывает изменения.
   Разделители — точка с запятой: именно так Excel сохраняет CSV в русской локали. */

const state = {
  items: [],
  section: 'Все разделы',
  materials: new Set(),
  priceMin: null,
  priceMax: null,
  query: '',
  sort: 'default'
};

/* ===== Чтение таблицы ===== */
function parseCSV(text) {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/);
  const headers = lines[0].split(';').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = line.split(';');
    const row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] || '').trim(); });
    return {
      section:  row['Раздел'],
      name:     row['Название'],
      sku:      row['Артикул'],
      price:    Number(row['Цена']),
      material: row['Материал'],
      color:    row['Цвет'],
      hex:      row['ЦветHEX'],
      size:     row['Размеры'],
      hit:      row['Хит'] === 'да'
    };
  }).filter((item) => item.name);
}

/* ===== Картинка товара рисуется кодом, файлы изображений не нужны ===== */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (c) => Math.max(0, Math.min(255, Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function drawItem(item) {
  const base = item.hex || '#b0b6bc';
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

/* ===== Фильтрация ===== */
function visibleItems() {
  const q = state.query.trim().toLowerCase();

  let list = state.items.filter((item) => {
    if (state.section !== 'Все разделы' && item.section !== state.section) return false;
    if (state.materials.size && !state.materials.has(item.material)) return false;
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

  grid.innerHTML = list.map((item, i) => `
    <button type="button" class="card" data-sku="${item.sku}">
      <span class="card__shot">
        ${item.hit ? '<span class="card__hit">хит</span>' : ''}
        ${drawItem(item)}
      </span>
      <span class="card__body">
        <span class="card__name">${item.name}</span>
        <span class="card__meta">${item.material} · ${item.color}<br>арт. ${item.sku}</span>
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
      <button type="button" class="${name === state.section ? 'is-active' : ''}" data-section="${name}">
        <span>${name}</span><span class="num">${num}</span>
      </button>
    </li>`).join('');
}

function renderMaterials() {
  const list = [...new Set(state.items.map((i) => i.material))].sort((a, b) => a.localeCompare(b, 'ru'));
  document.getElementById('materials').innerHTML = list.map((m) => `
    <li>
      <label>
        <input type="checkbox" value="${m}" ${state.materials.has(m) ? 'checked' : ''}>
        ${m}
      </label>
    </li>`).join('');
}

/* ===== События ===== */
document.getElementById('sections').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-section]');
  if (!btn) return;
  state.section = btn.dataset.section;
  renderSections();
  renderGrid();
});

document.getElementById('materials').addEventListener('change', (e) => {
  const box = e.target;
  if (box.checked) state.materials.add(box.value); else state.materials.delete(box.value);
  renderGrid();
});

document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value;
  renderGrid();
});

document.getElementById('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  renderGrid();
});

['priceMin', 'priceMax'].forEach((id) => {
  document.getElementById(id).addEventListener('input', (e) => {
    const value = e.target.value === '' ? null : Number(e.target.value);
    state[id] = value;
    renderGrid();
  });
});

document.getElementById('reset').addEventListener('click', () => {
  state.section = 'Все разделы';
  state.materials.clear();
  state.priceMin = state.priceMax = null;
  state.query = '';
  state.sort = 'default';
  document.getElementById('search').value = '';
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('sort').value = 'default';
  renderSections();
  renderMaterials();
  renderGrid();
});

const sidebar = document.getElementById('sidebar');
document.getElementById('filtersToggle').addEventListener('click', (e) => {
  const open = sidebar.classList.toggle('is-open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

/* ===== Карточка товара ===== */
const modal = document.getElementById('modal');

function openModal(sku) {
  const item = state.items.find((i) => i.sku === sku);
  if (!item) return;

  document.getElementById('modalShot').innerHTML = drawItem(item);
  document.getElementById('modalSection').textContent = item.section;
  document.getElementById('modalTitle').textContent = item.name;
  document.getElementById('modalPrice').textContent = `${money(item.price)} ₽`;
  document.getElementById('modalSpecs').innerHTML = `
    <dt>Артикул</dt><dd>${item.sku}</dd>
    <dt>Материал</dt><dd>${item.material}</dd>
    <dt>Цвет</dt><dd>${item.color}</dd>
    <dt>Размеры</dt><dd>${item.size}</dd>`;

  document.getElementById('askOk').hidden = true;
  document.getElementById('askError').hidden = true;
  document.getElementById('askPhone').value = '';

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

document.getElementById('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const phone = document.getElementById('askPhone');
  const digits = phone.value.replace(/\D/g, '');

  if (digits.length < 10) {
    document.getElementById('askError').hidden = false;
    document.getElementById('askOk').hidden = true;
    return;
  }
  document.getElementById('askError').hidden = true;
  document.getElementById('askOk').hidden = false;
  phone.value = '';
});

/* ===== Старт ===== */
fetch('tovary.csv')
  .then((r) => r.text())
  .then((text) => {
    state.items = parseCSV(text);
    renderSections();
    renderMaterials();
    renderGrid();
  })
  .catch(() => {
    grid.innerHTML = '<p class="empty">Не удалось загрузить файл каталога tovary.csv</p>';
  });
