import type { Scene, GameMode } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { getModeProgress, getNextScenarioIndex, getProgress, type ProgressData } from '@/core/progress';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawSpaceBackground, makeStars, type Star } from '@/rendering/drawHelpers';
import { STAGES } from '@/stages';
import type { MissionParams } from './sceneParams';

type SelectStep = 'stage' | 'mode';

// Stage grid: 2 columns × 4 rows
const TILE_W = 272;
const TILE_H = 72;
const COL_X = [16, 312] as const;
const TOP_Y = 60;
const ROW_GAP = 80;

// Mode tiles
const MODE_W = 232;
const MODE_H = 174;
const MODE_LEFT_X = 62;
const MODE_RIGHT_X = 306;
const MODE_Y = 90;

export class SelectScene implements Scene {
  private manager: SceneManager;
  private progress: ProgressData = getProgress();
  private step: SelectStep = 'stage';
  private selectedStageIndex = 0;
  private selectedModeIndex = 0; // 0 = crew, 1 = impostor
  private elapsed = 0;
  private stars: Star[] = makeStars(48);

  constructor(manager: SceneManager, _rr: RoughRenderer) {
    this.manager = manager;
    this.stars = makeStars(48);
  }

  enter(_params?: Record<string, unknown>): void {
    this.progress = getProgress();
    this.step = 'stage';
    this.selectedStageIndex = 0;
    this.selectedModeIndex = 0;
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    let action = this.manager.input.shift();
    while (action) {
      if (this.step === 'stage') {
        switch (action) {
          case 'up':
            this.selectedStageIndex = (this.selectedStageIndex - 2 + STAGES.length) % STAGES.length;
            break;
          case 'down':
            this.selectedStageIndex = (this.selectedStageIndex + 2) % STAGES.length;
            break;
          case 'left':
            if (this.selectedStageIndex % 2 === 1) this.selectedStageIndex -= 1;
            break;
          case 'right':
            if (this.selectedStageIndex % 2 === 0 && this.selectedStageIndex + 1 < STAGES.length)
              this.selectedStageIndex += 1;
            break;
          case 'back':
          case 'pause':
            this.manager.goto('TITLE');
            return;
          case 'eat':
          case 'confirm':
            this.step = 'mode';
            this.selectedModeIndex = 0;
            break;
          default:
            break;
        }
      } else {
        switch (action) {
          case 'left':
            this.selectedModeIndex = 0;
            break;
          case 'right':
            this.selectedModeIndex = 1;
            break;
          case 'up':
          case 'down':
            this.selectedModeIndex = 1 - this.selectedModeIndex;
            break;
          case 'back':
          case 'pause':
            this.step = 'stage';
            break;
          case 'eat':
          case 'confirm': {
            const mode: GameMode = this.selectedModeIndex === 0 ? 'crew' : 'impostor';
            const stage = STAGES[this.selectedStageIndex];
            const params: MissionParams = {
              stageId: stage.id,
              stageIndex: this.selectedStageIndex,
              scenarioIndex: getNextScenarioIndex(stage.id, mode, this.progress),
              mode,
              seed: Date.now() % 1000000,
            };
            this.manager.goto('BRIEFING', params as unknown as Record<string, unknown>);
            return;
          }
          default:
            break;
        }
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsed, this.stars);
    if (this.step === 'stage') {
      this.drawStageSelect(ctx);
    } else {
      this.drawModeSelect(ctx);
    }
  }

  // ── Stage select ────────────────────────────────────────────────────────────

  private drawStageSelect(ctx: CanvasRenderingContext2D): void {
    this.drawTerminalFrame(ctx);
    this.drawTitleBanner(ctx, 'Choose your mission');

    for (let i = 0; i < STAGES.length; i += 1) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = COL_X[col];
      const y = TOP_Y + row * ROW_GAP;
      this.drawStageTile(ctx, i, x, y);
    }

    this.drawControlsBar(ctx, 'Arrows: move', 'Space/Enter: select', 'Esc: back');
  }

  private drawStageTile(ctx: CanvasRenderingContext2D, index: number, x: number, y: number): void {
    const stage = STAGES[index];
    const selected = this.selectedStageIndex === index;
    const crewDone = getModeProgress(stage.id, 'crew', this.progress).completed;
    const impostorDone = getModeProgress(stage.id, 'impostor', this.progress).completed;
    const r = 8;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.rrect(ctx, x + 3, y + 4, TILE_W, TILE_H, r);
    ctx.fill();

    // Tile fill — cyan when selected, silver-gray otherwise
    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    this.rrect(ctx, x, y, TILE_W, TILE_H, r);
    ctx.fill();

    // Border / glow
    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      this.rrect(ctx, x, y, TILE_W, TILE_H, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 1.5;
      this.rrect(ctx, x, y, TILE_W, TILE_H, r);
      ctx.stroke();
    }

    // Icon badge (dark rounded square)
    const bSz = 46;
    const bX = x + 10;
    const bY = y + (TILE_H - bSz) / 2;
    ctx.fillStyle = '#2a3c3c';
    this.rrect(ctx, bX, bY, bSz, bSz, 6);
    ctx.fill();
    ctx.strokeStyle = '#4a6060';
    ctx.lineWidth = 1;
    this.rrect(ctx, bX, bY, bSz, bSz, 6);
    ctx.stroke();

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.icon, bX + bSz / 2, bY + bSz / 2);

    // Title
    const tX = x + 66;
    const textDark = '#0a1a1a';
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillStyle = textDark;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.title, tX, y + 22);

    // Description
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    ctx.fillText(stage.description, tX, y + 40);

    // Cleared badges
    if (crewDone || impostorDone) {
      const badges = [crewDone && '✓ Crew', impostorDone && '✓ Impostor'].filter(Boolean).join('  ');
      ctx.font = "10px 'Fredoka One', sans-serif";
      ctx.fillStyle = selected ? '#054030' : COLOURS.SUCCESS;
      ctx.fillText(badges as string, tX, y + 58);
    }

    ctx.restore();
  }

  // ── Mode select ─────────────────────────────────────────────────────────────

  private drawModeSelect(ctx: CanvasRenderingContext2D): void {
    const stage = STAGES[this.selectedStageIndex];

    this.drawTerminalFrame(ctx);
    this.drawTitleBanner(ctx, stage.title);

    ctx.save();
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('How do you want to play?', CANVAS_WIDTH / 2, 66);
    ctx.restore();

    this.drawModeTile(ctx, 'crew', MODE_LEFT_X, MODE_Y);
    this.drawModeTile(ctx, 'impostor', MODE_RIGHT_X, MODE_Y);

    this.drawControlsBar(ctx, 'Left/Right: choose', 'Space/Enter: start', 'Esc: back');
  }

  private drawModeTile(ctx: CanvasRenderingContext2D, mode: GameMode, x: number, y: number): void {
    const stage = STAGES[this.selectedStageIndex];
    const selected =
      (mode === 'crew' && this.selectedModeIndex === 0) ||
      (mode === 'impostor' && this.selectedModeIndex === 1);
    const progress = getModeProgress(stage.id, mode, this.progress);
    const accent = mode === 'crew' ? COLOURS.PLAYER_CREW : COLOURS.PLAYER_IMPOSTOR;
    const modeLabel = mode === 'crew' ? 'CREW' : 'IMPOSTOR';
    const desc1 = mode === 'crew' ? 'Eat the correct answers.' : 'Break the wrong answers.';
    const desc2 = mode === 'crew' ? 'Avoid the impostors!' : 'Outrun the crewmates!';
    const missionLabel = progress.completed
      ? '✓ Complete!'
      : `Mission ${Math.min(progress.completedScenarios + 1, stage.scenarios.length)} / ${stage.scenarios.length}`;
    const r = 10;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.rrect(ctx, x + 4, y + 5, MODE_W, MODE_H, r);
    ctx.fill();

    // Tile fill
    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    this.rrect(ctx, x, y, MODE_W, MODE_H, r);
    ctx.fill();

    // Border / glow
    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      this.rrect(ctx, x, y, MODE_W, MODE_H, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 2;
      this.rrect(ctx, x, y, MODE_W, MODE_H, r);
      ctx.stroke();
    }

    // Mode label
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, x + MODE_W / 2, y + 42);

    // Divider
    ctx.fillStyle = selected ? '#0a3a4a' : accent;
    ctx.fillRect(x + 20, y + 60, MODE_W - 40, 2);

    // Description
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(desc1, x + MODE_W / 2, y + 88);
    ctx.fillText(desc2, x + MODE_W / 2, y + 108);

    // Progress
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = progress.completed ? COLOURS.SUCCESS : selected ? '#0a3a4a' : accent;
    ctx.fillText(missionLabel, x + MODE_W / 2, y + 148);

    ctx.restore();
  }

  // ── Shared UI helpers ────────────────────────────────────────────────────────

  /** Thin wrapper around roundRect with rect fallback. Adds path to ctx but does not stroke/fill. */
  private rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  private drawTerminalFrame(ctx: CanvasRenderingContext2D): void {
    const m = 5;
    const r = 12;
    ctx.save();
    // Semi-transparent dark overlay to darken space background inside frame
    ctx.fillStyle = 'rgba(6, 12, 12, 0.6)';
    this.rrect(ctx, m, m, CANVAS_WIDTH - m * 2, CANVAS_HEIGHT - m * 2, r);
    ctx.fill();
    // Outer frame stroke — metallic teal-gray
    ctx.strokeStyle = '#4a7070';
    ctx.lineWidth = 3;
    this.rrect(ctx, m, m, CANVAS_WIDTH - m * 2, CANVAS_HEIGHT - m * 2, r);
    ctx.stroke();
    // Inner highlight ring
    ctx.strokeStyle = '#2a4848';
    ctx.lineWidth = 1;
    this.rrect(ctx, m + 4, m + 4, CANVAS_WIDTH - (m + 4) * 2, CANVAS_HEIGHT - (m + 4) * 2, r - 2);
    ctx.stroke();
    // Corner bolts
    for (const [bx, by] of [[m + 14, m + 14], [CANVAS_WIDTH - m - 14, m + 14], [m + 14, CANVAS_HEIGHT - m - 14], [CANVAS_WIDTH - m - 14, CANVAS_HEIGHT - m - 14]] as [number, number][]) {
      ctx.fillStyle = '#3a5858';
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a8080';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = '#1e3030';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx - 2.5, by); ctx.lineTo(bx + 2.5, by);
      ctx.moveTo(bx, by - 2.5); ctx.lineTo(bx, by + 2.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTitleBanner(ctx: CanvasRenderingContext2D, text: string): void {
    const bW = Math.min(420, CANVAS_WIDTH - 80);
    const bH = 36;
    const bX = (CANVAS_WIDTH - bW) / 2;
    const bY = 13;
    ctx.save();
    ctx.fillStyle = '#0d1e1e';
    this.rrect(ctx, bX, bY, bW, bH, 6);
    ctx.fill();
    ctx.strokeStyle = '#40d8c0';
    ctx.lineWidth = 2;
    this.rrect(ctx, bX, bY, bW, bH, 6);
    ctx.stroke();
    ctx.font = "13px 'Press Start 2P', monospace";
    ctx.fillStyle = '#40d8c0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_WIDTH / 2, bY + bH / 2);
    ctx.restore();
  }

  private drawControlsBar(ctx: CanvasRenderingContext2D, left: string, center: string, right: string): void {
    const bX = 14;
    const bY = CANVAS_HEIGHT - 46;
    const bW = CANVAS_WIDTH - 28;
    const bH = 38;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 26, 26, 0.9)';
    this.rrect(ctx, bX, bY, bW, bH, 8);
    ctx.fill();
    ctx.strokeStyle = '#3a5454';
    ctx.lineWidth = 1.5;
    this.rrect(ctx, bX, bY, bW, bH, 8);
    ctx.stroke();

    const cy = bY + bH / 2;
    const hints: [string, number][] = [[left, bX + 28], [center, CANVAS_WIDTH / 2], [right, bX + bW - 28]];
    const aligns: CanvasTextAlign[] = ['left', 'center', 'right'];
    for (let i = 0; i < hints.length; i += 1) {
      const [text, hx] = hints[i];
      const colon = text.indexOf(':');
      const label = text.slice(0, colon + 1);
      const value = text.slice(colon + 1).trim();
      ctx.textAlign = aligns[i];
      ctx.textBaseline = 'middle';
      ctx.font = "11px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c0d4d4';
      ctx.fillText(label + ' ', hx, cy - 1);
      // measure label to offset value
      const lw = ctx.measureText(label + ' ').width;
      const vw = ctx.measureText(value).width;
      let vx: number;
      if (aligns[i] === 'left') {
        vx = hx + lw;
      } else if (aligns[i] === 'right') {
        vx = hx - lw - vw;
      } else {
        vx = hx - (lw + vw) / 2 + lw;
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#40d8c0';
      ctx.fillText(value, vx, cy - 1);
    }
    ctx.restore();
  }
}
