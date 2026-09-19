/* Страница-разбор: переключение ширины превью, сетка поверх сайта, вес страницы */

const frameBox = document.getElementById('frameBox');
const overlay = document.getElementById('gridOverlay');
const label = document.getElementById('widthLabel');
const gridBtn = document.getElementById('gridBtn');
const switches = [...document.querySelectorAll('.switch[data-w]')];

/* поля контейнера на разных ширинах — те же, что в site.css */
function padFor(w) {
  if (w <= 640) return 16;
  if (w <= 1024) return 40;
  return 80;
}

let width = 1280;

function drawGrid() {
  const box = frameBox.getBoundingClientRect();
  const scale = box.width / width;              // превью может быть у́же реальной ширины
  const pad = padFor(width);
  const gut = width <= 640 ? 16 : 24;
  const colw = (width - pad * 2 - gut * 11) / 12;
  overlay.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const x = (pad + i * (colw + gut)) * scale;
    const el = document.createElement('i');
    el.style.left = x + 'px';
    el.style.width = colw * scale + 'px';
    overlay.appendChild(el);
  }
}

function setWidth(w) {
  width = w;
  const max = frameBox.parentElement.clientWidth - 28;   // поля превью
  frameBox.style.width = Math.min(w, max) + 'px';
  label.textContent = w + ' px';
  switches.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.w) === w)));
  // если превью у́же выбранной ширины, отмасштабируем содержимое рамки
  const frame = document.getElementById('siteFrame');
  const k = Math.min(1, max / w);
  frame.style.width = w + 'px';
  frame.style.transformOrigin = 'top left';
  frame.style.transform = k < 1 ? `scale(${k})` : 'none';
  frame.style.height = (k < 1 ? Math.round(620 / k) : 620) + 'px';
  frameBox.style.height = '620px';
  frameBox.style.overflow = 'hidden';
  drawGrid();
}

switches.forEach((b) => b.addEventListener('click', () => setWidth(Number(b.dataset.w))));

gridBtn.addEventListener('click', () => {
  const on = overlay.classList.toggle('on');
  gridBtn.setAttribute('aria-pressed', String(on));
  if (on) drawGrid();
});

window.addEventListener('resize', () => setWidth(width));
setWidth(1280);

/* вес страницы: складываем то, что реально загрузил браузер */
window.addEventListener('load', () => {
  setTimeout(() => {
    const res = performance.getEntriesByType('resource');
    const own = res.filter((r) => r.name.startsWith(location.origin));
    const bytes = own.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize || 0), 0)
      + (performance.getEntriesByType('navigation')[0]?.transferSize || 0);
    const kb = Math.round(bytes / 1024);
    if (kb > 0) {
      document.getElementById('weight').textContent = kb + ' КБ';
      document.getElementById('weight2').textContent = kb + ' КБ';
    }
  }, 800);
});
