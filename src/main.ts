import { Application } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/constants';
import { SceneManager } from '@/core/SceneManager';

async function init() {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.DEEP_SPACE,
    antialias: false,
    roundPixels: true,
    resolution: 1,
  });

  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Missing #app element in document');
  }
  container.appendChild(app.canvas);

  // Ensure crisp pixel rendering when CSS-scaled
  app.canvas.style.imageRendering = 'pixelated';

  // Viewport scaling with letterboxing
  function resize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const scale = Math.min(windowW / GAME_WIDTH, windowH / GAME_HEIGHT);
    const scaledW = Math.floor(GAME_WIDTH * scale);
    const scaledH = Math.floor(GAME_HEIGHT * scale);
    app.canvas.style.width = `${scaledW}px`;
    app.canvas.style.height = `${scaledH}px`;
  }

  window.addEventListener('resize', resize);
  resize();

  // Boot scene manager
  const sceneManager = new SceneManager(app);
  sceneManager.start();
}

init().catch(console.error);
