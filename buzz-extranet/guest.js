'use strict';

let search = null;

/* =================== Страница отеля для гостя =================== */
function renderGuest() {
  if (!search) search = { checkIn: addDays(today(), 1), checkOut: addDays(today(), 3), guests: 2 };
  const n = nightsBetween(search.checkIn, search.checkOut);
  const offers = S.rooms
    .map(r => {
      const q = stayQuote(r.id, search.checkIn, search.checkOut);
      const reason = r.guests < search.guests ? `Вмещает до ${r.guests} ${plural(r.guests, 'гостя', 'гостей', 'гостей')}`
        : q.closed ? 'Нет продажи на эти даты'
        : q.minFree === 0 ? 'Нет свободных номеров на эти даты' : '';
      return { r, q, ok: !reason, reason };
    })
    .sort((a, b) => (b.ok - a.ok) || (a.q.total - b.q.total));

  const g = document.getElementById('guest');
  g.innerHTML = `
    <section class="hero reveal">
      <div class="hero-in">
        <div class="label">Рязань · отель</div>
        <h1 class="display">${esc(S.hotel.name)}</h1>
        <div>${esc(S.hotel.address)}</div>
      </div>
    </section>
    <form class="card search" id="searchForm">
      <label class="field"><span>Заезд</span><input class="input" type="date" name="checkIn" min="${today()}" value="${search.checkIn}"></label>
      <label class="field"><span>Выезд</span><input class="input" type="date" name="checkOut" min="${addDays(today(), 1)}" value="${search.checkOut}"></label>
      <label class="field"><span>Гостей</span><select class="input" name="guests">${[1, 2, 3, 4, 5, 6].map(i => `<option ${i === search.guests ? 'selected' : ''}>${i}</option>`).join('')}</select></label>
      <button type="submit" class="btn btn-primary">Показать номера</button>
    </form>
    <div class="guest-grid">
      <div>
        <h2 class="display" style="font-size:34px;margin-bottom:4px">Номера</h2>
        <p class="muted" style="margin:0 0 18px">${fmtDate(search.checkIn)} — ${fmtDate(search.checkOut)} · ${n} ${plural(n, 'ночь', 'ночи', 'ночей')} · ${search.guests} ${plural(search.guests, 'гость', 'гостя', 'гостей')}</p>
        ${offers.map(o => offerCard(o, n)).join('') || '<div class="card empty">Отель ещё не добавил номера</div>'}
      </div>
      <aside class="card side">
        <h3 class="display">Об отеле</h3>
        <div><span class="muted">Заезд:</span> с ${esc(S.hotel.checkIn)}</div>
        <div><span class="muted">Выезд:</span> до ${esc(S.hotel.checkOut)}</div>
        <div><span class="muted">Отмена:</span> ${esc(S.hotel.cancellation)}</div>
        <div class="hint" style="margin:8px 0 0">Это демо: бронь не настоящая и хранится только в этом браузере.
          После брони откройте «Кабинет отеля» → «Бронирования».</div>
      </aside>
    </div>`;

  g.querySelector('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const checkIn = String(f.get('checkIn')), checkOut = String(f.get('checkOut'));
    if (!checkIn || !checkOut || checkOut <= checkIn) { toast('Дата выезда должна быть позже даты заезда'); return; }
    if (checkIn < today()) { toast('Дата заезда не может быть в прошлом'); return; }
    search = { checkIn, checkOut, guests: Number(f.get('guests')) };
    renderGuest();
  });
  g.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => bookForm(b.dataset.book)));
}

function offerCard({ r, q, ok, reason }, n) {
  const left = ok && q.minFree <= 3
    ? `<div class="left-note">Осталось ${q.minFree} ${plural(q.minFree, 'номер', 'номера', 'номеров')}</div>` : '';
  const right = ok
    ? `<div class="muted" style="font-size:13px">за ${n} ${plural(n, 'ночь', 'ночи', 'ночей')}</div>
       <div class="price">${rub(q.total)}</div>
       <div class="muted" style="font-size:12px;margin-bottom:8px">≈ ${rub(q.total / n)} за ночь</div>
       <button type="button" class="btn btn-gold" data-book="${r.id}">Забронировать</button>`
    : `<div class="muted">${reason}</div>`;
  return `
    <article class="card offer reveal ${ok ? '' : 'unavailable'}">
      <div class="photo" style="background:${PHOTOS[r.photo] || PHOTOS[0]}"></div>
      <div>
        <h3 class="display">${esc(r.name)}</h3>
        <div class="facts"><span>${r.area} м²</span><span>до ${r.guests} ${plural(r.guests, 'гостя', 'гостей', 'гостей')}</span><span>${esc(r.beds)}</span></div>
        <div style="font-size:13px;margin-top:6px">${r.amenities.slice(0, 5).map(esc).join(' · ')}</div>
        ${left}
      </div>
      <div class="total">${right}</div>
    </article>`;
}

function bookForm(roomId) {
  const r = room(roomId);
  const { checkIn, checkOut, guests } = search;
  const q = stayQuote(roomId, checkIn, checkOut);
  const m = openModal(`
    <div class="label">${fmtDate(checkIn)} — ${fmtDate(checkOut)} · ${q.nights} ${plural(q.nights, 'ночь', 'ночи', 'ночей')} · ${guests} ${plural(guests, 'гость', 'гостя', 'гостей')}</div>
    <h2 class="display">${esc(r.name)} — ${rub(q.total)}</h2>
    <p class="muted" style="margin:0">Оплата при заселении. ${esc(S.hotel.cancellation)}.</p>
    <form novalidate>
      <div class="grid-2">
        <label class="field"><span>Имя и фамилия</span><input class="input" name="name" autocomplete="name"></label>
        <label class="field"><span>Телефон</span><input class="input" name="phone" type="tel" autocomplete="tel" placeholder="+7"></label>
      </div>
      <label class="field"><span>Электронная почта</span><input class="input" name="email" type="email" autocomplete="email"></label>
      <label class="field"><span>Пожелания к отелю</span><textarea class="input" name="comment" rows="2" placeholder="Поздний заезд, детская кроватка…"></textarea></label>
      <label class="check"><input type="checkbox" name="consent">Согласен(на) на обработку персональных данных для оформления брони</label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Отмена</button>
        <button type="submit" class="btn btn-gold">Отправить бронь</button>
      </div>
    </form>`);

  m.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get('name')).trim();
    const phone = String(f.get('phone')).trim();
    const email = String(f.get('email')).trim();
    if (!name) { toast('Укажите имя'); return; }
    if (phone.replace(/\D/g, '').length < 10) { toast('Проверьте номер телефона'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Проверьте электронную почту'); return; }
    if (f.get('consent') !== 'on') { toast('Нужно согласие на обработку персональных данных'); return; }
    const fresh = stayQuote(roomId, checkIn, checkOut);
    if (fresh.closed || fresh.minFree === 0) { closeModal(); renderGuest(); toast('Пока вы заполняли форму, номера закончились'); return; }

    const b = {
      id: uid('b'), no: S.nextNo++, roomId, checkIn, checkOut, qty: 1, guests, name, phone, email,
      comment: String(f.get('comment')).trim(), status: 'new', total: fresh.total, createdAt: new Date().toISOString(),
    };
    S.bookings.push(b);
    save(); closeModal(); renderAll();

    toast(`<b>Бронь №${b.no} отправлена</b><br>Отель подтвердит её в ближайшее время`, {
      text: 'Открыть в кабинете отеля',
      run: () => { setView('extranet'); bookingFilter = 'all'; freshId = b.id; setTab('bookings'); },
    });
    if (S.notify.telegram || S.notify.email) {
      setTimeout(() => toast(`<b>Уведомление отелю${S.notify.telegram ? ' в Telegram' : ' на почту'}:</b><br>${esc(notifyText(b)).replace(/\n/g, '<br>')}`), 900);
    }
  });
}

init();
