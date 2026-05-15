import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { drawOutlinedText, drawControlsHintsBar } from '@/rendering/drawHelpers';

export class TitleScene implements Scene {
  private manager: SceneManager;
  private elapsed = 0;
  private bgImage: HTMLImageElement;
  private bgReady = false;
  private onBacktick: (e: KeyboardEvent) => void;

  constructor(manager: SceneManager, _rr: RoughRenderer) {
    this.manager = manager;
    this.bgImage = new Image();
    this.bgImage.onload = () => { this.bgReady = true; };
    this.bgImage.src = '/bg-title.jpg';
    this.onBacktick = (e: KeyboardEvent) => {
      if (e.code === 'Backquote') {
        e.preventDefault();
        this.manager.goto('UIKIT');
      }
    };
  }

  enter(_params?: Record<string, unknown>): void {
    this.elapsed = 0;
    this.manager.input.setEnabled(true);
    window.addEventListener('keydown', this.onBacktick);
  }

  exit(): void {
    window.removeEventListener('keydown', this.onBacktick);
  }

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
    // Background
    if (this.bgReady) {
      ctx.drawImage(this.bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060e14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Dark gradient overlays
    const topGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.45);
    topGrad.addColorStop(0, 'rgba(0,6,12,0.72)');
    topGrad.addColorStop(1, 'rgba(0,6,12,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.45);

    const btmGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.72, 0, CANVAS_HEIGHT);
    btmGrad.addColorStop(0, 'rgba(0,6,12,0)');
    btmGrad.addColorStop(1, 'rgba(0,6,12,0.85)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, CANVAS_HEIGHT * 0.72, CANVAS_WIDTH, CANVAS_HEIGHT * 0.28);

    // Title
    drawOutlinedText(ctx, 'MATHMATES', CANVAS_WIDTH / 2, 68, 48, '#ffffff', '#061010', 9);
    drawOutlinedText(ctx, 'A MATHS ADVENTURE IN SPACE', CANVAS_WIDTH / 2, 114, 14, '#40d8c0', '#061010', 5);

    // Pulsing start prompt
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(this.elapsed * 0.0028));
    const promptY = CANVAS_HEIGHT * 0.56;
    ctx.save();
    ctx.globalAlpha = pulse * 0.88;
    ctx.fillStyle = 'rgba(0,6,12,0.6)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect((CANVAS_WIDTH - 380) / 2, promptY - 21, 380, 42, 8);
    } else {
      ctx.fillRect((CANVAS_WIDTH - 380) / 2, promptY - 21, 380, 42);
    }
    ctx.fill();
    ctx.globalAlpha = pulse;
    drawOutlinedText(ctx, 'PRESS SPACE OR ENTER TO START', CANVAS_WIDTH / 2, promptY, 16, '#f0fafa', '#061010', 5);
    ctx.restore();

    drawControlsHintsBar(ctx, [
      ['ARROW KEYS', 'move'],
      ['SPACE', 'eat'],
      ['S', 'mark sus'],
    ]);
  }
}
