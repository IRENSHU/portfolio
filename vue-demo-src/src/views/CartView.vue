<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useCart, FREE_DELIVERY } from '../stores/cart';
import { useCatalog } from '../stores/catalog';
import TeaArt from '../components/TeaArt.vue';
import QtyStepper from '../components/QtyStepper.vue';

const cart = useCart();
const catalog = useCatalog();

const form = reactive({ name: '', phone: '', address: '', consent: false });
const touched = ref(false);
const done = ref<{ number: number; total: number } | null>(null);

const errors = computed(() => ({
  name: form.name.trim().length < 2 ? 'Напишите, как к вам обращаться' : '',
  phone: !/^\d{10,11}$/.test(form.phone.replace(/\D/g, '')) ? 'Нужен номер из 10–11 цифр' : '',
  address: form.address.trim().length < 5 ? 'Укажите адрес доставки' : '',
  consent: !form.consent ? 'Без согласия мы не сможем обработать заказ' : '',
}));
const valid = computed(() => Object.values(errors.value).every((e) => !e));
const progress = computed(() => Math.min(100, Math.round((cart.subtotal / FREE_DELIVERY) * 100)));

function submit() {
  touched.value = true;
  if (!valid.value || !cart.count) return;
  // демо: заказ никуда не отправляется — на настоящем сайте здесь запрос к API
  done.value = { number: Math.floor(1000 + Math.random() * 9000), total: cart.total };
  cart.clear();
}
</script>

<template>
  <section class="wrap page">
    <h1 class="serif">Корзина</h1>

    <div v-if="done" class="done">
      <TeaArt color="#2f6b4f" :size="90" />
      <h2 class="serif">Заказ №{{ done.number }} оформлен</h2>
      <p class="muted">Сумма {{ done.total.toLocaleString('ru-RU') }} ₽. Это демо — заказ никуда не отправлен, а корзина очищена.</p>
      <RouterLink to="/" class="btn btn-primary">Вернуться в каталог</RouterLink>
    </div>

    <div v-else-if="catalog.status !== 'ready'" class="muted">Загружаем…</div>

    <div v-else-if="!cart.detailed.length" class="empty">
      <p>Корзина пока пустая.</p>
      <RouterLink to="/" class="btn btn-primary">Выбрать чай</RouterLink>
    </div>

    <div v-else class="layout">
      <div>
        <div class="free" :class="{ ok: !cart.toFree }">
          <p v-if="cart.toFree">До бесплатной доставки — <b class="price">{{ cart.toFree.toLocaleString('ru-RU') }} ₽</b></p>
          <p v-else><b>Доставка бесплатная</b> 🎉</p>
          <div class="bar"><span :style="{ width: progress + '%' }" /></div>
        </div>

        <TransitionGroup name="list" tag="ul" class="lines">
          <li v-for="l in cart.detailed" :key="l.slug + l.grams" class="line">
            <RouterLink :to="`/tea/${l.slug}`" class="thumb"><TeaArt :color="l.tea.color" :size="64" /></RouterLink>
            <div class="what">
              <RouterLink :to="`/tea/${l.slug}`"><b>{{ l.tea.name }}</b></RouterLink>
              <span class="muted">{{ l.grams }} г · {{ l.price.toLocaleString('ru-RU') }} ₽</span>
            </div>
            <QtyStepper :model-value="l.qty" :label="`Количество: ${l.tea.name}`" @update:model-value="(q) => cart.setQty(l.slug, l.grams, q)" />
            <span class="price sum">{{ l.sum.toLocaleString('ru-RU') }} ₽</span>
            <button type="button" class="del" :aria-label="`Убрать ${l.tea.name}`" @click="cart.remove(l.slug, l.grams)">×</button>
          </li>
        </TransitionGroup>
      </div>

      <form class="order" novalidate @submit.prevent="submit">
        <h2 class="serif">Оформление</h2>
        <label class="field" :class="{ err: touched && errors.name }">
          <span>Имя</span>
          <input v-model="form.name" class="input" autocomplete="name">
          <small v-if="touched && errors.name">{{ errors.name }}</small>
        </label>
        <label class="field" :class="{ err: touched && errors.phone }">
          <span>Телефон</span>
          <input v-model="form.phone" class="input" type="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__">
          <small v-if="touched && errors.phone">{{ errors.phone }}</small>
        </label>
        <label class="field" :class="{ err: touched && errors.address }">
          <span>Адрес доставки</span>
          <input v-model="form.address" class="input" autocomplete="street-address">
          <small v-if="touched && errors.address">{{ errors.address }}</small>
        </label>
        <label class="check" :class="{ err: touched && errors.consent }">
          <input v-model="form.consent" type="checkbox">
          <span>Согласен на обработку персональных данных для оформления заказа</span>
        </label>
        <dl class="sums">
          <div><dt>Товары</dt><dd class="price">{{ cart.subtotal.toLocaleString('ru-RU') }} ₽</dd></div>
          <div><dt>Доставка</dt><dd class="price">{{ cart.delivery ? cart.delivery + ' ₽' : 'бесплатно' }}</dd></div>
          <div class="grand"><dt>Итого</dt><dd class="price">{{ cart.total.toLocaleString('ru-RU') }} ₽</dd></div>
        </dl>
        <button class="btn btn-primary" type="submit">Оформить заказ</button>
        <p class="muted hint">Это демо: данные никуда не отправляются.</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.page { padding-top: 32px; }
h1 { font-size: clamp(30px, 4.6vw, 44px); margin-bottom: 20px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start; }
@media (max-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr); } }
.free { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; margin-bottom: 16px; }
.bar { height: 8px; background: var(--bg); border-radius: 999px; margin-top: 8px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--warm); border-radius: 999px; transition: width .5s var(--ease); }
.free.ok .bar span { background: var(--accent); }
.lines { position: relative; list-style: none; display: grid; gap: 12px; }
.line { display: grid; grid-template-columns: 64px 1fr auto auto 32px; gap: 14px; align-items: center; background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 10px 14px; width: 100%; }
@media (max-width: 560px) { .line { grid-template-columns: 56px 1fr 32px; } .line .sum { grid-column: 2; } .line .stepper { grid-column: 2; } }
.what { display: grid; min-width: 0; }
.what a { text-decoration: none; }
.sum { min-width: 80px; text-align: right; }
.del { width: 32px; height: 32px; border: 0; border-radius: 10px; background: none; font-size: 22px; cursor: pointer; color: var(--muted); transition: background-color .2s, color .2s; }
.del:hover { background: #f3e3e3; color: var(--err); }
.order { position: sticky; top: 84px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 22px; display: grid; gap: 14px; }
@media (max-width: 900px) { .order { position: static; } }
.order h2 { font-size: 24px; }
.field { display: grid; gap: 6px; font-size: 14px; font-weight: 600; }
.field small, .check.err span { color: var(--err); font-weight: 600; }
.field.err .input { border-color: var(--err); animation: shake .35s; }
@keyframes shake { 25%, 75% { transform: translateX(-5px); } 50% { transform: translateX(5px); } }
.check { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; cursor: pointer; }
.check input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--accent); flex: none; }
.sums { display: grid; gap: 6px; border-top: 1px dashed var(--line); padding-top: 12px; }
.sums div { display: flex; justify-content: space-between; }
.sums dd { font-weight: 700; }
.grand { font-size: 20px; }
.hint { font-size: 12px; text-align: center; }
.empty, .done { background: var(--paper); border: 1px dashed var(--line); border-radius: var(--radius); padding: 40px; display: grid; gap: 14px; justify-items: center; text-align: center; }
.done h2 { font-size: 28px; }
</style>
