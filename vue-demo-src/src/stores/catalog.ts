import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Tea, TeaType } from '../types';

export type SortKey = 'popular' | 'cheap' | 'expensive' | 'name';

// Каталог грузится запросом, как с настоящего сервера (REST API),
// поэтому у него есть состояния «загрузка» и «ошибка».
export const useCatalog = defineStore('catalog', () => {
  const teas = ref<Tea[]>([]);
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const type = ref<TeaType | ''>('');
  const query = ref('');
  const maxPrice = ref(1300);
  const inStockOnly = ref(false);
  const sort = ref<SortKey>('popular');

  async function load() {
    if (status.value === 'ready' || status.value === 'loading') return;
    status.value = 'loading';
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/teas.json`);
      if (!res.ok) throw new Error(String(res.status));
      teas.value = await res.json();
      status.value = 'ready';
    } catch {
      status.value = 'error';
    }
  }

  const types = computed(() => [...new Set(teas.value.map((t) => t.type))]);
  const minPrice = (t: Tea) => Math.min(...t.variants.map((v) => v.price));

  const filtered = computed(() => {
    // «мед» находит «мёд»: е и ё не различаем
    const norm = (x: string) => x.toLowerCase().replace(/ё/g, 'е');
    const q = norm(query.value.trim());
    const list = teas.value.filter(
      (t) =>
        (!type.value || t.type === type.value) &&
        (!inStockOnly.value || t.inStock) &&
        minPrice(t) <= maxPrice.value &&
        (!q || norm(`${t.name} ${t.type} ${t.origin} ${t.notes.join(' ')}`).includes(q)),
    );
    const by: Record<SortKey, (a: Tea, b: Tea) => number> = {
      popular: (a, b) => b.rating - a.rating,
      cheap: (a, b) => minPrice(a) - minPrice(b),
      expensive: (a, b) => minPrice(b) - minPrice(a),
      name: (a, b) => a.name.localeCompare(b.name, 'ru'),
    };
    return [...list].sort(by[sort.value]);
  });

  function reset() {
    type.value = '';
    query.value = '';
    maxPrice.value = 1300;
    inStockOnly.value = false;
    sort.value = 'popular';
  }

  const bySlug = (slug: string) => teas.value.find((t) => t.slug === slug);

  return { teas, status, type, query, maxPrice, inStockOnly, sort, types, filtered, load, reset, bySlug, minPrice };
});
