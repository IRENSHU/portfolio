/* Страница-маршрут: вкладки дней, карта по кнопке, расчёт бюджета, чек-лист.
   Все подписи берутся из объекта L10N, который объявлен в самой странице —
   поэтому один и тот же файл работает и в русской, и в английской версии. */
(function () {
  'use strict';
  var T = window.L10N || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- вкладки дней ---------- */
  var tabs = $$('.days button');
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    });
  });

  /* ---------- карта грузится только после нажатия ----------
     До этого страница не обращается к внешним серверам: ничего не грузится
     «за спиной» у читателя, и страница открывается быстрее. */
  var mapBtn = $('#map-btn');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var box = $('#map-box');
      var frame = document.createElement('iframe');
      frame.src = mapBtn.dataset.src;
      frame.loading = 'lazy';
      frame.title = mapBtn.dataset.title || 'map';
      frame.setAttribute('referrerpolicy', 'no-referrer');
      box.innerHTML = '';
      box.appendChild(frame);
    });
  }

  /* ---------- расчёт бюджета ---------- */
  var calc = $('#calc');
  if (calc) {
    // цены за ночь за номер на двоих и питание на человека в день, евро
    var LEVELS = { eco: { room: 90, food: 30 }, mid: { room: 160, food: 55 }, high: { room: 260, food: 90 } };
    var MUSEUMS = { none: 0, route: 25, max: 45 };
    var TRANSPORT = 9;       // суточный билет на городской транспорт
    var CITY_TAX = 0.125;    // туристический налог Амстердама: 12,5% от стоимости ночёвки

    var days = $('#f-days'), people = $('#f-people'), level = $('#f-level'),
        museums = $('#f-museums'), travel = $('#f-travel'), rate = $('#f-rate');

    // по-русски пишут «120 €», по-английски «€120» — порядок задаёт страница
    var euro = function (n) {
      var v = Math.round(n).toLocaleString(T.locale || 'ru-RU');
      return T.euroFirst ? '€' + v : v + ' €';
    };

    // в русском три формы (ночь / ночи / ночей), в английском две — отсюда две ветки
    var plural = function (n, forms) {
      if (forms.length === 2) return n + ' ' + (n === 1 ? forms[0] : forms[1]);
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return n + ' ' + forms[0];
      if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return n + ' ' + forms[1];
      return n + ' ' + forms[2];
    };
    var nightsWord = function (n) { return plural(n, T.nights); };
    var peopleWord = function (n) { return plural(n, T.people); };

    var render = function () {
      var d = +days.value, p = +people.value;
      var lv = LEVELS[level.value] || LEVELS.mid;
      var rooms = Math.ceil(p / 2);

      var stay = rooms * d * lv.room;
      var tax = stay * CITY_TAX;
      var food = p * d * lv.food;
      var move = p * d * TRANSPORT;
      var see = p * d * (MUSEUMS[museums.value] || 0);
      var road = Math.max(0, +travel.value || 0) * p;
      var total = stay + tax + food + move + see + road;

      $('#o-days').textContent = nightsWord(d);
      $('#o-people').textContent = peopleWord(p);

      $('#b-stay-label').textContent = T.billStay
        .replace('{rooms}', rooms).replace('{nights}', nightsWord(d));
      $('#b-stay').textContent = euro(stay);
      $('#b-tax').textContent = euro(tax);
      $('#b-food').textContent = euro(food);
      $('#b-move').textContent = euro(move);
      $('#b-see').textContent = euro(see);
      $('#b-road').textContent = euro(road);
      $('#b-road-row').hidden = road === 0;

      $('#b-total').textContent = euro(total);
      $('#b-person').textContent = T.perPerson.replace('{sum}', euro(total / p));

      var rub = $('#b-rub');
      var kurs = rate ? +rate.value : 0;
      if (rub && kurs > 0) {
        rub.hidden = false;
        rub.textContent = T.inRubles.replace(
          '{sum}', Math.round(total * kurs).toLocaleString(T.locale || 'ru-RU'));
      } else if (rub) {
        rub.hidden = true;
      }
    };

    [days, people, level, museums, travel, rate].filter(Boolean).forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  }

  /* ---------- чек-лист документов ----------
     Отметки сохраняются в браузере читателя: закрыл страницу, вернулся —
     галочки на месте. На сервер ничего не уходит. */
  var list = $('#checklist');
  if (list) {
    var KEY = list.dataset.store || 'marshrut-checks';
    var boxes = $$('input[type=checkbox]', list);
    var bar = $('#checks-bar-fill'), counter = $('#checks-counter');

    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

    var paint = function () {
      var done = 0;
      boxes.forEach(function (b) {
        b.closest('li').classList.toggle('done', b.checked);
        if (b.checked) done++;
      });
      if (bar) bar.style.width = Math.round(done / boxes.length * 100) + '%';
      if (counter) counter.textContent = T.checksDone
        .replace('{done}', done).replace('{all}', boxes.length);
    };

    boxes.forEach(function (b) {
      if (saved[b.id]) b.checked = true;
      b.addEventListener('change', function () {
        saved[b.id] = b.checked;
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* режим инкогнито */ }
        paint();
      });
    });

    var reset = $('#checks-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        boxes.forEach(function (b) { b.checked = false; });
        saved = {};
        try { localStorage.removeItem(KEY); } catch (e) {}
        paint();
      });
    }
    paint();
  }
})();
