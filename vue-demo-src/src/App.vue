<script setup lang="ts">
import { onMounted } from 'vue';
import { useCatalog } from './stores/catalog';
import { useCart } from './stores/cart';

const catalog = useCatalog();
const cart = useCart();
onMounted(() => catalog.load());
</script>

<template>
  <header class="top">
    <div class="wrap bar">
      <RouterLink to="/" class="logo">
        <span class="cup" aria-hidden="true">🍵</span>
        <span><b class="serif">Пиала</b><small>чайная лавка</small></span>
      </RouterLink>
      <RouterLink to="/cart" class="cart-link" :aria-label="`Корзина, товаров: ${cart.count}`">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
        <span>Корзина</span>
        <Transition name="pop" mode="out-in"><b v-if="cart.count" :key="cart.count" class="badge">{{ cart.count }}</b></Transition>
      </RouterLink>
    </div>
  </header>

  <main>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
    </RouterView>
  </main>

  <footer class="wrap foot">
    Демо на Vue 3 (Composition API, Pinia, Vue Router, TypeScript, Vite). Заказы никуда не отправляются.
    Собрала <a href="../">Ирина Шушкова</a> · <a href="https://github.com/IRENSHU/portfolio/tree/main/vue-demo-src">исходный код</a>
  </footer>
</template>

<style scoped>
.top { position: sticky; top: 0; z-index: 10; background: rgba(247,243,236,.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.bar { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo .cup { font-size: 26px; }
.logo b { display: block; font-size: 21px; line-height: 1; }
.logo small { color: var(--muted); font-size: 12px; letter-spacing: .04em; }
.cart-link { position: relative; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 700; padding: 8px 14px; border-radius: 12px; transition: background-color .2s; }
.cart-link:hover, .cart-link.router-link-active { background: var(--paper); }
.badge { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: var(--warm); color: #fff; font-size: 12px; display: grid; place-items: center; }
.pop-enter-active { transition: transform .3s cubic-bezier(.3,1.6,.5,1); }
.pop-enter-from { transform: scale(.4); }
.foot { padding: 40px 20px 50px; color: var(--muted); font-size: 13px; }
.foot a { color: var(--accent); }
@media (max-width: 480px) { .cart-link span:not(.badge) { display: none; } }
</style>
