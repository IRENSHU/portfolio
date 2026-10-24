<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Tea } from '../types';
import TeaArt from './TeaArt.vue';
import { useCart } from '../stores/cart';

const props = defineProps<{ tea: Tea }>();
const cart = useCart();
const grams = ref(props.tea.variants[0].grams);
const price = computed(() => props.tea.variants.find((v) => v.grams === grams.value)!.price);
const added = ref(false);

function add() {
  cart.add(props.tea.slug, grams.value);
  added.value = true;
  setTimeout(() => (added.value = false), 1200);
}
</script>

<template>
  <article class="card" :class="{ out: !tea.inStock }">
    <RouterLink :to="`/tea/${tea.slug}`" class="art" :style="{ '--tint': tea.color }" :aria-label="tea.name">
      <TeaArt :color="tea.color" />
      <span class="type">{{ tea.type }}</span>
      <span v-if="!tea.inStock" class="stock">нет в наличии</span>
    </RouterLink>
    <div class="body">
      <h3><RouterLink :to="`/tea/${tea.slug}`">{{ tea.name }}</RouterLink></h3>
      <p class="muted origin">{{ tea.origin }} · ★ {{ tea.rating.toFixed(1) }}</p>
      <p class="notes">{{ tea.notes.join(' · ') }}</p>
      <div class="sizes" role="radiogroup" :aria-label="`Фасовка: ${tea.name}`">
        <button v-for="v in tea.variants" :key="v.grams" type="button" class="chip" :class="{ on: v.grams === grams }"
          role="radio" :aria-checked="v.grams === grams" @click="grams = v.grams">{{ v.grams }} г</button>
      </div>
      <div class="buy">
        <span class="price">{{ price.toLocaleString('ru-RU') }} ₽</span>
        <button class="btn btn-primary" type="button" :disabled="!tea.inStock" @click="add">
          <Transition name="swap" mode="out-in"><span :key="String(added)">{{ added ? 'Добавлено ✓' : 'В корзину' }}</span></Transition>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column;
  transition: transform .3s var(--ease), box-shadow .3s var(--ease); }
.card:hover { transform: translateY(-4px); box-shadow: 0 18px 36px rgba(42,34,28,.1); }
.art { position: relative; display: grid; place-items: center; height: 170px; background: radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--tint) 22%, #fff), var(--bg)); }
.art svg { transition: transform .5s var(--ease); }
.card:hover .art svg { transform: scale(1.06) rotate(-2deg); }
.type { position: absolute; left: 14px; top: 14px; font-size: 12px; font-weight: 700; background: var(--paper); border-radius: 999px; padding: 4px 10px; }
.stock { position: absolute; right: 14px; top: 14px; font-size: 12px; font-weight: 700; color: #fff; background: var(--muted); border-radius: 999px; padding: 4px 10px; }
.out .art svg { filter: grayscale(.8); opacity: .7; }
.body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
h3 { font-size: 18px; line-height: 1.25; }
h3 a { text-decoration: none; }
h3 a:hover { color: var(--accent); }
.origin { font-size: 13px; }
.notes { font-size: 14px; color: var(--muted); font-style: italic; }
.sizes { display: flex; gap: 8px; margin-top: 6px; }
.buy { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 12px; }
.buy .price { font-size: 20px; }
.swap-enter-active, .swap-leave-active { transition: opacity .15s, transform .15s; }
.swap-enter-from { opacity: 0; transform: translateY(6px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
