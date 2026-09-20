/* Переключение «было / стало» и ширины экрана в окне превью */

const frameBox = document.getElementById('frameBox');
const frame = document.getElementById('site');
const note = document.getElementById('frameNote');
const btnBylo = document.getElementById('btnBylo');
const btnStalo = document.getElementById('btnStalo');
const sizes = [...document.querySelectorAll('.size')];

let version = 'stalo';
let width = 1200;

function apply() {
  // версия
  frame.src = version + '.html';
  btnBylo.setAttribute('aria-pressed', String(version === 'bylo'));
  btnStalo.setAttribute('aria-pressed', String(version === 'stalo'));

  // ширина: если окно у́же выбранной — уменьшаем масштабом, чтобы вёрстка вела себя как на реальном экране
  const max = frameBox.parentElement.clientWidth - 28;
  const k = Math.min(1, max / width);
  frameBox.style.width = Math.min(width, max) + 'px';
  frame.style.width = width + 'px';
  frame.style.transformOrigin = 'top left';
  frame.style.transform = k < 1 ? `scale(${k})` : 'none';
  frame.style.height = Math.round(640 / k) + 'px';
  frameBox.style.height = '640px';
  sizes.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.w) === width)));

  note.innerHTML = version === 'bylo'
    ? 'Сейчас показана страница <b>до правок</b>. На телефоне она открывается как на компьютере — буквы мелкие, всё нужно растягивать пальцами. Открыть отдельно: <a href="bylo.html" target="_blank" rel="noopener">было</a> · <a href="stalo.html" target="_blank" rel="noopener">стало</a>'
    : 'Сейчас показана страница <b>после правок</b>. Форма проверяет поля, кнопка не работает без согласия. Открыть отдельно: <a href="bylo.html" target="_blank" rel="noopener">было</a> · <a href="stalo.html" target="_blank" rel="noopener">стало</a>';
}

btnBylo.addEventListener('click', () => { version = 'bylo'; apply(); });
btnStalo.addEventListener('click', () => { version = 'stalo'; apply(); });
sizes.forEach((b) => b.addEventListener('click', () => { width = Number(b.dataset.w); apply(); }));
window.addEventListener('resize', apply);

apply();
