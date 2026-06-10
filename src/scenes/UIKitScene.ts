/**
 * UIKitScene — developer component viewer.
 *
 * Shows every shared UI primitive on one screen so visual regressions are
 * immediately obvious. Access from the title screen by pressing ` (backtick).
 * Press Esc / Z / Backspace to return to the title.
 *
 * This scene is never reachable from normal gameplay — main.ts registers it
 * (and TitleScene listens for backtick) only when import.meta.env.DEV is true,
 * so it is excluded from production builds.
 */
import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants';
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

// Fixed column layout constants
const LX = 20;   // left column origin x
const LW = 270;  // left column width
const RX = 314;  // right column origin x
const RW = 270;  // right column width

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
    this.drawTerminalFrame(ctx);
    this.drawTitlePill(ctx);

    // Left column — fixed y positions derived from section content heights
    this.drawTypographySection(ctx, 44);
    this.drawBodyFontsSection(ctx, 162);
    this.drawColoursSection(ctx, 278);

    // Right column
    this.drawTilesSection(ctx, 44);
    this.drawButtonsSection(ctx, 176);
    this.drawPanelSection(ctx, 240);
    this.drawCrewmatesSection(ctx, 310);

    drawControlsHintsBar(ctx, [
      ['`', 'open UIKit'],
      ['ESC / Z', 'back to title'],
    ]);
  }

  // ── Frame & Title ──────────────────────────────────────────────────────────

  private drawTerminalFrame(ctx: CanvasRenderingContext2D): void {
    const pad = 6;
    const W = CANVAS_WIDTH - pad * 2;
    const H = CANVAS_HEIGHT - pad * 2;
    ctx.save();
    rrect(ctx, pad, pad, W, H, 12);
    ctx.fillStyle = 'rgba(8,20,20,0.72)';
    ctx.fill();
    ctx.strokeStyle = '#4a7070';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Inner highlight ring
    rrect(ctx, pad + 3, pad + 3, W - 6, H - 6, 10);
    ctx.strokeStyle = 'rgba(74,112,112,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawTitlePill(ctx: CanvasRenderingContext2D): void {
    const w = 148, h = 26;
    const x = (CANVAS_WIDTH - w) / 2, y = 8;
    ctx.save();
    rrect(ctx, x, y, w, h, 13);
    ctx.fillStyle = '#0d1e1e';
    ctx.fill();
    ctx.strokeStyle = '#40d8c0';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawOutlinedText(ctx, 'UI  KIT', CANVAS_WIDTH / 2, y + h / 2 + 1, 11, '#40d8c0', '#061010', 4);
    ctx.restore();
  }

  // ── Section helper ─────────────────────────────────────────────────────────

  private sectionHeader(ctx: CanvasRenderingContext2D, label: string, x: number, y: number): void {
    ctx.save();
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillStyle = '#40d8c0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y);
    ctx.restore();
  }

  // ── LEFT COLUMN ────────────────────────────────────────────────────────────

  /** TYPOGRAPHY — 3 PS2P font-size panels. Occupies y=44–160. */
  private drawTypographySection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'TYPOGRAPHY', LX, sy + 10);
    const panels: Array<[number, string]> = [
      [20, 'P.S.2P'],
      [14, 'P.S.2P  14px'],
      [10, 'P.S.2P  10px'],
    ];
    const panelH = [34, 28, 24] as const;
    let y = sy + 16;
    for (let i = 0; i < panels.length; i++) {
      const [size, label] = panels[i];
      const ph = panelH[i];
      ctx.save();
      rrect(ctx, LX, y, LW, ph, 5);
      ctx.fillStyle = '#0d1e1e';
      ctx.fill();
      ctx.strokeStyle = '#2a4848';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = `${size}px 'Press Start 2P', monospace`;
      ctx.fillStyle = '#f0fafa';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, LX + 8, y + ph / 2);
      // Character sample on the right of the first panel only
      if (i === 0) {
        ctx.font = "7px 'Press Start 2P', monospace";
        ctx.fillStyle = '#7aa8a8';
        ctx.textAlign = 'right';
        ctx.fillText('ABCDEFGHIJKLMNOPZ', LX + LW - 6, y + ph / 2 - 8);
        ctx.fillText('nopqrstuvwxyz', LX + LW - 6, y + ph / 2);
        ctx.fillText('0123456789', LX + LW - 6, y + ph / 2 + 8);
      }
      ctx.restore();
      y += ph + 4;
    }
  }

  /** BODY FONTS — 4 Fredoka One rows. Occupies y=162–276. */
  private drawBodyFontsSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'BODY  FONTS', LX, sy + 10);
    let y = sy + 18;

    // First row: white-ish panel for primary text
    const ph = 26;
    ctx.save();
    rrect(ctx, LX, y, LW, ph, 5);
    ctx.fillStyle = '#e8f0f0';
    ctx.fill();
    ctx.strokeStyle = '#2a4848';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = "bold 18px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Fredoka One 18px - #f0fafa', LX + 8, y + ph / 2);
    ctx.restore();
    y += ph + 6;

    // Remaining rows
    const rows: Array<[number, string, string]> = [
      [14, '#7aa8a8', 'Fredoka One 14px - #7aa8a8'],
      [12, '#5aa888', 'Fredoka One 12px - #5aa888'],
      [10, COLOURS.SUCCESS, 'Fredoka One 10px - #50e858'],
    ];
    const sideLabels = ['14px (#7aa8a8)', '', '10px (#50e858)'];

    for (let i = 0; i < rows.length; i++) {
      const [size, colour, text] = rows[i];
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.font = `${size}px 'Fredoka One', sans-serif`;
      ctx.fillStyle = colour;
      ctx.textAlign = 'left';
      ctx.fillText(text, LX + 4, y);
      if (sideLabels[i]) {
        ctx.textAlign = 'right';
        ctx.fillText(sideLabels[i], LX + LW - 4, y);
      }
      ctx.restore();
      y += size + 8;
    }
  }

  /** COLOURS — named swatches + text-colour swatches. Occupies y=278+. */
  private drawColoursSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'COLOURS', LX, sy + 10);
    const y = sy + 18;

    // Named swatches — 3 columns, 3 rows
    const named: Array<[string, string]> = [
      [COLOURS.PLAYER_CREW, 'CREW'],
      [COLOURS.PLAYER_IMPOSTOR, 'IMPOSTOR'],
      [COLOURS.SUCCESS, 'SUCCESS'],
      [COLOURS.GOLD, 'GOLD'],
      ['#40d8c0', 'TEAL'],
      ['#c8dcdc', 'TILE'],
      ['#10d8f0', 'SELECT'],
      ['#2a3c3c', 'BADGE'],
    ];
    const colX = [LX, LX + 88, LX + 176];
    const swSz = 18, rowH = 22;
    for (let i = 0; i < named.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = colX[col], sy2 = y + row * rowH;
      ctx.save();
      rrect(ctx, sx, sy2, swSz, swSz, 3);
      ctx.fillStyle = named[i][0];
      ctx.fill();
      ctx.strokeStyle = '#4a6060';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "9px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c0d4d4';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(named[i][1], sx + swSz + 3, sy2 + swSz / 2);
      ctx.restore();
    }

    // Text colour swatches — 4 in one row below named grid
    const hexSwatches: Array<[string, string]> = [
      ['#f0fafa', '#f0fafa'],
      ['#7aa8a8', '#7aa8a8'],
      ['#7a8888', '#7a8888'],
      ['#50e858', '#50e858'],
    ];
    const hsy = y + 3 * rowH + 6;
    const hswW = 56, hswH = 22;
    for (let i = 0; i < hexSwatches.length; i++) {
      const hx = LX + i * (hswW + 6);
      ctx.save();
      rrect(ctx, hx, hsy, hswW, hswH, 4);
      ctx.fillStyle = hexSwatches[i][0];
      ctx.fill();
      ctx.strokeStyle = '#3a5050';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "8px 'Fredoka One', sans-serif";
      ctx.fillStyle = hexSwatches[i][0] === '#f0fafa' ? '#0a1a1a' : '#f0fafa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hexSwatches[i][1], hx + hswW / 2, hsy + hswH / 2);
      ctx.restore();
    }
  }

  // ── RIGHT COLUMN ───────────────────────────────────────────────────────────

  /** TILES — normal + selected. Occupies y=44–174. */
  private drawTilesSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'TILES', RX, sy + 10);
    this.drawStageTile(ctx, RX, sy + 18, '1234', 'Counting', 'Count to 10', false);
    this.drawStageTile(ctx, RX, sy + 76, '+', 'Adding', 'Add up to 20', true);
  }

  /** BUTTONS — normal + selected side by side. Occupies y=176–238. */
  private drawButtonsSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'BUTTONS', RX, sy + 10);
    const btnW = (RW - 8) / 2, btnH = 34;
    drawButton(ctx, RX, sy + 18, btnW, btnH, 'Normal', false);
    drawButton(ctx, RX + btnW + 8, sy + 18, btnW, btnH, 'Selected', true);
  }

  /** PANEL — drawPanel sample. Occupies y=240–308. */
  private drawPanelSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'PANEL', RX, sy + 10);
    drawPanel(ctx, RX, sy + 18, RW, 42, '#1e3838', '#4a7070', 2);
    ctx.save();
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('drawPanel() - dark teal fill', RX + RW / 2, sy + 18 + 21);
    ctx.restore();
  }

  /** CREWMATES — 5 crewmates with labels on a floor. Occupies y=310–388. */
  private drawCrewmatesSection(ctx: CanvasRenderingContext2D, sy: number): void {
    this.sectionHeader(ctx, 'CREWMATES', RX, sy + 10);
    const crewmates: Array<[string, string]> = [
      [COLOURS.PLAYER_CREW, 'Teal_Mate'],
      [COLOURS.PLAYER_IMPOSTOR, 'Red_Mate'],
      [COLOURS.AI_CREW_1, 'Gold_Mate'],
      [COLOURS.AI_CREW_2, 'Green'],
      ['#8a3cc8', 'Purple_Mate'],
    ];

    // Floor line
    const floorY = sy + 72;
    ctx.save();
    ctx.strokeStyle = '#3a5858';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RX, floorY);
    ctx.lineTo(RX + RW, floorY);
    ctx.stroke();
    // Subtle floor grid
    ctx.strokeStyle = '#2a4040';
    ctx.lineWidth = 1;
    for (let lx = RX; lx < RX + RW; lx += 22) {
      ctx.beginPath();
      ctx.moveTo(lx, floorY);
      ctx.lineTo(lx + 11, floorY + 10);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < crewmates.length; i++) {
      const [colour, name] = crewmates[i];
      const cx = RX + 28 + i * 52;
      const bob = Math.sin(this.elapsed * 0.002 + i * 1.3) * 3;
      const seed = Math.floor(this.elapsed / 400) + i * 5;

      // Name label with dark shadow for legibility
      ctx.save();
      ctx.font = "9px 'Fredoka One', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#f0fafa';
      ctx.fillText(name, cx, sy + 22);
      ctx.restore();

      this.rr.crewmate(cx, floorY - 12 + bob, colour, seed, 0.7);
    }
  }

  // ── Tile component (mirrors SelectScene style) ─────────────────────────────

  private drawStageTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    badgeContent: string,
    title: string,
    description: string,
    selected: boolean,
  ): void {
    const w = RW, h = 52, r = 8;

    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rrect(ctx, x + 3, y + 4, w, h, r);
    ctx.fill();

    // Tile fill
    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    rrect(ctx, x, y, w, h, r);
    ctx.fill();

    // Border / glow
    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2.5;
      rrect(ctx, x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 1.5;
      rrect(ctx, x, y, w, h, r);
      ctx.stroke();
    }

    // Icon badge
    const bSz = 36, bX = x + 8, bY = y + (h - bSz) / 2;
    ctx.fillStyle = '#2a3c3c';
    rrect(ctx, bX, bY, bSz, bSz, 5);
    ctx.fill();
    ctx.strokeStyle = '#4a6060';
    ctx.lineWidth = 1;
    rrect(ctx, bX, bY, bSz, bSz, 5);
    ctx.stroke();

    if (badgeContent === '1234') {
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.fillStyle = '#a0c4c4';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('12', bX + bSz / 2, bY + bSz / 2 - 6);
      ctx.fillText('34', bX + bSz / 2, bY + bSz / 2 + 6);
    } else {
      ctx.font = "bold 18px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#a0c4c4';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeContent, bX + bSz / 2, bY + bSz / 2);
    }

    // Title + description
    const tX = x + 52;
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, tX, y + h / 2 - 9);
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    ctx.fillText(description, tX, y + h / 2 + 9);

    // "Selected" label bottom-right for selected tile
    if (selected) {
      ctx.font = "bold 10px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Selected', x + w - 8, y + h - 5);
    }

    ctx.restore();
  }
}

