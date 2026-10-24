<script setup lang="ts">
const qty = defineModel<number>({ required: true });
const props = defineProps<{ label: string; min?: number }>();
</script>

<template>
  <div class="stepper" role="group" :aria-label="label">
    <button type="button" aria-label="Меньше" :disabled="qty <= (props.min ?? 0)" @click="qty = qty - 1">−</button>
    <span aria-live="polite">{{ qty }}</span>
    <button type="button" aria-label="Больше" :disabled="qty >= 20" @click="qty = qty + 1">+</button>
  </div>
</template>

<style scoped>
.stepper { display: inline-flex; align-items: center; border: 1.5px solid var(--line); border-radius: 12px; background: #fff; }
button { width: 36px; height: 36px; border: 0; background: none; font-size: 18px; font-weight: 700; cursor: pointer; border-radius: 10px; transition: background-color .2s; }
button:hover:not(:disabled) { background: var(--bg); }
button:disabled { opacity: .35; cursor: not-allowed; }
span { min-width: 28px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
</style>
