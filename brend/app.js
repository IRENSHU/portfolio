// «Медуница» — общий скрипт демо: банки, каталог из CSV, рецепты из JSON, формы
(function () {
  const base = document.body.dataset.base || '';

  // меню на телефоне
  const burger = document.querySelector('.burger'), nav = document.querySelector('.nav');
  if (burger) burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open);
  });

  // появление при прокрутке
  const shot = location.search.includes('shot');
  const io = !shot && 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 }) : null;
  window.reveal = (root) => (root || document).querySelectorAll('.rv,.bar').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  reveal();

  // банка: цвет содержимого и линейка задают рисунок
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  };
  window.jar = function (color, name, line, tall) {
    const h = tall ? 150 : 120, top = 150 - h, id = 'j' + Math.random().toString(36).slice(2, 7);
    const lid = line === 'Варенья' ? '#d9a441' : line === 'Соусы и заправки' ? '#2b2320' : '#3f6b3a';
    const cloth = line === 'Варенья';
    const word = (name || '').split(' ')[0].slice(0, 11);
    return `<svg viewBox="0 0 100 ${170}" aria-hidden="true"><defs>
      <linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${shade(color, -.25)}"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -.35)}"/></linearGradient></defs>
      <rect x="14" y="${top + 22}" width="72" height="${h - 6}" rx="14" fill="url(#${id})"/>
      <rect x="14" y="${top + 22}" width="72" height="${h - 6}" rx="14" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
      <rect x="22" y="${top + 30}" width="7" height="${h - 30}" rx="3.5" fill="rgba(255,255,255,.28)"/>
      <rect x="20" y="${top + 10}" width="60" height="16" rx="4" fill="${lid}"/>
      ${cloth ? `<path d="M12 ${top + 14} Q50 ${top - 2} 88 ${top + 14} L84 ${top + 30} Q70 ${top + 24} 50 ${top + 32} Q30 ${top + 24} 16 ${top + 30} Z" fill="#f4ead9"/><path d="M12 ${top + 14} Q50 ${top - 2} 88 ${top + 14}" stroke="#9e2b3a" stroke-width="2" fill="none" stroke-dasharray="4 4"/><rect x="16" y="${top + 26}" width="68" height="4" rx="2" fill="#9e2b3a"/>` : ''}
      <rect x="24" y="${top + h * .45}" width="52" height="40" rx="6" fill="#fffdf9"/>
      <text x="50" y="${top + h * .45 + 17}" text-anchor="middle" font-family="Lora,serif" font-size="9.5" font-weight="600" fill="#2b2320">${word}</text>
      <text x="50" y="${top + h * .45 + 30}" text-anchor="middle" font-family="Manrope,sans-serif" font-size="6" letter-spacing="1" fill="#9e2b3a">МЕДУНИЦА</text>
    </svg>`;
  };

  // разбор CSV с разделителем «;»
  window.loadProducts = async function () {
    const txt = await (await fetch(base + 'data/produkciya.csv')).text();
    const rows = txt.trim().split(/\r?\n/).map(r => r.split(';'));
    const head = rows.shift();
    return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
  };
  window.loadRecipes = async function () {
    return (await (await fetch(base + 'data/recepty.json')).json()).recipes;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.esc = esc;

  window.productCard = p => `<button class="card rv" type="button" data-id="${esc(p['Артикул'])}">
      <div class="pic">${p['Новинка'] === 'да' ? '<span class="new">Новинка</span>' : ''}${jar(p['Цвет'], p['Название'], p['Линейка'], +p['Вес, г'] > 400)}</div>
      <span class="ln">${esc(p['Линейка'])}</span><h3>${esc(p['Название'])}</h3>
      <span class="w">${esc(p['Вес, г'])} г · ${esc(p['Артикул'])}</span></button>`;

  // окно товара
  window.openProduct = function (p, recipes) {
    let d = document.getElementById('prod');
    if (!d) { d = document.createElement('dialog'); d.id = 'prod'; document.body.appendChild(d); d.addEventListener('click', e => { if (e.target === d) d.close(); }); }
    const rel = (recipes || []).filter(r => r.products.includes(p['Артикул']));
    d.innerHTML = `<div class="dlg"><div class="pic">${jar(p['Цвет'], p['Название'], p['Линейка'], +p['Вес, г'] > 400)}</div>
      <div class="body"><span class="eyebrow">${esc(p['Линейка'])}</span><h2>${esc(p['Название'])}</h2>
      <p class="muted">${esc(p['Описание'])}</p>
      <div class="facts"><div><b>${esc(p['Вес, г'])} г</b>вес</div><div><b>${esc(p['Ккал на 100 г'])}</b>ккал / 100 г</div><div><b>${esc(p['Срок годности, мес'])} мес</b>хранение</div></div>
      <p><b>Состав:</b> ${esc(p['Состав'])}</p>
      ${rel.length ? `<p style="margin-top:10px"><b>Рецепты:</b> ${rel.map(r => `<a href="${base}recept.html?id=${r.id}">${esc(r.title)}</a>`).join(', ')}</p>` : ''}
      <div class="buy"><a class="btn btn-main btn-sm" href="${base}gde-kupit.html">Где купить</a><a class="btn btn-line btn-sm" href="${base}gde-kupit.html#marketplaces">Маркетплейсы</a></div>
      </div></div><button class="close" type="button" aria-label="Закрыть">×</button>`;
    d.querySelector('.close').addEventListener('click', () => d.close());
    d.showModal();
  };

  window.recipeCard = r => `<a class="rcard rv" href="${base}recept.html?id=${esc(r.id)}">
      <img src="${base}${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">
      <div class="b"><span class="chip">${esc(r.line)}</span><h3 style="margin-top:10px">${esc(r.title)}</h3>
      <div class="meta">${r.time} мин · ${r.portions} порции</div></div></a>`;

  // форма заявки: в демо ничего не отправляет
  document.querySelectorAll('form.form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = f.querySelector('.err'); err.textContent = '';
    const bad = [...f.querySelectorAll('[required]')].find(i => i.type === 'checkbox' ? !i.checked : !i.value.trim());
    if (bad) { err.textContent = bad.type === 'checkbox' ? 'Отметьте согласие на обработку персональных данных' : 'Заполните поле «' + bad.closest('label').firstChild.textContent.trim() + '»'; bad.focus(); return; }
    f.outerHTML = '<div class="ok">Спасибо! Заявка принята — менеджер свяжется в течение рабочего дня. (Это демо: заявка никуда не отправлена.)</div>';
  }));
})();
