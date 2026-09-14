'use strict';

const panel = name => document.querySelector(`[data-panel="${name}"]`);
let calStart = null;
let bookingFilter = 'all';
let freshId = null;

function renderExtranet() {
  if (tab === 'rooms') renderRooms();
  if (tab === 'calendar') renderCalendar();
  if (tab === 'bookings') renderBookings();
  if (tab === 'notify') renderNotify();
}

/* =================== Номера =================== */
function renderRooms() {
  const total = S.rooms.reduce((s, r) => s + r.count, 0);
  const p = panel('rooms');
  p.innerHTML = `
    <div class="panel-bar">
      <div>
        <h2 class="display" style="font-size:32px">Категории номеров</h2>
        <div class="muted">${S.rooms.length} ${plural(S.rooms.length, 'категория', 'категории', 'категорий')} · ${total} ${plural(total, 'номер', 'номера', 'номеров')} в продаже</div>
      </div>
      <button type="button" class="btn btn-primary" data-add>+ Добавить категорию</button>
    </div>
    <div class="hint">Каждая категория заводится один раз: сколько таких номеров в отеле, базовая цена и удобства.
      Цены и закрытие продажи на конкретные даты — во вкладке «Цены и наличие».</div>
    <div class="rooms">${S.rooms.map(roomCard).join('') || '<div class="empty">Пока нет ни одной категории</div>'}</div>`;
  p.querySelector('[data-add]').addEventListener('click', () => roomForm());
  p.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => roomForm(room(b.dataset.edit))));
  p.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteRoom(b.dataset.del)));
}

function roomCard(r) {
  const more = r.amenities.length > 4 ? ` · ещё ${r.amenities.length - 4}` : '';
  return `
    <article class="card room-card reveal">
      <div class="photo" style="background:${PHOTOS[r.photo] || PHOTOS[0]}"></div>
      <div class="room-body">
        <h3 class="display">${esc(r.name)}</h3>
        <div class="facts"><span>${r.area} м²</span><span>до ${r.guests} ${plural(r.guests, 'гостя', 'гостей', 'гостей')}</span><span>${r.count} ${plural(r.count, 'номер', 'номера', 'номеров')}</span></div>
        <div class="muted" style="font-size:13px">${esc(r.beds)}</div>
        <div style="font-size:13px">${r.amenities.slice(0, 4).map(esc).join(' · ')}${more}</div>
        <div class="price">от ${rub(r.price)} <small>/ ночь</small></div>
        <div class="room-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${r.id}">Изменить</button>
          <button type="button" class="btn btn-danger btn-sm" data-del="${r.id}">Удалить</button>
        </div>
      </div>
    </article>`;
}

function roomForm(r) {
  const x = r || { name: '', area: 20, beds: '', guests: 2, count: 1, price: 3000, photo: 0, amenities: ['Wi-Fi'] };
  const m = openModal(`
    <div class="label">${r ? 'Изменение категории' : 'Новая категория'}</div>
    <h2 class="display">${r ? esc(r.name) : 'Добавить номер'}</h2>
    <form novalidate>
      <label class="field"><span>Название категории</span><input class="input" name="name" value="${esc(x.name)}" placeholder="Например, Стандарт с видом на парк" required></label>
      <div class="grid-2">
        <label class="field"><span>Площадь, м²</span><input class="input" name="area" type="number" min="1" value="${x.area}"></label>
        <label class="field"><span>Гостей в номере</span><input class="input" name="guests" type="number" min="1" max="10" value="${x.guests}"></label>
        <label class="field"><span>Сколько таких номеров</span><input class="input" name="count" type="number" min="1" value="${x.count}"></label>
        <label class="field"><span>Базовая цена за ночь, ₽</span><input class="input" name="price" type="number" min="0" step="10" value="${x.price}"></label>
      </div>
      <label class="field"><span>Кровати</span><input class="input" name="beds" value="${esc(x.beds)}" placeholder="Двуспальная кровать"></label>
      <div class="field"><span>Удобства</span>
        <div class="grid-2">${AMENITIES.map(a => `<label class="check"><input type="checkbox" name="am" value="${esc(a)}" ${x.amenities.includes(a) ? 'checked' : ''}>${esc(a)}</label>`).join('')}</div>
      </div>
      <div class="field"><span>Обложка (в демо — цвет вместо фото)</span>
        <div class="chips">${PHOTOS.map((g, i) => `<label class="chip ${i === x.photo ? 'active' : ''}" style="background:${g};width:44px;height:30px" title="Вариант ${i + 1}"><input type="radio" name="photo" value="${i}" ${i === x.photo ? 'checked' : ''} hidden></label>`).join('')}</div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Отмена</button>
        <button type="submit" class="btn btn-primary">${r ? 'Сохранить' : 'Добавить категорию'}</button>
      </div>
    </form>`);
  m.querySelectorAll('input[name="photo"]').forEach(inp => inp.addEventListener('change', () => {
    m.querySelectorAll('input[name="photo"]').forEach(o => o.parentElement.classList.toggle('active', o.checked));
  }));
  m.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const num = k => Number(f.get(k));
    const name = String(f.get('name')).trim();
    if (!name) { toast('Укажите название категории'); return; }
    if ([num('area'), num('guests'), num('count'), num('price')].some(v => !(v > 0))) { toast('Площадь, гости, количество и цена должны быть больше нуля'); return; }
    const data = {
      name, area: num('area'), guests: num('guests'), count: num('count'), price: num('price'),
      beds: String(f.get('beds')).trim(), amenities: f.getAll('am'), photo: num('photo') || 0,
    };
    if (r) Object.assign(r, data); else S.rooms.push({ id: uid('r'), ...data });
    save(); closeModal(); renderAll();
    toast(r ? `Категория <b>${esc(name)}</b> сохранена` : `Категория <b>${esc(name)}</b> добавлена и уже видна гостям`);
  });
}

function deleteRoom(id) {
  const r = room(id);
  const active = S.bookings.filter(b => b.roomId === id && b.status !== 'cancelled' && b.checkOut >= today()).length;
  if (active) { toast(`Нельзя удалить «${esc(r.name)}»: ${active} ${plural(active, 'активная бронь', 'активные брони', 'активных броней')}`); return; }
  const m = openModal(`
    <h2 class="display">Удалить «${esc(r.name)}»?</h2>
    <p class="muted">Категория пропадёт со страницы отеля, цены на даты тоже удалятся.</p>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Отмена</button><button type="button" class="btn btn-danger" data-yes>Удалить</button></div>`);
  m.querySelector('[data-yes]').addEventListener('click', () => {
    S.rooms = S.rooms.filter(x => x.id !== id);
    Object.keys(S.rates).forEach(k => { if (k.startsWith(`${id}|`)) delete S.rates[k]; });
    save(); closeModal(); renderAll(); toast('Категория удалена');
  });
}

/* =================== Цены и наличие =================== */
function renderCalendar() {
  if (!calStart) calStart = today();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(calStart, i));
  const p = panel('calendar');
  p.innerHTML = `
    <div class="panel-bar">
      <div>
        <h2 class="display" style="font-size:32px">Цены и наличие</h2>
        <div class="muted">${fmtDate(dates[0])} — ${fmtDate(dates[13])}</div>
      </div>
      <div class="chips">
        <button type="button" class="btn btn-ghost btn-sm" data-shift="-14">← Назад</button>
        <button type="button" class="btn btn-ghost btn-sm" data-shift="0">Сегодня</button>
        <button type="button" class="btn btn-ghost btn-sm" data-shift="14">Вперёд →</button>
        <button type="button" class="btn btn-primary btn-sm" data-bulk>Изменить на период</button>
      </div>
    </div>
    <div class="hint">В клетке — сколько номеров свободно и цена за ночь. Нажмите на клетку, чтобы поменять цену
      или закрыть продажу на день. Брони сразу уменьшают число свободных номеров.</div>
    <div class="card cal-scroll">
      <table class="cal">
        <thead><tr><th class="room-name">Категория</th>${dates.map(d => `<th class="${isWeekendNight(d) ? 'we' : ''}">${fmtDay(d)}<br>${fmtDate(d)}</th>`).join('')}</tr></thead>
        <tbody>${S.rooms.map(r => `<tr><th class="room-name">${esc(r.name)}<small>${r.count} ${plural(r.count, 'номер', 'номера', 'номеров')}</small></th>${dates.map(d => calCell(r, d)).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="legend">
      <span><i style="background:var(--paper)"></i>Есть свободные</span>
      <span><i style="background:var(--amber-bg)"></i>Осталось мало</span>
      <span><i style="background:var(--red-bg)"></i>Всё продано</span>
      <span><i style="background:repeating-linear-gradient(135deg,#E9E2D5 0 4px,#F1EBDF 4px 8px)"></i>Продажа закрыта</span>
    </div>`;
  p.querySelectorAll('[data-shift]').forEach(b => b.addEventListener('click', () => {
    const s = Number(b.dataset.shift);
    calStart = s === 0 ? today() : addDays(calStart, s);
    renderCalendar();
  }));
  p.querySelector('[data-bulk]').addEventListener('click', bulkEditor);
  p.querySelectorAll('.cell').forEach(c => c.addEventListener('click', () => dayEditor(c.dataset.room, c.dataset.date)));
}

function calCell(r, d) {
  const free = freeRooms(r.id, d);
  const closed = isClosed(r.id, d);
  const cls = closed ? 'closed' : free === 0 ? 'sold' : free <= Math.max(1, Math.ceil(r.count * 0.2)) ? 'low' : '';
  const top = closed ? 'Закрыто' : `${free} из ${r.count}`;
  return `<td><button type="button" class="cell ${cls}" data-room="${r.id}" data-date="${d}" aria-label="${esc(r.name)}, ${fmtDate(d)}: ${top}, ${rub(priceFor(r.id, d))}"><b>${top}</b><span>${rub(priceFor(r.id, d))}</span></button></td>`;
}

function setRate(roomId, date, patch) {
  const key = `${roomId}|${date}`;
  const next = { ...(S.rates[key] || {}), ...patch };
  if (next.price === undefined || next.price === room(roomId).price) delete next.price;
  if (!next.closed) delete next.closed;
  if (Object.keys(next).length) S.rates[key] = next; else delete S.rates[key];
}

function dayEditor(roomId, date) {
  const r = room(roomId);
  const m = openModal(`
    <div class="label">${fmtDay(date)}, ${fmtDate(date)}</div>
    <h2 class="display">${esc(r.name)}</h2>
    <p class="muted">Забронировано ${booked(roomId, date)} из ${r.count}, свободно ${freeRooms(roomId, date)}. Базовая цена — ${rub(r.price)}.</p>
    <form>
      <label class="field"><span>Цена за ночь на эту дату, ₽</span><input class="input" name="price" type="number" min="0" step="10" value="${priceFor(roomId, date)}"></label>
      <label class="check"><input type="checkbox" name="closed" ${isClosed(roomId, date) ? 'checked' : ''}>Закрыть продажу на эту дату (ремонт, мероприятие, свои гости)</label>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Отмена</button><button type="submit" class="btn btn-primary">Сохранить</button></div>
    </form>`);
  m.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const price = Number(f.get('price'));
    if (!(price > 0)) { toast('Цена должна быть больше нуля'); return; }
    setRate(roomId, date, { price, closed: f.get('closed') === 'on' });
    save(); closeModal(); renderCalendar();
    toast(`${esc(r.name)}, ${fmtDate(date)}: сохранено`);
  });
}

function bulkEditor() {
  const t = today();
  const m = openModal(`
    <div class="label">Массовое изменение</div>
    <h2 class="display">Цены и продажа на период</h2>
    <form>
      <label class="field"><span>Категория</span>
        <select class="input" name="room"><option value="all">Все категории</option>${S.rooms.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label>
      <div class="grid-2">
        <label class="field"><span>С даты</span><input class="input" type="date" name="from" value="${t}"></label>
        <label class="field"><span>По дату (включительно)</span><input class="input" type="date" name="to" value="${addDays(t, 6)}"></label>
      </div>
      <div class="field"><span>Дни недели</span>
        <div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(i => `<label class="check"><input type="checkbox" name="wd" value="${i}" checked>${DAYS[i]}</label>`).join('')}</div>
      </div>
      <div class="grid-2">
        <label class="field"><span>Новая цена, ₽</span><input class="input" type="number" name="price" min="0" step="10" placeholder="Не менять"></label>
        <label class="field"><span>Продажа</span>
          <select class="input" name="sale"><option value="keep">Не менять</option><option value="open">Открыть</option><option value="close">Закрыть</option></select></label>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Отмена</button><button type="submit" class="btn btn-primary">Применить</button></div>
    </form>`);
  m.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const from = String(f.get('from')), to = String(f.get('to'));
    const wd = f.getAll('wd').map(Number);
    const price = f.get('price') ? Number(f.get('price')) : null;
    const sale = f.get('sale');
    if (!from || !to || to < from) { toast('Проверьте даты: «по» не раньше «с»'); return; }
    if (price !== null && !(price > 0)) { toast('Цена должна быть больше нуля'); return; }
    if (price === null && sale === 'keep') { toast('Укажите новую цену или измените продажу'); return; }
    const rooms = f.get('room') === 'all' ? S.rooms : [room(f.get('room'))];
    let days = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if (!wd.includes(parse(d).getDay())) continue;
      days++;
      rooms.forEach(r => {
        const patch = {};
        if (price !== null) patch.price = price;
        if (sale !== 'keep') patch.closed = sale === 'close';
        setRate(r.id, d, patch);
      });
    }
    save(); closeModal(); calStart = from; renderCalendar();
    toast(`Обновлено: ${days} ${plural(days, 'день', 'дня', 'дней')} × ${rooms.length} ${plural(rooms.length, 'категория', 'категории', 'категорий')}`);
  });
}

/* =================== Бронирования =================== */
function renderBookings() {
  const all = S.bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = s => all.filter(b => s === 'all' || b.status === s).length;
  const list = all.filter(b => bookingFilter === 'all' || b.status === bookingFilter);
  const filters = [['all', 'Все'], ['new', 'Новые'], ['confirmed', 'Подтверждённые'], ['cancelled', 'Отменённые']];
  const p = panel('bookings');
  p.innerHTML = `
    <div class="panel-bar">
      <div>
        <h2 class="display" style="font-size:32px">Бронирования</h2>
        <div class="muted">Новую бронь нужно подтвердить или отклонить — гость получит ответ на почту</div>
      </div>
      <div class="chips">${filters.map(([k, t]) => `<button type="button" class="chip ${k === bookingFilter ? 'active' : ''}" data-filter="${k}">${t} · ${count(k)}</button>`).join('')}</div>
    </div>
    <div class="card table-wrap">
      ${list.length ? `<table class="table">
        <thead><tr><th>№</th><th>Гость</th><th>Категория</th><th>Даты</th><th>Гостей</th><th>Сумма</th><th>Статус</th><th></th></tr></thead>
        <tbody>${list.map(bookingRow).join('')}</tbody>
      </table>` : '<div class="empty">Броней с таким статусом нет</div>'}
    </div>`;
  p.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { bookingFilter = b.dataset.filter; renderBookings(); }));
  p.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => bookingAction(b.dataset.id, b.dataset.act)));
  freshId = null;
}

function bookingRow(b) {
  const r = room(b.roomId);
  const n = nightsBetween(b.checkIn, b.checkOut);
  const st = STATUS[b.status];
  const actions = b.status === 'new'
    ? `<button type="button" class="btn btn-ok btn-sm" data-act="confirm" data-id="${b.id}">Подтвердить</button><button type="button" class="btn btn-danger btn-sm" data-act="decline" data-id="${b.id}">Отклонить</button>`
    : b.status === 'confirmed' ? `<button type="button" class="btn btn-ghost btn-sm" data-act="cancel" data-id="${b.id}">Отменить</button>` : '';
  return `<tr class="${b.id === freshId ? 'fresh' : ''}">
    <td>${b.no}</td>
    <td><button type="button" class="link-btn" style="color:var(--ink);font-size:14px;padding:0;text-align:left" data-act="details" data-id="${b.id}">${esc(b.name)}</button>${b.comment ? `<div class="muted" style="font-size:12px">${esc(b.comment)}</div>` : ''}</td>
    <td>${r ? esc(r.name) : 'Удалённая категория'}${b.qty > 1 ? ` × ${b.qty}` : ''}</td>
    <td style="white-space:nowrap">${fmtDate(b.checkIn)} — ${fmtDate(b.checkOut)}<div class="muted" style="font-size:12px">${n} ${plural(n, 'ночь', 'ночи', 'ночей')}</div></td>
    <td>${b.guests}</td>
    <td style="white-space:nowrap">${rub(b.total)}</td>
    <td><span class="status ${st.cls}">${st.text}</span></td>
    <td><div class="row-actions">${actions}</div></td>
  </tr>`;
}

function bookingAction(id, act) {
  const b = S.bookings.find(x => x.id === id);
  if (act === 'details') {
    const r = room(b.roomId);
    openModal(`
      <div class="label">Бронь №${b.no} · ${STATUS[b.status].text}</div>
      <h2 class="display">${esc(b.name)}</h2>
      <div class="preview">${esc(`Категория: ${r ? r.name : 'удалена'}${b.qty > 1 ? ` × ${b.qty}` : ''}
Заезд: ${fmtDate(b.checkIn)}, с ${S.hotel.checkIn}
Выезд: ${fmtDate(b.checkOut)}, до ${S.hotel.checkOut}
Гостей: ${b.guests}
Сумма: ${rub(b.total)}
Телефон: ${b.phone}
Почта: ${b.email}
Пожелания: ${b.comment || '—'}
Создана: ${new Date(b.createdAt).toLocaleString('ru-RU')}`)}</div>
      <div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Закрыть</button></div>`);
    return;
  }
  b.status = act === 'confirm' ? 'confirmed' : 'cancelled';
  save(); renderAll();
  toast(act === 'confirm'
    ? `Бронь №${b.no} подтверждена. Гостю уходит письмо <span class="muted">(в демо не отправляется)</span>`
    : `Бронь №${b.no} ${act === 'decline' ? 'отклонена' : 'отменена'}, номера снова в продаже`);
}

/* =================== Уведомления =================== */
function notifyText(b) {
  const r = room(b.roomId);
  const n = nightsBetween(b.checkIn, b.checkOut);
  return `🔔 Новая бронь №${b.no}
${S.hotel.name}
${r ? r.name : 'Категория удалена'}${b.qty > 1 ? ` × ${b.qty}` : ''}
${fmtDate(b.checkIn)} — ${fmtDate(b.checkOut)} (${n} ${plural(n, 'ночь', 'ночи', 'ночей')}), гостей: ${b.guests}
Сумма: ${rub(b.total)}
Гость: ${b.name}, ${b.phone}
Подтвердите бронь в кабинете отеля`;
}

function renderNotify() {
  const last = S.bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const p = panel('notify');
  p.innerHTML = `
    <div class="panel-bar"><div>
      <h2 class="display" style="font-size:32px">Уведомления о бронях</h2>
      <div class="muted">Отель узнаёт о новой брони сразу, а не когда зайдёт в кабинет</div>
    </div></div>
    <div class="notify">
      <form class="card">
        <label class="check"><input type="checkbox" name="email" ${S.notify.email ? 'checked' : ''}>Письмо на почту</label>
        <input class="input" name="emailAddr" type="email" value="${esc(S.notify.emailAddr)}" placeholder="bron@hotel.ru">
        <label class="check"><input type="checkbox" name="telegram" ${S.notify.telegram ? 'checked' : ''}>Сообщение в Telegram</label>
        <input class="input" name="tg" value="${esc(S.notify.tg)}" placeholder="@hotel_bron">
        <div class="muted" style="font-size:13px">В демо сообщения никуда не отправляются — показываем, как они будут выглядеть.</div>
        <div class="modal-actions" style="justify-content:flex-start">
          <button type="submit" class="btn btn-primary">Сохранить</button>
          <button type="button" class="btn btn-ghost" data-test ${last ? '' : 'disabled'}>Тестовое уведомление</button>
        </div>
      </form>
      <div class="card">
        <div class="label">Так выглядит сообщение</div>
        <div class="preview">${last ? esc(notifyText(last)) : 'Появится после первой брони'}</div>
      </div>
    </div>`;
  const form = p.querySelector('form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    S.notify = { email: f.get('email') === 'on', emailAddr: String(f.get('emailAddr')).trim(), telegram: f.get('telegram') === 'on', tg: String(f.get('tg')).trim() };
    save(); toast('Настройки уведомлений сохранены');
  });
  const test = p.querySelector('[data-test]');
  if (last) test.addEventListener('click', () => toast(esc(notifyText(last)).replace(/\n/g, '<br>')));
}
