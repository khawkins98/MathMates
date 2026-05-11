import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import type { SceneManager } from '@/core/SceneManager';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import type { Scene } from '@/types';
import type { CompleteSceneParams } from './sceneParams';

function isCompleteParams(value: unknown): value is CompleteSceneParams {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<CompleteSceneParams>;
  return typeof candidate.score === 'number'
    && typeof candidate.stageTitle === 'string'
    && typeof candidate.scenarioTitle === 'string';
}

export class CompleteScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private result: CompleteSceneParams | null = null;
  private selectedButton = 0;

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
  }

  enter(params?: Record<string, unknown>): void {
    if (!isCompleteParams(params)) {
      this.manager.goto('SELECT');
      return;
    }
    this.result = params;
    this.selectedButton = params.nextMission ? 0 : 1;
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
          if (this.selectedButton === 0 && this.result?.nextMission) {
            this.manager.goto('BRIEFING', this.result.nextMission as unknown as Record<string, unknown>);
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
    const result = this.result;
    const accent = result?.mode === 'impostor' ? COLOURS.DANGER : COLOURS.SUCCESS;
    const panelFill = result?.mode === 'impostor' ? '#421826' : '#14344b';

    ctx.fillStyle = COLOURS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.rr.cell(58, 42, 484, 290, panelFill, accent, 311);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 54px 'Caveat', cursive`;
    ctx.fillText('Mission Complete!', CANVAS_WIDTH / 2, 86);

    ctx.font = `bold 22px 'Nunito', sans-serif`;
    ctx.fillText(`${result?.stageTitle ?? ''} • ${result?.scenarioTitle ?? ''}`, CANVAS_WIDTH / 2, 130);

    ctx.font = `18px 'Nunito', sans-serif`;
    ctx.fillStyle = '#d9e5ff';
    ctx.fillText(`Score ${result?.score ?? 0}`, CANVAS_WIDTH / 2, 170);
    ctx.fillText(`Accuracy ${Math.round((result?.accuracy ?? 0) * 100)}%`, CANVAS_WIDTH / 2, 198);
    ctx.fillText(`Time ${(result ? result.timeMs / 1000 : 0).toFixed(1)}s`, CANVAS_WIDTH / 2, 226);
    ctx.fillText(`Lives left ${result?.lives ?? 0}`, CANVAS_WIDTH / 2, 254);
    if (result?.bonusAwarded) {
      ctx.fillStyle = COLOURS.GOLD;
      ctx.fillText('⭐ Par time bonus +50!', CANVAS_WIDTH / 2, 282);
    }
    if (result?.impostorUnlockedNow) {
      ctx.fillStyle = '#ffd6d6';
      ctx.fillText('Impostor mode unlocked for this stage!', CANVAS_WIDTH / 2, 308);
    } else if (result?.nextCrewStageUnlocked) {
      ctx.fillStyle = '#d6f9d6';
      ctx.fillText('A new crew stage is now unlocked!', CANVAS_WIDTH / 2, 308);
    }
    ctx.restore();

    this.drawButton(ctx, 118, 352, 170, 48, 'Next Mission', this.selectedButton === 0, Boolean(result?.nextMission));
    this.drawButton(ctx, 312, 352, 170, 48, 'Back to Select', this.selectedButton === 1, true);
  }

  private drawButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    selected: boolean,
    enabled: boolean,
  ): void {
    this.rr.cell(x, y, width, height, enabled ? '#1a2e48' : '#253040', selected ? '#ffffff' : '#9db4d6', x + y);
    if (!enabled) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(x, y, width, height);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 18px 'Nunito', sans-serif`;
    ctx.fillText(label, x + width / 2, y + height / 2);
    ctx.restore();
  }
}
