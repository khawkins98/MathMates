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
