<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCatalog, type SortKey } from '../stores/catalog';
import type { TeaType } from '../types';
import TeaCard from '../components/TeaCard.vue';

const catalog = useCatalog();
const { type, query, maxPrice, inStockOnly, sort, filtered, status, types } = storeToRefs(catalog);
const route = useRoute();
const router = useRouter();

// Фильтры живут в адресной строке: ссылку с выбранными фильтрами можно отправить другу.
onMounted(() => {
  const q = route.query;
  if (typeof q.type === 'string') type.value = q.type as TeaType;
  if (typeof q.q === 'string') query.value = q.q;
  if (typeof q.max === 'string' && +q.max > 0) maxPrice.value = +q.max;
  if (q.stock === '1') inStockOnly.value = true;
  if (typeof q.sort === 'string') sort.value = q.sort as SortKey;
});
watch([type, query, maxPrice, inStockOnly, sort], () => {
  router.replace({
    query: {
      ...(type.value && { type: type.value }),
      ...(query.value.trim() && { q: query.value.trim() }),
      ...(maxPrice.value < 1300 && { max: String(maxPrice.value) }),
      ...(inStockOnly.value && { stock: '1' }),
      ...(sort.value !== 'popular' && { sort: sort.value }),
    },
  });
});
</script>

<template>
  <section class="hero wrap">
    <p class="kicker">Демо на Vue 3</p>
    <h1 class="serif">Чай, который хочется заварить ещё раз</h1>
    <p class="muted lead">Каталог грузится запросом к API, фильтры хранятся в Pinia и в адресной строке, корзина не пропадает при перезагрузке.</p>
  </section>

  <section class="wrap layout">
    <aside class="filters" aria-label="Фильтры">
      <label class="field">
        <span>Поиск</span>
        <input v-model="query" class="input" type="search" placeholder="Название, вкус, страна">
      </label>
      <div class="field">
        <span>Вид чая</span>
        <div class="chips">
          <button type="button" class="chip" :class="{ on: !type }" @click="type = ''">Все</button>
          <button v-for="t in types" :key="t" type="button" class="chip" :class="{ on: type === t }" @click="type = t">{{ t }}</button>
        </div>
      </div>
      <label class="field">
        <span>Цена до <b class="price">{{ maxPrice.toLocaleString('ru-RU') }} ₽</b> за 50 г</span>
        <input v-model.number="maxPrice" type="range" min="200" max="1300" step="50">
      </label>
      <label class="check"><input v-model="inStockOnly" type="checkbox"> Только в наличии</label>
      <label class="field">
        <span>Сортировка</span>
        <select v-model="sort" class="input">
          <option value="popular">Сначала с высоким рейтингом</option>
          <option value="cheap">Сначала дешевле</option>
          <option value="expensive">Сначала дороже</option>
          <option value="name">По названию</option>
        </select>
      </label>
      <button type="button" class="btn btn-ghost" @click="catalog.reset()">Сбросить фильтры</button>
    </aside>

    <div class="results">
      <div v-if="status === 'loading' || status === 'idle'" class="grid">
        <div v-for="n in 6" :key="n" class="skeleton" />
      </div>
      <div v-else-if="status === 'error'" class="empty">
        <p>Не удалось загрузить каталог. Проверьте интернет и обновите страницу.</p>
      </div>
      <template v-else>
        <p class="muted count" aria-live="polite">Найдено: {{ filtered.length }}</p>
        <TransitionGroup v-if="filtered.length" name="list" tag="div" class="grid">
          <TeaCard v-for="tea in filtered" :key="tea.id" :tea="tea" />
        </TransitionGroup>
        <div v-else class="empty">
          <p>Под такие фильтры чая нет.</p>
          <button type="button" class="btn btn-ghost" @click="catalog.reset()">Сбросить фильтры</button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.hero { padding: 48px 20px 28px; }
.kicker { font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
h1 { font-size: clamp(30px, 5vw, 50px); line-height: 1.1; margin: 10px 0 12px; max-width: 18ch; }
.lead { max-width: 60ch; }
.layout { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 28px; align-items: start; }
@media (max-width: 860px) { .layout { grid-template-columns: minmax(0, 1fr); } }
.filters { position: sticky; top: 84px; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
@media (max-width: 860px) { .filters { position: static; } }
.field { display: grid; gap: 8px; font-size: 14px; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
input[type=range] { width: 100%; accent-color: var(--accent); }
.check { display: flex; gap: 10px; align-items: center; font-weight: 600; font-size: 14px; cursor: pointer; }
.check input { width: 18px; height: 18px; accent-color: var(--accent); }
.results { position: relative; min-width: 0; }
.count { font-size: 14px; margin-bottom: 12px; }
.grid { position: relative; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); gap: 20px; }
.skeleton { height: 360px; border-radius: var(--radius); background: linear-gradient(100deg, #efe8dd 30%, #f8f3ea 50%, #efe8dd 70%); background-size: 300% 100%; animation: shimmer 1.3s infinite linear; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
.empty { background: var(--paper); border: 1px dashed var(--line); border-radius: var(--radius); padding: 40px; text-align: center; display: grid; gap: 14px; justify-items: center; }
</style>
