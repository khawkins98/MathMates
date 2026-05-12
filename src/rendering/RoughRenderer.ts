import rough from 'roughjs/bin/rough';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { ROUGH_OPTIONS } from '@/constants';

export class RoughRenderer {
  private rc: RoughCanvas;
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.rc = rough.canvas(ctx.canvas);
  }

  cell(x: number, y: number, w: number, h: number, fillColour: string, strokeColour: string, seed = 1): void {
    this.rc.rectangle(x, y, w, h, {
      ...ROUGH_OPTIONS,
      fill: fillColour,
      fillStyle: 'hachure',
      stroke: strokeColour,
      seed,
    });
  }

  circle(cx: number, cy: number, r: number, fillColour: string, strokeColour: string, seed = 1): void {
    this.rc.circle(cx, cy, r * 2, {
      ...ROUGH_OPTIONS,
      fill: fillColour,
      fillStyle: 'solid',
      stroke: strokeColour,
      seed,
    });
  }

  ellipse(cx: number, cy: number, w: number, h: number, fillColour: string, strokeColour: string, seed = 1): void {
    this.rc.ellipse(cx, cy, w, h, {
      ...ROUGH_OPTIONS,
      fill: fillColour,
      fillStyle: 'solid',
      stroke: strokeColour,
      seed,
    });
  }

  line(x1: number, y1: number, x2: number, y2: number, colour: string): void {
    this.rc.line(x1, y1, x2, y2, { ...ROUGH_OPTIONS, stroke: colour });
  }

  crewmate(cx: number, cy: number, colour: string, seed = 1, scale = 1): void {
    const s = scale;
    const OUTLINE = '#080c0c';

    // Body
    this.rc.rectangle(cx - 13 * s, cy - 14 * s, 22 * s, 28 * s, {
      fill: colour,
      fillStyle: 'solid',
      stroke: OUTLINE,
      strokeWidth: 3 * s,
      roughness: 0.4,
      seed,
    });

    // Backpack bump on right side
    this.rc.rectangle(cx + 7 * s, cy - 4 * s, 7 * s, 12 * s, {
      fill: colour,
      fillStyle: 'solid',
      stroke: OUTLINE,
      strokeWidth: 2 * s,
      roughness: 0.4,
      seed: seed + 10,
    });

    // Visor
    this.rc.ellipse(cx - 2 * s, cy - 7 * s, 18 * s, 11 * s, {
      fill: '#7ee8fa',
      fillStyle: 'solid',
      stroke: OUTLINE,
      strokeWidth: 2 * s,
      roughness: 0.3,
      seed: seed + 1,
    });

    // Visor highlight (plain canvas — crisp)
    this.ctx.save();
    this.ctx.fillStyle = '#d0f8ff';
    this.ctx.globalAlpha = 0.85;
    this.ctx.beginPath();
    this.ctx.arc(cx - 6 * s, cy - 9 * s, 2.5 * s, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Legs: draw outline line then colour line on top
    const legOpts = { roughness: 0.6 };
    this.rc.line(cx - 7 * s, cy + 14 * s, cx - 9 * s, cy + 24 * s, {
      ...legOpts, seed: seed + 2, stroke: OUTLINE, strokeWidth: 5 * s,
    });
    this.rc.line(cx + 7 * s, cy + 14 * s, cx + 9 * s, cy + 24 * s, {
      ...legOpts, seed: seed + 3, stroke: OUTLINE, strokeWidth: 5 * s,
    });
    this.rc.line(cx - 7 * s, cy + 14 * s, cx - 9 * s, cy + 24 * s, {
      ...legOpts, seed: seed + 2, stroke: colour, strokeWidth: 3 * s,
    });
    this.rc.line(cx + 7 * s, cy + 14 * s, cx + 9 * s, cy + 24 * s, {
      ...legOpts, seed: seed + 3, stroke: colour, strokeWidth: 3 * s,
    });
  }

  get context(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
