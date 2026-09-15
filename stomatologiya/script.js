// ===== Мобильное меню =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

// Клик по пункту меню — закрываем его, чтобы не перекрывало страницу
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

// ===== Плавная прокрутка к якорям с поправкой на липкую шапку =====
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    const headerHeight = document.getElementById('header').offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;

    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ===== Карта: грузим Яндекс только по нажатию =====
// Пока посетитель сам не открыл карту, его данные не уходят стороннему сервису
document.querySelectorAll('.js-map').forEach((button) => {
  button.addEventListener('click', () => {
    const box = button.closest('.map');
    const frame = document.createElement('iframe');
    frame.src = box.dataset.src;
    frame.title = 'Карта: Казань, ул. Пушкина, 42';
    frame.setAttribute('allowfullscreen', '');
    box.appendChild(frame);
    box.classList.add('is-loaded');
  });
});

// ===== Проверка формы =====
const form = document.getElementById('form');
const success = document.getElementById('formSuccess');

function showError(input, message) {
  input.closest('.field').classList.add('has-error');
  form.querySelector(`[data-error-for="${input.id}"]`).textContent = message;
}

function clearError(input) {
  input.closest('.field').classList.remove('has-error');
  form.querySelector(`[data-error-for="${input.id}"]`).textContent = '';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = form.elements.name;
  const phone = form.elements.phone;
  const agree = form.elements.agree;
  let valid = true;

  [name, phone, agree].forEach(clearError);

  if (name.value.trim().length < 2) {
    showError(name, 'Напишите, как к вам обращаться');
    valid = false;
  }

  // Считаем только цифры: телефон могут ввести как угодно — со скобками, дефисами, пробелами
  const digits = phone.value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    showError(phone, 'Проверьте номер — нужно 10–11 цифр');
    valid = false;
  }

  // Согласие — только отмеченной галочкой, по умолчанию она пустая
  if (!agree.checked) {
    showError(agree, 'Без согласия мы не сможем перезвонить');
    valid = false;
  }

  if (!valid) {
    form.querySelector('.has-error input')?.focus();
    return;
  }

  // Здесь на боевом сайте заявка уходит на сервер или в Telegram
  form.reset();
  success.hidden = false;
  setTimeout(() => { success.hidden = true; }, 8000);
});

// Ошибка исчезает, как только человек начал исправлять поле
['name', 'phone'].forEach((id) => {
  form.elements[id].addEventListener('input', (event) => clearError(event.target));
});
form.elements.agree.addEventListener('change', (event) => clearError(event.target));
