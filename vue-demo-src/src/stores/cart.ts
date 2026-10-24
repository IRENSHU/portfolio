import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { CartLine } from '../types';
import { useCatalog } from './catalog';

const KEY = 'piala-cart';
export const FREE_DELIVERY = 1500;
export const DELIVERY_PRICE = 250;

function restore(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

// Корзина живёт в Pinia и сохраняется в браузере — не пропадает при перезагрузке.
export const useCart = defineStore('cart', () => {
  const lines = ref<CartLine[]>(restore());
  const catalog = useCatalog();

  watch(lines, (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* приватный режим браузера — просто не сохраняем */
    }
  }, { deep: true });

  const detailed = computed(() =>
    lines.value
      .map((l) => {
        const tea = catalog.bySlug(l.slug);
        const variant = tea?.variants.find((v) => v.grams === l.grams);
        return tea && variant ? { ...l, tea, price: variant.price, sum: variant.price * l.qty } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  );

  const count = computed(() => lines.value.reduce((n, l) => n + l.qty, 0));
  const subtotal = computed(() => detailed.value.reduce((s, l) => s + l.sum, 0));
  const delivery = computed(() => (subtotal.value === 0 || subtotal.value >= FREE_DELIVERY ? 0 : DELIVERY_PRICE));
  const total = computed(() => subtotal.value + delivery.value);
  const toFree = computed(() => Math.max(0, FREE_DELIVERY - subtotal.value));

  function add(slug: string, grams: number, qty = 1) {
    const line = lines.value.find((l) => l.slug === slug && l.grams === grams);
    if (line) line.qty = Math.min(20, line.qty + qty);
    else lines.value.push({ slug, grams, qty });
  }
  function setQty(slug: string, grams: number, qty: number) {
    const line = lines.value.find((l) => l.slug === slug && l.grams === grams);
    if (!line) return;
    if (qty <= 0) remove(slug, grams);
    else line.qty = Math.min(20, qty);
  }
  function remove(slug: string, grams: number) {
    lines.value = lines.value.filter((l) => !(l.slug === slug && l.grams === grams));
  }
  function clear() {
    lines.value = [];
  }

  return { lines, detailed, count, subtotal, delivery, total, toFree, add, setQty, remove, clear };
});
