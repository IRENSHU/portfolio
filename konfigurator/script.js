/* ===== Данные производства =====
   В рабочей версии этот блок выносится в отдельный файл или приходит с сервера —
   тогда менеджер добавляет размеры и оформления сам, не трогая код. */

const TYPES = [
  { id: 'lid',  name: 'Крышка-дно',  meta: 'Съёмная крышка, плотный картон', base: 210, lid: true  },
  { id: 'slide', name: 'Пенал',      meta: 'Выдвижной короб, лента-петля',   base: 165, lid: false }
];

const FOOTPRINTS = [[150, 110], [200, 150], [240, 170], [300, 220], [350, 250], [400, 300]];
const HEIGHTS = [50, 80, 120, 160];

const SIZES = [];
FOOTPRINTS.forEach(([w, d]) => {
  HEIGHTS.forEach((h) => {
    const cm3 = (w * d * h) / 1000;
    SIZES.push({
      id: `${w}x${d}x${h}`,
      w, d, h, cm3,
      group: cm3 < 2200 ? 'small' : cm3 < 9000 ? 'medium' : 'large'
    });
  });
});

const FINISHES = [
  { id: 'kraft',     name: 'Крафт, без печати',   color: '#b98b57', add: 0,  ribbon: false },
  { id: 'kraft-emb', name: 'Крафт с тиснением',   color: '#a9784a', add: 35, ribbon: false },
  { id: 'white',     name: 'Белый мелованный',    color: '#f1f1ee', add: 20, ribbon: false },
  { id: 'white-uv',  name: 'Белый с УФ-лаком',    color: '#e9edf1', add: 45, ribbon: false },
  { id: 'black',     name: 'Чёрный софт-тач',     color: '#26262a', add: 60, ribbon: false },
  { id: 'black-gold',name: 'Чёрный с фольгой',    color: '#2d2924', add: 95, ribbon: false },
  { id: 'navy',      name: 'Тёмно-синий',         color: '#22344f', add: 40, ribbon: false },
  { id: 'emerald',   name: 'Изумрудный',          color: '#1f4f3f', add: 40, ribbon: false },
  { id: 'burgundy',  name: 'Бордовый',            color: '#5a2230', add: 40, ribbon: false },
  { id: 'powder',    name: 'Пудровый с лентой',   color: '#e0c2be', add: 55, ribbon: true  },
  { id: 'olive',     name: 'Оливковый',           color: '#6b7043', add: 40, ribbon: false },
  { id: 'grey-rib',  name: 'Серый с лентой',      color: '#8d949c', add: 50, ribbon: true  }
];

const QTYS = [
  { qty: 50,  koef: 1.10, label: '50 шт.',  meta: '+10%'   },
  { qty: 100, koef: 1.00, label: '100 шт.', meta: 'базовая' },
  { qty: 300, koef: 0.90, label: '300 шт.', meta: '−10%'   },
  { qty: 500, koef: 0.85, label: '500 шт.', meta: '−15%'   }
];

/* ===== Текущий выбор ===== */
const state = {
  type: TYPES[0],
  size: SIZES.find((s) => s.id === '200x150x80') || SIZES[0],
  finish: FINISHES[0],
  qty: QTYS[1],
  logo: null,
  logoName: '',
  logoScale: 70,
  logoShift: 0,
  sizeGroup: 'all'
};

/* ===== Работа с цветом: грани куба красим одним цветом разной светлоты ===== */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (channel) => {
    const value = amount > 0
      ? channel + (255 - channel) * amount
      : channel * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(value)));
  };
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ===== Цена ===== */
function calcUnit() {
  const sizeAdd = Math.round(state.size.cm3 * 0.045);
  return state.type.base + sizeAdd + state.finish.add;
}

function calcTotal() {
  return Math.round(calcUnit() * state.qty.qty * state.qty.koef);
}

const money = (value) => value.toLocaleString('ru-RU');

/* ===== Отрисовка списков ===== */
const typeBox   = document.getElementById('typeOptions');
const sizeBox   = document.getElementById('sizeOptions');
const finishBox = document.getElementById('finishOptions');
const qtyBox    = document.getElementById('qtyOptions');

function renderTypes() {
  typeBox.innerHTML = TYPES.map((t) => `
    <button type="button" class="opt ${t.id === state.type.id ? 'is-active' : ''}" data-type="${t.id}">
      <span class="opt__name">${t.name}</span>
      <span class="opt__meta">${t.meta}</span>
    </button>`).join('');
}

function renderSizes() {
  const list = state.sizeGroup === 'all'
    ? SIZES
    : SIZES.filter((s) => s.group === state.sizeGroup);

  sizeBox.innerHTML = list.map((s) => `
    <button type="button" class="opt ${s.id === state.size.id ? 'is-active' : ''}" data-size="${s.id}">
      <span class="opt__name">${s.w} × ${s.d}</span>
      <span class="opt__meta">высота ${s.h} мм</span>
    </button>`).join('');
}

function renderFinishes() {
  finishBox.innerHTML = FINISHES.map((f) => `
    <button type="button" class="opt opt--finish ${f.id === state.finish.id ? 'is-active' : ''}" data-finish="${f.id}">
      <span class="swatch" style="background:${f.color}"></span>
      <span>
        <span class="opt__name">${f.name}</span>
        <span class="opt__meta">${f.add ? '+' + f.add + ' ₽/шт' : 'без доплаты'}</span>
      </span>
    </button>`).join('');
}

function renderQtys() {
  qtyBox.innerHTML = QTYS.map((q) => `
    <button type="button" class="opt opt--qty ${q.qty === state.qty.qty ? 'is-active' : ''}" data-qty="${q.qty}">
      <span class="opt__name">${q.label}</span>
      <span class="opt__meta">${q.meta}</span>
    </button>`).join('');
}

/* ===== Превью и сводка ===== */
function renderPreview() {
  const color = state.finish.color;

  document.getElementById('faceTop').setAttribute('fill', shade(color, 0.18));
  document.getElementById('faceLeft').setAttribute('fill', shade(color, -0.08));
  document.getElementById('faceRight').setAttribute('fill', shade(color, -0.30));

  document.getElementById('lidTop').setAttribute('fill', shade(color, 0.26));
  document.getElementById('lidLeft').setAttribute('fill', shade(color, 0));
  document.getElementById('lidRight').setAttribute('fill', shade(color, -0.22));

  document.getElementById('lidGroup').style.opacity = state.type.lid ? '1' : '0';
  document.getElementById('ribbon').setAttribute('opacity', state.finish.ribbon ? '1' : '0');

  // Логотип ложится на левую переднюю грань: наклон совпадает с наклоном ребра
  const layer = document.getElementById('logoLayer');
  const img = document.getElementById('logoImg');

  if (state.logo) {
    const size = state.logoScale;
    img.setAttribute('width', size);
    img.setAttribute('height', size);
    img.setAttribute('x', 106 - size / 2);
    img.setAttribute('y', 150 - size / 2 + state.logoShift);
    layer.setAttribute('transform', 'matrix(1, 0.37, 0, 1, 0, 0)');
    layer.setAttribute('opacity', '1');
  } else {
    layer.setAttribute('opacity', '0');
  }
}

function renderSummary() {
  const total = calcTotal();

  document.getElementById('sumType').textContent = state.type.name;
  document.getElementById('sumSize').textContent = `${state.size.w} × ${state.size.d} × ${state.size.h} мм`;
  document.getElementById('sumFinish').textContent = state.finish.name;
  document.getElementById('sumLogo').textContent = state.logo ? state.logoName : 'не загружен';
  document.getElementById('sumQty').textContent = state.qty.qty;
  document.getElementById('sumPrice').textContent = money(total);
  document.getElementById('sumUnit').textContent = money(Math.round(total / state.qty.qty));
}

function renderAll() {
  renderTypes();
  renderSizes();
  renderFinishes();
  renderQtys();
  renderPreview();
  renderSummary();
}

/* ===== Выбор вариантов ===== */
typeBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (!btn) return;
  state.type = TYPES.find((t) => t.id === btn.dataset.type);
  renderAll();
});

sizeBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-size]');
  if (!btn) return;
  state.size = SIZES.find((s) => s.id === btn.dataset.size);
  renderAll();
});

finishBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-finish]');
  if (!btn) return;
  state.finish = FINISHES.find((f) => f.id === btn.dataset.finish);
  renderAll();
});

qtyBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-qty]');
  if (!btn) return;
  state.qty = QTYS.find((q) => q.qty === Number(btn.dataset.qty));
  renderAll();
});

document.querySelector('.sizefilter').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.sizefilter .chip').forEach((c) => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  state.sizeGroup = chip.dataset.group;
  renderSizes();
});

/* ===== Логотип ===== */
const logoInput = document.getElementById('logoInput');
const logoName  = document.getElementById('logoName');
const logoClear = document.getElementById('logoClear');
const logoError = document.getElementById('logoError');
const logoControls = document.getElementById('logoControls');

const MAX_LOGO = 5 * 1024 * 1024;

logoInput.addEventListener('change', () => {
  const file = logoInput.files[0];
  if (!file) return;

  logoError.hidden = true;

  if (file.size > MAX_LOGO) {
    logoError.textContent = 'Файл больше 5 МБ — уменьшите картинку и попробуйте снова.';
    logoError.hidden = false;
    logoInput.value = '';
    return;
  }

  // Файл читается прямо в браузере: клиент видит логотип сразу, без отправки на сервер
  const reader = new FileReader();
  reader.onload = () => {
    state.logo = reader.result;
    state.logoName = file.name;
    document.getElementById('logoImg').setAttribute('href', reader.result);
    logoName.textContent = file.name;
    logoClear.hidden = false;
    logoControls.hidden = false;
    renderPreview();
    renderSummary();
  };
  reader.readAsDataURL(file);
});

logoClear.addEventListener('click', () => {
  state.logo = null;
  state.logoName = '';
  logoInput.value = '';
  logoName.textContent = 'PNG, JPG или SVG, до 5 МБ';
  logoClear.hidden = true;
  logoControls.hidden = true;
  renderPreview();
  renderSummary();
});

document.getElementById('logoScale').addEventListener('input', (e) => {
  state.logoScale = Number(e.target.value);
  renderPreview();
});

document.getElementById('logoShift').addEventListener('input', (e) => {
  state.logoShift = Number(e.target.value);
  renderPreview();
});

/* ===== Заявка ===== */
const form = document.getElementById('orderForm');
const sent = document.getElementById('sent');

function setError(input, message) {
  input.closest('.field').classList.add('has-error');
  form.querySelector(`[data-error-for="${input.id}"]`).textContent = message;
}

function clearError(input) {
  input.closest('.field').classList.remove('has-error');
  form.querySelector(`[data-error-for="${input.id}"]`).textContent = '';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = form.elements.fname;
  const phone = form.elements.fphone;
  let valid = true;

  clearError(name);
  clearError(phone);

  if (name.value.trim().length < 2) {
    setError(name, 'Напишите, как к вам обращаться');
    valid = false;
  }
  if (phone.value.replace(/\D/g, '').length < 10) {
    setError(phone, 'Проверьте номер — не хватает цифр');
    valid = false;
  }
  if (!valid) return;

  const total = calcTotal();
  const lines = [
    `Имя:          ${name.value.trim()}`,
    `Телефон:      ${phone.value.trim()}`,
    `Конструктив:  ${state.type.name}`,
    `Размер:       ${state.size.w} × ${state.size.d} × ${state.size.h} мм`,
    `Оформление:   ${state.finish.name}`,
    `Тираж:        ${state.qty.qty} шт.`,
    `Логотип:      ${state.logo ? state.logoName : 'не приложен'}`,
    `Стоимость:    ${money(total)} ₽ (${money(Math.round(total / state.qty.qty))} ₽ за штуку)`
  ];
  if (form.elements.fcomment.value.trim()) {
    lines.push(`Комментарий:  ${form.elements.fcomment.value.trim()}`);
  }

  document.getElementById('sentData').textContent = lines.join('\n');
  form.hidden = true;
  sent.hidden = false;
  sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('sentBack').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  sent.hidden = true;
});

['fname', 'fphone'].forEach((id) => {
  form.elements[id].addEventListener('input', (e) => clearError(e.target));
});

/* ===== Старт ===== */
renderAll();
