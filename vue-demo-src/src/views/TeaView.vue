<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCatalog } from '../stores/catalog';
import { useCart } from '../stores/cart';
import TeaArt from '../components/TeaArt.vue';
import QtyStepper from '../components/QtyStepper.vue';

const props = defineProps<{ slug: string }>();
const catalog = useCatalog();
const cart = useCart();

const tea = computed(() => catalog.bySlug(props.slug));
const grams = ref(0);
const qty = ref(1);
const added = ref(false);

// при переходе между чаями сбрасываем выбор фасовки
watch(tea, (t) => { if (t) { grams.value = t.variants[0].grams; qty.value = 1; } }, { immediate: true });
watch(() => tea.value?.name, (n) => { if (n) document.title = `${n} — чайная лавка «Пиала»`; }, { immediate: true });

const price = computed(() => tea.value?.variants.find((v) => v.grams === grams.value)?.price ?? 0);
const similar = computed(() => (tea.value ? catalog.teas.filter((t) => t.type === tea.value!.type && t.slug !== tea.value!.slug).slice(0, 3) : []));

function add() {
  if (!tea.value) return;
  cart.add(tea.value.slug, grams.value, Math.max(1, qty.value));
  added.value = true;
  setTimeout(() => (added.value = false), 1500);
}
</script>

<template>
  <section class="wrap page">
    <RouterLink to="/" class="back">← Ко всему чаю</RouterLink>

    <div v-if="catalog.status !== 'ready'" class="muted">Загружаем…</div>
    <div v-else-if="!tea" class="muted">Такого чая нет. <RouterLink to="/">Вернуться в каталог</RouterLink></div>

    <template v-else>
      <div class="main">
        <div class="art" :style="{ '--tint': tea.color }"><TeaArt :color="tea.color" :size="240" /></div>
        <div class="info">
          <p class="kicker">{{ tea.type }} · {{ tea.origin }}</p>
          <h1 class="serif">{{ tea.name }}</h1>
          <p class="muted">★ {{ tea.rating.toFixed(1) }} · {{ tea.inStock ? 'в наличии' : 'нет в наличии' }}</p>
          <p class="desc">{{ tea.description }}</p>
          <ul class="notes"><li v-for="n in tea.notes" :key="n">{{ n }}</li></ul>
          <div class="brew">
            <div><b>{{ tea.brew.temp }}°</b><span>температура воды</span></div>
            <div><b>{{ tea.brew.time }}</b><span>время заваривания</span></div>
          </div>
          <div class="sizes" role="radiogroup" aria-label="Фасовка">
            <button v-for="v in tea.variants" :key="v.grams" type="button" class="chip" :class="{ on: v.grams === grams }"
              role="radio" :aria-checked="v.grams === grams" @click="grams = v.grams">{{ v.grams }} г — {{ v.price.toLocaleString('ru-RU') }} ₽</button>
          </div>
          <div class="buy">
            <QtyStepper v-model="qty" label="Количество" :min="1" />
            <span class="price total">{{ (price * Math.max(1, qty)).toLocaleString('ru-RU') }} ₽</span>
            <button class="btn btn-primary" type="button" :disabled="!tea.inStock" @click="add">
              {{ added ? 'Добавлено ✓' : tea.inStock ? 'В корзину' : 'Нет в наличии' }}
            </button>
          </div>
          <RouterLink v-if="added" to="/cart" class="go">Перейти в корзину →</RouterLink>
        </div>
      </div>

      <div v-if="similar.length" class="similar">
        <h2 class="serif">Похожий чай</h2>
        <div class="row">
          <RouterLink v-for="s in similar" :key="s.slug" :to="`/tea/${s.slug}`" class="mini">
            <TeaArt :color="s.color" :size="64" />
            <span><b>{{ s.name }}</b><small class="muted">от {{ catalog.minPrice(s).toLocaleString('ru-RU') }} ₽</small></span>
          </RouterLink>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.page { padding-top: 28px; }
.back { display: inline-block; margin-bottom: 18px; font-weight: 700; text-decoration: none; color: var(--accent); }
.main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 36px; align-items: start; }
@media (max-width: 820px) { .main { grid-template-columns: minmax(0, 1fr); } }
.art { display: grid; place-items: center; aspect-ratio: 1; max-height: 420px; border-radius: 24px; background: radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--tint) 25%, #fff), var(--paper)); border: 1px solid var(--line); }
.kicker { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
h1 { font-size: clamp(30px, 4.6vw, 46px); line-height: 1.1; margin: 8px 0; }
.desc { margin: 14px 0; font-size: 17px; }
.notes { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; }
.notes li { background: var(--paper); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; font-size: 14px; font-style: italic; }
.brew { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
.brew div { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
.brew b { display: block; font-size: 20px; }
.brew span { font-size: 13px; color: var(--muted); }
.sizes { display: flex; flex-wrap: wrap; gap: 8px; }
.buy { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 18px; }
.total { font-size: 24px; }
.go { display: inline-block; margin-top: 12px; font-weight: 700; color: var(--accent); }
.similar { margin-top: 48px; }
.similar h2 { font-size: 26px; margin-bottom: 14px; }
.row { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 14px; }
.mini { display: flex; align-items: center; gap: 12px; text-decoration: none; background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 10px 14px; transition: transform .25s var(--ease), box-shadow .25s var(--ease); }
.mini:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(42,34,28,.08); }
.mini b { display: block; }
.mini small { font-size: 13px; }
</style>
