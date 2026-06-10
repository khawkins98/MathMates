import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // GitHub Pages serves the site from /MathMates/, not the domain root
  base: process.env.GITHUB_ACTIONS ? '/MathMates/' : '/',
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
});
