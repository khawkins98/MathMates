import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';

export class TitleScene implements Scene {
  private manager: SceneManager;
  private elapsed = 0;
  private bgImage: HTMLImageElement;
  private bgReady = false;

  constructor(manager: SceneManager, _rr: RoughRenderer) {
    this.manager = manager;
    this.bgImage = new Image();
    this.bgImage.onload = () => { this.bgReady = true; };
    this.bgImage.src = '/bg-title.jpg';
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
    // Background
    if (this.bgReady) {
      ctx.drawImage(this.bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#060e14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Dark gradient overlay — heavier at top (title area) and bottom (controls bar)
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

    // Title: MATHMATES
    this.drawOutlinedText(ctx, 'MATHMATES', CANVAS_WIDTH / 2, 68, 48, '#ffffff', '#061010', 9);

    // Subtitle
    this.drawOutlinedText(ctx, 'A MATHS ADVENTURE IN SPACE', CANVAS_WIDTH / 2, 114, 14, '#40d8c0', '#061010', 5);

    // "Press space" prompt — pulsing, with semi-transparent backing panel
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(this.elapsed * 0.0028));
    const promptY = CANVAS_HEIGHT * 0.56;
    ctx.save();
    ctx.globalAlpha = pulse * 0.88;
    ctx.fillStyle = 'rgba(0,6,12,0.6)';
    const pW = 380;
    const pH = 42;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect((CANVAS_WIDTH - pW) / 2, promptY - pH / 2, pW, pH, 8);
    } else {
      ctx.rect((CANVAS_WIDTH - pW) / 2, promptY - pH / 2, pW, pH);
    }
    ctx.fill();
    ctx.globalAlpha = pulse;
    this.drawOutlinedText(ctx, 'PRESS SPACE OR ENTER TO START', CANVAS_WIDTH / 2, promptY, 16, '#f0fafa', '#061010', 5);
    ctx.restore();

    // Bottom controls bar
    const barH = 36;
    const barY = CANVAS_HEIGHT - barH - 8;
    ctx.save();
    ctx.fillStyle = 'rgba(0,10,14,0.78)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(14, barY, CANVAS_WIDTH - 28, barH, 8);
    } else {
      ctx.rect(14, barY, CANVAS_WIDTH - 28, barH);
    }
    ctx.fill();
    ctx.strokeStyle = '#2a5050';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const barCy = barY + barH / 2;

    const segments: Array<[string, string]> = [
      ['ARROW KEYS', 'move'],
      ['SPACE', 'eat'],
      ['S', 'mark sus'],
    ];
    const segW = (CANVAS_WIDTH - 28) / segments.length;
    for (let i = 0; i < segments.length; i += 1) {
      const sx = 14 + segW * i + segW / 2;
      const [key, desc] = segments[i];
      const keyW = ctx.measureText(key).width;
      const gap = 6;
      const descW = ctx.measureText(desc).width;
      const totalW = keyW + gap + descW;
      ctx.fillStyle = '#f0d060';
      ctx.fillText(key, sx - totalW / 2 + keyW / 2, barCy);
      ctx.fillStyle = '#40d8c0';
      ctx.fillText(desc, sx - totalW / 2 + keyW + gap + descW / 2, barCy);
    }
    ctx.restore();
  }

  private drawOutlinedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
    strokeW: number,
  ): void {
    ctx.save();
    ctx.font = `bold ${size}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}
