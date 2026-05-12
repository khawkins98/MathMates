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

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Scale canvas CSS size to fill viewport, maintaining aspect ratio
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

// Ensure keyboard events reach the window listener
canvas.tabIndex = 0;
canvas.focus();
document.addEventListener('pointerdown', () => canvas.focus(), { passive: true });

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Canvas 2D context not available');
}

const manager = new SceneManager(canvas, ctx);
const rr = new RoughRenderer(ctx);
const audio = new AudioManager();

manager.register('TITLE', new TitleScene(manager, rr));
manager.register('SELECT', new SelectScene(manager, rr));
manager.register('BRIEFING', new BriefingScene(manager, rr));
manager.register('GAME', new GameScene(manager, rr, audio));
manager.register('COMPLETE', new CompleteScene(manager, rr));
manager.register('GAME_OVER', new GameOverScene(manager, rr));

manager.goto('TITLE');

const loop = new GameLoop((dt) => {
  manager.update(dt);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  manager.draw();
});
loop.start();
