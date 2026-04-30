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
  //   filterSize: 2      → PixelateFilter post-pass, 2×2 blocks (community standard, subtle)
  //   filterSize: 4      → PixelateFilter post-pass, 4×4 blocks (chunky retro)
  //   pixelScale: 2      → renders at 260×190, upscaled 2× (true low-res render)
  //   integerScaling     → CSS scale snapped to whole multiples (perfect alignment)
  //   eightBitSteps: 6   → colour quantise to 216 colours (6 levels/channel)
  //   eightBitSteps: 4   → colour quantise to 64 colours (4 levels/channel, more dramatic)
  const display = new PixelDisplay(app, {
    logicalWidth: GAME_WIDTH,
    logicalHeight: GAME_HEIGHT,
    // filterSize: 2,
    // pixelScale: 2,   ← renders at half-res; fonts below fontSize:14 blur badly
    integerScaling: true,
    eightBitSteps: 6,
  });

  // Boot scene manager — pass display.gameContainer so scenes render through
  // the pixel display pipeline rather than directly onto app.stage.
  const sceneManager = new SceneManager(app, display.gameContainer);
  sceneManager.start();
}

init().catch(console.error);
