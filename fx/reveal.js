/* Общие эффекты для демо: плавное появление блоков при прокрутке, первый экран при загрузке,
   «вдавливание» кнопок при нажатии. Подключение:
   <script src="../fx/reveal.js" data-reveal=".card, .step" data-hero=".hero h1, .hero p" data-press=".btn" defer></script>
   Работает и с карточками, которые страница дорисовывает сама (каталог, фильтры).
   У кого в системе включено «уменьшить движение» — ничего не прячется и не двигается. */
(function () {
  'use strict';
  var me = document.currentScript;
  var reveal = me && me.getAttribute('data-reveal');
  var hero = me && me.getAttribute('data-hero');
  var press = me && me.getAttribute('data-press');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // translate/scale — отдельные свойства, поэтому не спорят с transform, которым карточки
  // уже поднимаются при наведении
  var css = '';
  if (press) css += press.split(',').map(function (s) { return s.trim() + ':active:not(:disabled)'; }).join(',') + '{scale:.97}';
  if (!still) {
    css += '@keyframes fx-hero{from{opacity:0;translate:0 18px}to{opacity:1;translate:none}}' +
      '.fx-hero{animation:fx-hero .7s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--fx-d,0s)}' +
      '.fx-reveal:not(.fx-in){opacity:0;translate:0 26px}' +
      '.fx-reveal.fx-rising{transition:opacity .7s ease,translate .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--fx-d,0s)}';
  }
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  if (still) return;

  if (hero) {
    [].forEach.call(document.querySelectorAll(hero), function (el, i) {
      el.style.setProperty('--fx-d', (i * 0.1) + 's');
      el.classList.add('fx-hero');
    });
  }
  if (!reveal) return;

  var queued = false;
  function check() {
    queued = false;
    var h = window.innerHeight, k = 0;
    [].forEach.call(document.querySelectorAll(reveal), function (el) {
      if (el.classList.contains('fx-in')) return;
      // скрытые фильтром карточки не трогаем, пока их не покажут
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
      el.classList.add('fx-reveal');
      if (el.getBoundingClientRect().top < h * 0.9) {
        // блоки, показавшиеся одновременно (соседи по строке), выезжают по очереди
        el.style.setProperty('--fx-d', (Math.min(k++, 5) * 0.08) + 's');
        el.classList.add('fx-rising', 'fx-in');
        setTimeout(function () { el.classList.remove('fx-rising'); }, 1300);
      }
    });
  }
  function later() { if (!queued) { queued = true; requestAnimationFrame(check); } }
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  if (window.MutationObserver) new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  check();
})();
