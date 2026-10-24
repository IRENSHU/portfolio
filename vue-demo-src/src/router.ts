import { createRouter, createWebHashHistory } from 'vue-router';
import CatalogView from './views/CatalogView.vue';

// Хеш-маршруты (#/tea/...) работают на GitHub Pages без настройки сервера.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'catalog', component: CatalogView },
    { path: '/tea/:slug', name: 'tea', component: () => import('./views/TeaView.vue'), props: true },
    { path: '/cart', name: 'cart', component: () => import('./views/CartView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: (to, _from, saved) => saved ?? (to.hash ? { el: to.hash } : { top: 0 }),
});

// заголовок вкладки; у страницы чая он свой — с названием чая
const TITLES: Record<string, string> = {
  catalog: 'Чайная лавка «Пиала» — демо на Vue 3 | Ирина Шушкова',
  cart: 'Корзина — чайная лавка «Пиала»',
};
router.afterEach((to) => {
  const title = TITLES[String(to.name)];
  if (title) document.title = title;
});
