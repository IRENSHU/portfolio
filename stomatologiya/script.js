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
  let valid = true;

  clearError(name);
  clearError(phone);

  if (name.value.trim().length < 2) {
    showError(name, 'Напишите, как к вам обращаться');
    valid = false;
  }

  // Считаем только цифры: телефон могут ввести как угодно — со скобками, дефисами, пробелами
  const digits = phone.value.replace(/\D/g, '');
  if (digits.length < 10) {
    showError(phone, 'Проверьте номер — не хватает цифр');
    valid = false;
  }

  if (!valid) return;

  // Здесь на боевом сайте заявка уходит на сервер или в Telegram
  form.reset();
  success.hidden = false;
  setTimeout(() => { success.hidden = true; }, 6000);
});

// Ошибка исчезает, как только человек начал исправлять поле
['name', 'phone'].forEach((id) => {
  form.elements[id].addEventListener('input', (event) => clearError(event.target));
});
