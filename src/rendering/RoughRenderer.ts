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
    this.rc.rectangle(cx - 12 * s, cy - 16 * s, 24 * s, 28 * s, {
      ...ROUGH_OPTIONS,
      fill: colour,
      fillStyle: 'solid',
      stroke: colour,
      seed,
    });
    this.rc.ellipse(cx, cy - 10 * s, 18 * s, 12 * s, {
      ...ROUGH_OPTIONS,
      fill: '#7ee8fa',
      fillStyle: 'solid',
      stroke: '#aaeeff',
      seed: seed + 1,
    });
    this.rc.line(cx - 6 * s, cy + 12 * s, cx - 8 * s, cy + 24 * s, {
      stroke: colour,
      strokeWidth: 3 * s,
      roughness: 1.2,
      seed: seed + 2,
    });
    this.rc.line(cx + 6 * s, cy + 12 * s, cx + 8 * s, cy + 24 * s, {
      stroke: colour,
      strokeWidth: 3 * s,
      roughness: 1.2,
      seed: seed + 3,
    });
  }

  get context(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
