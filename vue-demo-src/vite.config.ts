import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Собранное демо лежит в портфолио на GitHub Pages: относительные пути
// и хеш-маршруты, чтобы страницы открывались без настройки сервера.
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: { outDir: '../vue-chay', emptyOutDir: true },
});
