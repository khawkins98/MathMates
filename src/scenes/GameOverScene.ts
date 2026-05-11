import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import type { SceneManager } from '@/core/SceneManager';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
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
  private rr: RoughRenderer;
  private result: GameOverSceneParams | null = null;
  private selectedButton = 0;

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
  }

  enter(params?: Record<string, unknown>): void {
    if (!isGameOverParams(params)) {
      this.manager.goto('SELECT');
      return;
    }
    this.result = params;
    this.selectedButton = 0;
  }

  exit(): void {}

  update(_dt: number): void {
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
        case 'confirm':
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
    ctx.fillStyle = COLOURS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.rr.cell(70, 64, 460, 246, '#421826', COLOURS.DANGER, 401);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 54px 'Caveat', cursive`;
    ctx.fillText('Mission Failed', CANVAS_WIDTH / 2, 106);

    ctx.font = `bold 22px 'Nunito', sans-serif`;
    ctx.fillText(`${this.result?.stageTitle ?? ''} • ${this.result?.scenarioTitle ?? ''}`, CANVAS_WIDTH / 2, 154);

    ctx.font = `18px 'Nunito', sans-serif`;
    ctx.fillStyle = '#ffd7df';
    ctx.fillText(`Final score ${this.result?.score ?? 0}`, CANVAS_WIDTH / 2, 196);
    ctx.fillText(
      this.result?.mode === 'impostor' ? 'Too many correct answers were eaten.' : 'The impostor wore you out.',
      CANVAS_WIDTH / 2,
      226,
    );
    ctx.fillText('Try again, or head back to the stage map.', CANVAS_WIDTH / 2, 254);
    ctx.restore();

    this.drawButton(ctx, 126, 338, 150, 48, 'Try Again', this.selectedButton === 0);
    this.drawButton(ctx, 324, 338, 150, 48, 'Select Stage', this.selectedButton === 1);
  }

  private drawButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    selected: boolean,
  ): void {
    this.rr.cell(x, y, width, height, '#1a2e48', selected ? '#ffffff' : '#9db4d6', x + y + 20);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 18px 'Nunito', sans-serif`;
    ctx.fillText(label, x + width / 2, y + height / 2);
    ctx.restore();
  }
}
