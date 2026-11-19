/* Лучина — приложение на телефоне: регистрация service worker, кнопка «Установить», сообщение «нет сети». */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });

  // кнопка «Установить» появляется в шапке, только когда браузер готов поставить приложение
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let deferred = null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'install-btn';
  btn.hidden = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg><span>Установить</span>';
  btn.setAttribute('aria-label', 'Установить приложение «Лучина» на устройство');

  document.addEventListener('DOMContentLoaded', () => {
    const cart = document.querySelector('.cart-btn');
    if (cart) cart.before(btn);
    const note = document.querySelector('.pwa-hint');
    if (note && standalone) note.innerHTML = '<b>Вы открыли магазин как приложение.</b> Попробуйте выключить интернет — каталог и корзина продолжат работать.';
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; toast('Приложение установлено — иконка «Лучина» на главном экране'); });

  // плашка о состоянии сети
  function toast(text, stay) {
    let t = document.querySelector('.net-toast');
    if (!t) { t = document.createElement('div'); t.className = 'net-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._h);
    if (!stay) t._h = setTimeout(() => t.classList.remove('show'), 3500);
  }
  window.addEventListener('offline', () => toast('Нет интернета — показываем сохранённую копию магазина. Корзина работает.', true));
  window.addEventListener('online', () => toast('Интернет снова есть — цены и наличие обновлены'));
  if (!navigator.onLine) document.addEventListener('DOMContentLoaded', () => toast('Нет интернета — показываем сохранённую копию магазина. Корзина работает.', true));
})();
