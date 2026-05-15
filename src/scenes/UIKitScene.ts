/**
 * UIKitScene — developer component viewer.
 *
 * Shows every shared UI primitive on one screen so visual regressions are
 * immediately obvious. Access from the title screen by pressing ` (backtick).
 * Press Esc / Z / Backspace to return to the title.
 *
 * This scene is never reachable from normal gameplay — it is registered in
 * main.ts only in development builds.
 */
import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import {
  drawSpaceBackground,
  makeStars,
  type Star,
  rrect,
  drawOutlinedText,
  drawControlsHintsBar,
  drawButton,
  drawPanel,
} from '@/rendering/drawHelpers';

export class UIKitScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private elapsed = 0;
  private stars: Star[];

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
    this.stars = makeStars(40);
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
      if (action === 'back' || action === 'pause') {
        this.manager.goto('TITLE');
        return;
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsed, this.stars);

    // ── Page title ─────────────────────────────────────────────────────────────
    drawOutlinedText(ctx, 'UI KIT', CANVAS_WIDTH / 2, 20, 14, '#40d8c0', '#061010', 5);

    // ── Column layout: left = typography, right = components ──────────────────
    const leftX = 16;
    const rightX = 308;
    const colW = 284;

    // Section header helper
    const sectionHeader = (label: string, x: number, y: number): void => {
      ctx.save();
      ctx.fillStyle = '#40d8c0';
      ctx.fillRect(x, y + 8, colW, 1);
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.fillStyle = '#40d8c0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, x, y + 6);
      ctx.restore();
    };

    // ── LEFT COLUMN: Typography ────────────────────────────────────────────────
    sectionHeader('TYPOGRAPHY', leftX, 36);

    // Press Start 2P scale
    let ty = 60;
    for (const [size, label] of [[20, 'P.S.2P 20px'], [14, 'P.S.2P 14px'], [10, 'P.S.2P 10px']] as [number, string][]) {
      drawOutlinedText(ctx, label, leftX + colW / 2, ty, size, '#f0fafa', '#061010', 4);
      ty += size + 18;
    }

    // Fredoka One scale
    ty += 4;
    sectionHeader('BODY FONTS', leftX, ty);
    ty += 16;
    for (const [size, colour] of [[18, '#f0fafa'], [14, '#7aa8a8'], [12, '#5a8888'], [10, COLOURS.SUCCESS]] as [number, string][]) {
      ctx.save();
      ctx.font = `${size}px 'Fredoka One', sans-serif`;
      ctx.fillStyle = colour;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Fredoka One ${size}px — ${colour}`, leftX, ty);
      ctx.restore();
      ty += size + 8;
    }

    // Colour swatches
    ty += 8;
    sectionHeader('COLOURS', leftX, ty);
    ty += 14;
    const swatches: Array<[string, string]> = [
      [COLOURS.PLAYER_CREW, 'CREW'],
      [COLOURS.PLAYER_IMPOSTOR, 'IMPOSTOR'],
      [COLOURS.SUCCESS, 'SUCCESS'],
      [COLOURS.GOLD, 'GOLD'],
      ['#40d8c0', 'TEAL'],
      ['#c8dcdc', 'TILE'],
      ['#10d8f0', 'SELECT'],
      ['#2a3c3c', 'BADGE'],
    ];
    const swSz = 18;
    const swGap = 4;
    for (let i = 0; i < swatches.length; i += 1) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = leftX + col * (swSz + 48 + swGap);
      const sy = ty + row * (swSz + swGap);
      ctx.save();
      rrect(ctx, sx, sy, swSz, swSz, 3);
      ctx.fillStyle = swatches[i][0];
      ctx.fill();
      ctx.strokeStyle = '#4a6060';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "9px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c0d4d4';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(swatches[i][1], sx + swSz + 4, sy + swSz / 2);
      ctx.restore();
    }

    // ── RIGHT COLUMN: Components ───────────────────────────────────────────────
    let ry = 36;

    sectionHeader('TILES', rightX, ry);
    ry += 14;

    // Normal stage tile
    this.drawMiniStageTile(ctx, rightX, ry, '🔢', 'Counting', 'Count to 10', false);
    ry += 56;
    // Selected stage tile
    this.drawMiniStageTile(ctx, rightX, ry, '➕', 'Adding', 'Add up to 20', true);
    ry += 62;

    sectionHeader('BUTTONS', rightX, ry);
    ry += 14;

    drawButton(ctx, rightX, ry, 120, 36, 'Normal', false, this.elapsed);
    drawButton(ctx, rightX + 130, ry, 120, 36, 'Selected', true, this.elapsed);
    ry += 48;

    sectionHeader('PANEL', rightX, ry);
    ry += 14;
    drawPanel(ctx, rightX, ry, colW, 48, '#1e3838', '#4a7070', 2);
    ctx.save();
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('drawPanel() — dark teal fill', rightX + colW / 2, ry + 24);
    ctx.restore();
    ry += 60;

    sectionHeader('CREWMATES', rightX, ry);
    ry += 16;
    const crewColours = [COLOURS.PLAYER_CREW, COLOURS.PLAYER_IMPOSTOR, COLOURS.AI_CREW_1, COLOURS.AI_CREW_2, '#8a3cc8'];
    for (let i = 0; i < crewColours.length; i += 1) {
      const bob = Math.sin(this.elapsed * 0.002 + i * 1.3) * 4;
      const seed = Math.floor(this.elapsed / 400) + i * 5;
      this.rr.crewmate(rightX + 24 + i * 54, ry + 20 + bob, crewColours[i], seed, 0.85);
    }

    // ── Controls bar ──────────────────────────────────────────────────────────
    drawControlsHintsBar(ctx, [
      ['`', 'open UIKit'],
      ['ESC / Z', 'back to title'],
    ]);
  }

  /** Renders a compact stage tile preview (same style as SelectScene). */
  private drawMiniStageTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    icon: string,
    title: string,
    description: string,
    selected: boolean,
  ): void {
    const w = 260;
    const h = 52;
    const r = 8;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rrect(ctx, x + 3, y + 4, w, h, r);
    ctx.fill();

    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    rrect(ctx, x, y, w, h, r);
    ctx.fill();

    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      rrect(ctx, x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 1.5;
      rrect(ctx, x, y, w, h, r);
      ctx.stroke();
    }

    const bSz = 36;
    const bX = x + 8;
    const bY = y + (h - bSz) / 2;
    ctx.fillStyle = '#2a3c3c';
    rrect(ctx, bX, bY, bSz, bSz, 5);
    ctx.fill();
    ctx.strokeStyle = '#4a6060';
    ctx.lineWidth = 1;
    rrect(ctx, bX, bY, bSz, bSz, 5);
    ctx.stroke();
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, bX + bSz / 2, bY + bSz / 2);

    const tX = x + 52;
    ctx.font = "bold 13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, tX, y + h / 2 - 8);
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    ctx.fillText(description, tX, y + h / 2 + 9);

    ctx.restore();
  }
}
