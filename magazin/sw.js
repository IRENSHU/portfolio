/* Лучина — service worker.
   Страницы и таблица товаров: сначала сеть, без сети — сохранённая копия (цены всегда свежие, если интернет есть).
   Картинки, шрифты, стили, скрипты: сначала из кэша (быстро), в фоне обновляются.
   Чтобы выкатить новую версию — поменяйте VERSION. */
const VERSION = 'luchina-v2';
const CORE = [
  './', 'index.html', 'tovar.html', 'oformlenie.html', 'dostavka.html', 'soglasie.html', 'kak-ustroeno.html', 'offline.html',
  'styles.css', 'shop.js', 'pwa.js', 'tovary.csv', 'manifest.webmanifest',
  'fonts/lora-cyrillic-normal.woff2', 'fonts/lora-cyrillic-italic.woff2', 'fonts/lora-latin-normal.woff2', 'fonts/lora-latin-italic.woff2',
  'fonts/manrope-cyrillic.woff2', 'fonts/manrope-latin.woff2',
  'img/hero.jpg', 'img/pwa/icon-192.png',
  ...['bergamot', 'chai', 'chainye', 'hlopok', 'inzhir', 'korobka', 'lavanda', 'moloko', 'podarok', 'sezony', 'shalfey', 'soty', 'vanil', 'vecher', 'yantar']
    .map((n) => 'img/sm/' + n + '.jpg')
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('luchina-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const fresh = (req) => fetch(req).then((res) => {
  if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
  return res;
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // страницы: сеть → кэш (без учёта ?sku=…) → страница «нет сети»
  if (req.mode === 'navigate') {
    e.respondWith(
      fresh(req).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('offline.html')))
    );
    return;
  }
  // таблица товаров: сеть → кэш
  if (url.pathname.endsWith('.csv')) {
    e.respondWith(fresh(req).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // большое фото, которое ещё не открывали, без сети заменяем уменьшенной копией из img/sm/
  const small = () => url.pathname.match(/\/img\/[^/]+\.jpg$/)
    ? caches.match(url.pathname.replace(/\/img\/([^/]+)$/, '/img/sm/$1'))
    : undefined;
  // остальное: кэш → сеть, кэш обновляется в фоне
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fresh(req).catch(() => hit || small());
      return hit || net;
    })
  );
});
