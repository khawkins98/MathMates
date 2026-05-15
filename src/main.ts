import './style.css';
import { AudioManager } from '@/audio/AudioManager';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { GameLoop } from '@/core/GameLoop';
import { SceneManager } from '@/core/SceneManager';
import { RoughRenderer } from '@/rendering/RoughRenderer';
import { BriefingScene } from '@/scenes/BriefingScene';
import { CompleteScene } from '@/scenes/CompleteScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { GameScene } from '@/scenes/GameScene';
import { SelectScene } from '@/scenes/SelectScene';
import { TitleScene } from '@/scenes/TitleScene';
import { UIKitScene } from '@/scenes/UIKitScene';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const dpr = window.devicePixelRatio || 1;
canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;

function applyScale(): void {
  const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  let cssW: number;
  let cssH: number;
  if (winW / winH > aspect) {
    cssH = winH;
    cssW = Math.round(winH * aspect);
  } else {
    cssW = winW;
    cssH = Math.round(winW / aspect);
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
}
window.addEventListener('resize', applyScale);
applyScale();

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas 2D context not available');
}
// Scale all drawing commands to match the device pixel ratio so the canvas
// is sharp on HiDPI / Retina displays. All scene drawing uses logical
// CANVAS_WIDTH × CANVAS_HEIGHT coordinates — this scale is transparent to them.
ctx.scale(dpr, dpr);

async function startGame(): Promise<void> {
  await Promise.all([
    document.fonts.load("16px 'Fredoka One'"),
    document.fonts.load("16px 'Press Start 2P'"),
  ]).catch(() => { /* fonts may not be available offline — continue anyway */ });

  const manager = new SceneManager(canvas, ctx!);
  const rr = new RoughRenderer(ctx!);
  const audio = new AudioManager();

  manager.register('TITLE', new TitleScene(manager));
  manager.register('SELECT', new SelectScene(manager));
  manager.register('UIKIT', new UIKitScene(manager, rr));
  manager.register('BRIEFING', new BriefingScene(manager));
  manager.register('GAME', new GameScene(manager, rr, audio));
  manager.register('COMPLETE', new CompleteScene(manager));
  manager.register('GAME_OVER', new GameOverScene(manager));

  manager.goto('TITLE');

  const loop = new GameLoop((dt) => {
    manager.update(dt);
    ctx!.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    manager.draw();
  });
  loop.start();
}

startGame();
