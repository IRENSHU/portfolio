/* ==========================================================================
   АвтоТочка — интерактив лендинга
   Ванильный JS, без библиотек.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Шапка: уплотняется при прокрутке ---------- */
  var header = document.getElementById('header');
  var fab = document.querySelector('.fab');

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (fab) fab.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.classList.contains('nav__link')) {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
      }
    });
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        // лёгкая задержка для соседних элементов — блоки появляются каскадом
        setTimeout(function () {
          entry.target.classList.add('is-in');
        }, i * 70);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Счётчики в блоке цифр ---------- */
  var counters = document.querySelectorAll('[data-count]');

  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    var duration = 1100;
    var start = performance.now();

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      // плавное замедление к концу
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- Маска телефона ---------- */
  function maskPhone(e) {
    var input = e.target;
    var digits = input.value.replace(/\D/g, '');

    // приводим к российскому формату: 7XXXXXXXXXX
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);

    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) out += '-' + digits.slice(7, 9);
    if (digits.length >= 10) out += '-' + digits.slice(9, 11);

    input.value = out;
    input.classList.remove('is-error');
  }

  document.querySelectorAll('.js-phone').forEach(function (input) {
    input.addEventListener('input', maskPhone);
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
  });

  /* ---------- Проверка и отправка форм ---------- */
  function validate(form) {
    var ok = true;

    form.querySelectorAll('[required]').forEach(function (field) {
      var value = field.value.trim();
      var bad = !value;

      // для телефона проверяем, что введены все 11 цифр
      if (!bad && field.type === 'tel') {
        bad = value.replace(/\D/g, '').length !== 11;
      }

      field.classList.toggle('is-error', bad);
      if (bad) ok = false;
    });

    return ok;
  }

  document.querySelectorAll('.form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validate(form)) {
        var firstBad = form.querySelector('.is-error');
        if (firstBad) firstBad.focus();
        return;
      }

      // Демонстрационный лендинг: показываем подтверждение вместо отправки.
      // На боевом сайте здесь будет fetch на сервер или CRM.
      var done = document.createElement('div');
      done.className = 'form__done';
      done.textContent = 'Заявка принята. Перезвоним в течение 15 минут.';
      form.replaceWith(done);
    });

    form.addEventListener('input', function (e) {
      e.target.classList.remove('is-error');
    });
  });

  /* ---------- Модальное окно ---------- */
  var modal = document.getElementById('modal');
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var firstInput = modal.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-open-modal')) { openModal(); return; }
    if (e.target.closest('.js-close-modal')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* ---------- Плавная прокрутка с учётом фиксированной шапки ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      var offset = header.offsetHeight + 12;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();
