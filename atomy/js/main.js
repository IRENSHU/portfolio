/* ATOMY сайт · интерактив
   --------------------------------------------------------------- */
(function () {
  'use strict';

  /* === НАСТРОЙКА: куда отправлять заявки ========================
     Вставьте сюда URL вашего Google Apps Script (заканчивается на /exec).
     Инструкция — в файле "ПОДКЛЮЧЕНИЕ ФОРМ.md".
     Пока строка пустая — формы работают в демо-режиме (показывают
     "Спасибо", но никуда не отправляют).                          */
  var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwnkPDeAZaJ0Uo5vtgaH6fwOMIzqA-JVZELAZpyo4VfYlcif1QeSy5rKsfyFn7zIiLn/exec';
  /* ============================================================= */

  /* 1. Шапка: тень при прокрутке -------------------------------- */
  var header = document.querySelector('.header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2. Мобильное меню ------------------------------------------- */
  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav__links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

  /* 3. Подсветка активного пункта меню -------------------------- */
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });

  /* 4. FAQ аккордеон -------------------------------------------- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var q = item.querySelector('.faq__q');
    var a = item.querySelector('.faq__a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // закрыть остальные
      document.querySelectorAll('.faq__item.open').forEach(function (o) {
        if (o !== item) { o.classList.remove('open'); o.querySelector('.faq__a').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = isOpen ? null : a.scrollHeight + 'px';
    });
  });

  /* 5. Анимация появления (reveal) ------------------------------ */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* 6. Обработка форм: отправка заявки в Telegram --------------- */
  document.querySelectorAll('form[data-capture]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var consent = form.querySelector('input[type="checkbox"]');
      if (consent && !consent.checked) { consent.focus(); return; }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }

      /* собираем данные формы */
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = (location.pathname.split('/').pop() || 'index.html');
      data.time = new Date().toLocaleString('ru-RU');

      function done() {
        var success = form.querySelector('.form-success');
        form.querySelectorAll('.field, .consent, button[type="submit"], .form__note')
          .forEach(function (f) { f.style.display = 'none'; });
        if (success) success.style.display = 'block';
      }

      if (FORM_ENDPOINT) {
        /* mode:no-cors + text/plain => без CORS-префлайта; ответ не читаем */
        fetch(FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
          .then(done)
          .catch(done); /* даже при сетевой ошибке не пугаем пользователя */
      } else {
        done(); /* демо-режим: endpoint ещё не настроен */
      }
    });
  });

  /* 7. Год в подвале -------------------------------------------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* 8. Кнопка «наверх» ------------------------------------------ */
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.type = 'button';
  toTop.setAttribute('aria-label', 'Наверх');
  toTop.innerHTML = '↑';
  document.body.appendChild(toTop);
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  /* 9. Клик по цене ведёт к консультации ------------------------ */
  document.querySelectorAll('.product__price').forEach(function (p) {
    p.style.cursor = 'pointer';
    p.setAttribute('title', 'Узнать цену');
    p.addEventListener('click', function () {
      var card = p.closest('.product');
      var link = card ? card.querySelector('a.btn') : null;
      window.location.href = link ? link.getAttribute('href') : 'contacts.html';
    });
  });
})();
