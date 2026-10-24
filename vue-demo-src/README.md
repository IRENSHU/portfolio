# Чайная лавка «Пиала» — демо на Vue 3

Живое демо: https://irenshu.github.io/portfolio/vue-chay/

Что внутри:
- **Vue 3, Composition API** (`<script setup>`), **TypeScript**, сборка **Vite**;
- **Pinia**: каталог (загрузка, фильтры, сортировка) и корзина (сохраняется в `localStorage`);
- **Vue Router**: каталог, страница товара, корзина; хеш-маршруты для GitHub Pages;
- данные грузятся `fetch` из `public/data/teas.json` — как с REST API, с состояниями «загрузка» и «ошибка»;
- фильтры синхронизируются с адресной строкой — ссылку с фильтрами можно отправить;
- анимации переходов (`<Transition>`, `<TransitionGroup>`), уважение к `prefers-reduced-motion`.

Запуск: `npm install`, `npm run dev`; сборка в `../vue-chay`: `npm run build`.
