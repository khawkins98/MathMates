import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import { drawSpaceBackground, drawOutlinedText, makeStars, type Star } from '@/rendering/drawHelpers';

const EDGE_CREWMATES: Array<{ cx: number; cy: number; colour: string; seed: number; scale: number }> = [
  { cx: -8,  cy: 395, colour: COLOURS.AI_CREW_2,       seed: 7,  scale: 1.3 },
  { cx: 590, cy: 75,  colour: COLOURS.PLAYER_IMPOSTOR,  seed: 3,  scale: 1.1 },
  { cx: 580, cy: 340, colour: COLOURS.AI_CREW_1,        seed: 11, scale: 1.0 },
  { cx: 18,  cy: 260, colour: '#8a3cc8',                seed: 15, scale: 0.9 },
];

export class TitleScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private elapsed = 0;
  private stars: Star[];

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
    this.stars = makeStars(55);
  }

  enter(_params?: Record<string, unknown>): void {
    this.elapsed = 0;
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    let action = this.manager.input.shift();
    while (action) {
      if (action === 'eat' || action === 'confirm') {
        this.manager.goto('SELECT');
        return;
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsed, this.stars);

    for (const cm of EDGE_CREWMATES) {
      const bob = Math.sin(this.elapsed * 0.002 + cm.seed) * 6;
      const seed = Math.floor(this.elapsed / 450) + cm.seed;
      this.rr.crewmate(cm.cx, cm.cy + bob, cm.colour, seed, cm.scale);
    }

    drawOutlinedText(ctx, 'MathMates', CANVAS_WIDTH / 2, 108, 44, '#f0fafa', '#080c0c', 7);

    ctx.save();
    ctx.font = "22px 'Fredoka One', sans-serif";
    ctx.fillStyle = COLOURS.TEXT_TITLE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A maths adventure in space', CANVAS_WIDTH / 2, 158);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(this.elapsed * 0.003));
    ctx.font = "20px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press SPACE or ENTER to start', CANVAS_WIDTH / 2, 250);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arrow keys  •  Space to eat  •  S to mark sus', CANVAS_WIDTH / 2, 292);
    ctx.restore();
  }
}
