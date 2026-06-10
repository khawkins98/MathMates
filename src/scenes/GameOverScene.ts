import { CANVAS_WIDTH } from '@/constants';
import type { SceneManager } from '@/core/SceneManager';
import { COLOURS } from '@/rendering/colours';
import { drawSpaceBackground, drawButton, drawPanel, makeStars, type Star } from '@/rendering/drawHelpers';
import type { Scene } from '@/types';
import type { GameOverSceneParams } from './sceneParams';

function isGameOverParams(value: unknown): value is GameOverSceneParams {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<GameOverSceneParams>;
  return typeof candidate.score === 'number'
    && typeof candidate.stageTitle === 'string'
    && typeof candidate.scenarioTitle === 'string';
}

export class GameOverScene implements Scene {
  private manager: SceneManager;
  private result: GameOverSceneParams | null = null;
  private selectedButton = 0;
  private stars: Star[] = makeStars(50);
  private elapsed = 0;

  constructor(manager: SceneManager) {
    this.manager = manager;
  }

  enter(params?: Record<string, unknown>): void {
    if (!isGameOverParams(params)) {
      this.manager.goto('SELECT');
      return;
    }
    this.result = params;
    this.selectedButton = 0;
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    let tap = this.manager.input.shiftTap();
    while (tap) {
      const { x, y } = tap;
      if (y >= 338 && y <= 386) {
        if (x >= 126 && x <= 276 && this.result) {
          this.manager.goto('BRIEFING', this.result.retryMission as unknown as Record<string, unknown>);
          return;
        }
        if (x >= 324 && x <= 474) {
          this.manager.goto('SELECT');
          return;
        }
      }
      tap = this.manager.input.shiftTap();
    }
    let action = this.manager.input.shift();
    while (action) {
      switch (action) {
        case 'left':
        case 'up':
          this.selectedButton = 0;
          break;
        case 'right':
        case 'down':
          this.selectedButton = 1;
          break;
        case 'back':
        case 'pause':
          this.manager.goto('SELECT');
          return;
        case 'eat':
          if (this.selectedButton === 0 && this.result) {
            this.manager.goto('BRIEFING', this.result.retryMission as unknown as Record<string, unknown>);
            return;
          }
          this.manager.goto('SELECT');
          return;
        default:
          break;
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsed, this.stars);

    drawPanel(ctx, 70, 56, 460, 258, '#3a1020', COLOURS.DANGER, 3);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.font = "28px 'Press Start 2P', monospace";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 6;
    ctx.strokeText('Mission Failed', CANVAS_WIDTH / 2, 100);
    ctx.fillStyle = COLOURS.DANGER;
    ctx.fillText('Mission Failed', CANVAS_WIDTH / 2, 100);

    ctx.font = "16px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(`${this.result?.stageTitle ?? ''}  •  ${this.result?.scenarioTitle ?? ''}`, CANVAS_WIDTH / 2, 148);

    ctx.font = "15px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#ffd0d8';
    ctx.fillText(`Final score ${this.result?.score ?? 0}`, CANVAS_WIDTH / 2, 186);
    const failLine = this.result?.reason === 'caught'
      ? 'The crew spotted you — sneakier next time!'
      : this.result?.mode === 'impostor'
        ? 'Too many correct answers were eaten.'
        : this.result?.reason === 'impostor'
          ? 'The impostor wore you out.'
          : 'Those sums were tricky — check each one carefully!';
    ctx.fillText(failLine, CANVAS_WIDTH / 2, 214);
    ctx.fillText('Try again, or head back to the stage map.', CANVAS_WIDTH / 2, 242);
    ctx.restore();

    drawButton(ctx, 126, 338, 150, 48, 'Try Again', this.selectedButton === 0);
    drawButton(ctx, 324, 338, 150, 48, 'Select Stage', this.selectedButton === 1);
  }
}
