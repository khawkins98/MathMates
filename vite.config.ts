import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: process.env.GITHUB_ACTIONS ? '/MathMates/' : '/',
  build: {
    target: 'es2022',
  },
});
