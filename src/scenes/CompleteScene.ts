import { CANVAS_WIDTH } from '@/constants';
import type { SceneManager } from '@/core/SceneManager';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawSpaceBackground, drawButton, drawPanel, makeStars, type Star } from '@/rendering/drawHelpers';
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
  private result: CompleteSceneParams | null = null;
  private selectedButton = 0;
  private stars: Star[] = makeStars(50);
  private elapsed = 0;
  private rr: RoughRenderer;

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
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    let tap = this.manager.input.shiftTap();
    while (tap) {
      const { x, y } = tap;
      if (y >= 352 && y <= 400) {
        if (x >= 118 && x <= 288 && this.result?.nextMission) {
          this.manager.goto('BRIEFING', this.result.nextMission as unknown as Record<string, unknown>);
          return;
        }
        if (x >= 312 && x <= 482) {
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
    const panelFill = result?.mode === 'impostor' ? '#3a1020' : '#1a3828';

    drawSpaceBackground(ctx, this.elapsed, this.stars);

    drawPanel(ctx, 58, 36, 484, 298, panelFill, accent, 3);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 6;
    ctx.strokeText('Mission', CANVAS_WIDTH / 2, 76);
    ctx.strokeText('Complete!', CANVAS_WIDTH / 2, 108);
    ctx.fillStyle = accent;
    ctx.fillText('Mission', CANVAS_WIDTH / 2, 76);
    ctx.fillStyle = '#f0fafa';
    ctx.fillText('Complete!', CANVAS_WIDTH / 2, 108);

    ctx.font = "16px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(`${result?.stageTitle ?? ''}  •  ${result?.scenarioTitle ?? ''}`, CANVAS_WIDTH / 2, 140);

    // Badge stars: cleared / accurate / accurate with O2 to spare
    const earned = result?.badges ?? 1;
    for (let i = 0; i < 3; i += 1) {
      const sx = CANVAS_WIDTH / 2 + (i - 1) * 40;
      const sy = 168;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = i < earned ? COLOURS.GOLD : '#243838';
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let p = 0; p < 10; p += 1) {
        const r = p % 2 === 0 ? 14 : 6;
        const a = (Math.PI * p) / 5 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = "15px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#c8e8e0';
    ctx.fillText(`Score ${result?.score ?? 0}`, CANVAS_WIDTH / 2, 200);
    ctx.fillText(`Accuracy ${Math.round((result?.accuracy ?? 0) * 100)}%`, CANVAS_WIDTH / 2, 224);
    ctx.fillText(`Time ${(result ? result.timeMs / 1000 : 0).toFixed(1)}s`, CANVAS_WIDTH / 2, 248);
    if (result?.bonusAwarded) {
      ctx.fillStyle = COLOURS.GOLD;
      ctx.fillText('O2 to spare — bonus +50!', CANVAS_WIDTH / 2, 274);
    }
    ctx.restore();

    // Celebrating crew bouncing in the space below the stats
    const colours = result?.mode === 'impostor'
      ? [COLOURS.PLAYER_IMPOSTOR, COLOURS.AI_CREW_1, COLOURS.PLAYER_IMPOSTOR]
      : [COLOURS.PLAYER_CREW, COLOURS.AI_CREW_1, COLOURS.AI_CREW_2];
    for (let i = 0; i < colours.length; i += 1) {
      const hop = Math.abs(Math.sin(this.elapsed * 0.005 + i * 1.1)) * 8;
      this.rr.crewmate(CANVAS_WIDTH / 2 + (i - 1) * 56, 306 - hop, colours[i], i + 2, 0.62);
    }

    const nextEnabled = Boolean(result?.nextMission);
    if (!nextEnabled) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawButton(ctx, 118, 352, 170, 48, 'Next Mission', this.selectedButton === 0);
      ctx.restore();
    } else {
      drawButton(ctx, 118, 352, 170, 48, 'Next Mission', this.selectedButton === 0);
    }
    drawButton(ctx, 312, 352, 170, 48, 'Back to Select', this.selectedButton === 1);
  }
}
