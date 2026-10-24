<script setup lang="ts">
// Иллюстрация вместо фото: пиала с настоем цвета конкретного чая и листочек.
defineProps<{ color: string; size?: number }>();
</script>

<template>
  <svg :width="size ?? 120" :height="size ?? 120" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="100" rx="38" ry="7" fill="#000" opacity=".08" />
    <path d="M20 52h80c0 26-17 44-40 44S20 78 20 52z" fill="#fffdf9" stroke="#2a221c" stroke-width="3" stroke-linejoin="round" />
    <ellipse cx="60" cy="52" rx="40" ry="10" fill="#fffdf9" stroke="#2a221c" stroke-width="3" />
    <ellipse cx="60" cy="53" rx="33" ry="6.5" :fill="color" />
    <path d="M28 64c6 4 18 7 32 7" stroke="#2a221c" stroke-width="2" stroke-linecap="round" fill="none" opacity=".25" />
    <g class="steam" stroke="#2a221c" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".35">
      <path d="M48 36c-4-6 4-9 0-16" />
      <path d="M62 34c-4-6 4-9 0-16" />
      <path d="M76 36c-4-6 4-9 0-16" />
    </g>
    <path d="M86 22c10-6 22-2 24 6-10 6-22 3-24-6z" :fill="color" stroke="#2a221c" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M88 23c7 1 13 3 20 5" stroke="#2a221c" stroke-width="1.5" stroke-linecap="round" fill="none" />
  </svg>
</template>

<style scoped>
.steam path { animation: rise 2.4s ease-in-out infinite; }
.steam path:nth-child(2) { animation-delay: .4s; }
.steam path:nth-child(3) { animation-delay: .8s; }
@keyframes rise { 0%, 100% { transform: translateY(0); opacity: .9; } 50% { transform: translateY(-3px); opacity: .4; } }
</style>
