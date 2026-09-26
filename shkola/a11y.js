/*
 Версия для слабовидящих по ГОСТ Р 52872-2012.
 Требования, которые закрывает этот файл: три цветовые схемы, три размера шрифта,
 межбуквенный интервал, отключение изображений, управление только с клавиатуры.
 Настройки хранятся в браузере посетителя, чтобы не включать режим на каждой странице заново.
*/
(function () {
  var KEY = 'a11y-settings';
  var root = document.documentElement;
  var defaults = { on: false, scheme: 'bw', size: 'm', spacing: 'normal', images: true };
  var state = Object.assign({}, defaults);

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    state = Object.assign(state, saved);
  } catch (e) {}

  function apply() {
    root.classList.toggle('a11y', state.on);
    root.dataset.a11yScheme = state.on ? state.scheme : '';
    root.dataset.a11ySize = state.on ? state.size : '';
    root.dataset.a11ySpacing = state.on ? state.spacing : '';
    root.dataset.a11yImages = state.on && !state.images ? 'off' : '';
    var panel = document.getElementById('a11y-panel');
    if (panel) panel.hidden = !state.on;
    document.querySelectorAll('[data-a11y-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.on));
    });
    sync();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function sync() {
    document.querySelectorAll('[data-a11y-set]').forEach(function (b) {
      var parts = b.dataset.a11ySet.split(':');
      var active = String(state[parts[0]]) === parts[1];
      b.setAttribute('aria-pressed', String(active));
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a11y-toggle], [data-a11y-set]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-a11y-toggle')) {
      state.on = !state.on;
    } else {
      var parts = t.dataset.a11ySet.split(':');
      state[parts[0]] = parts[1] === 'true' ? true : parts[1] === 'false' ? false : parts[1];
      state.on = true;
    }
    apply();
    if (state.on) { var p = document.getElementById('a11y-panel'); if (p) p.focus(); }
  });

  apply();
})();
