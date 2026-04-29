import { Application, CanvasRendererTextSystem, CanvasTextPipe, CanvasTextSystem, extensions } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/constants';
import { SceneManager } from '@/core/SceneManager';
import { PixelDisplay } from '@/core/PixelDisplay';

// PixiJS v8 registers render-pipe extensions via module-level side effects in
// scene/text/init.mjs, which is only imported by Text.mjs.  In a production
// Vite build, Text.mjs lands in a dynamic scene chunk that loads *after*
// app.init() — too late for the renderer's _addPipes() snapshot.  Registering
// here forces them into the static bundle so they are queued before the
// WebGL/WebGPU renderer calls handleByNamedList() during initialisation.
extensions.add(CanvasRendererTextSystem, CanvasTextSystem, CanvasTextPipe);

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

  // PixelDisplay handles viewport CSS scaling and optionally routes rendering
  // through a low-res RenderTexture for a chunky-pixel look.
  //
  // Tuning options (uncomment to activate):
  //   pixelScale: 2      → renders at 260×190, upscaled 2× (2×2 pixel blocks)
  //   integerScaling     → CSS scale snapped to whole multiples (perfect alignment)
  const display = new PixelDisplay(app, {
    logicalWidth: GAME_WIDTH,
    logicalHeight: GAME_HEIGHT,
    // pixelScale: 2,
    // integerScaling: true,
  });

  // Boot scene manager — pass display.gameContainer so scenes render through
  // the pixel display pipeline rather than directly onto app.stage.
  const sceneManager = new SceneManager(app, display.gameContainer);
  sceneManager.start();
}

init().catch(console.error);
