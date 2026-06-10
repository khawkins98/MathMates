import type { Scene, GameMode } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { getModeProgress, getNextScenarioIndex, getProgress, type ProgressData } from '@/core/progress';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawSpaceBackground, fitText, makeStars, type Star, rrect, drawControlsHintsBar } from '@/rendering/drawHelpers';
import { STAGES } from '@/stages';
import { makeMissionSeed, type MissionParams } from './sceneParams';

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
const MODE_Y = 122;

export class SelectScene implements Scene {
  private manager: SceneManager;
  private progress: ProgressData = getProgress();
  private step: SelectStep = 'stage';
  private selectedStageIndex = 0;
  private selectedModeIndex = 0; // 0 = crew, 1 = impostor
  private elapsed = 0;
  private stars: Star[] = makeStars(48);
  private rr: RoughRenderer;

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
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
          case 'eat': {
            const mode: GameMode = this.selectedModeIndex === 0 ? 'crew' : 'impostor';
            const stage = STAGES[this.selectedStageIndex];
            const params: MissionParams = {
              stageId: stage.id,
              stageIndex: this.selectedStageIndex,
              scenarioIndex: getNextScenarioIndex(stage.id, mode, this.progress),
              mode,
              seed: makeMissionSeed(),
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

    drawControlsHintsBar(ctx, [
      ['ARROWS', 'move'],
      ['SPACE / ENTER', 'select'],
      ['ESC', 'back'],
    ]);
  }

  private drawStageTile(ctx: CanvasRenderingContext2D, index: number, x: number, y: number): void {
    const stage = STAGES[index];
    const selected = this.selectedStageIndex === index;
    const crewDone = getModeProgress(stage.id, 'crew', this.progress).completed;
    const impostorDone = getModeProgress(stage.id, 'impostor', this.progress).completed;
    const r = 8;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rrect(ctx, x + 3, y + 4, TILE_W, TILE_H, r);
    ctx.fill();

    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    rrect(ctx, x, y, TILE_W, TILE_H, r);
    ctx.fill();

    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      rrect(ctx, x, y, TILE_W, TILE_H, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 1.5;
      rrect(ctx, x, y, TILE_W, TILE_H, r);
      ctx.stroke();
    }

    // Icon badge
    const bSz = 46;
    const bX = x + 10;
    const bY = y + (TILE_H - bSz) / 2;
    ctx.fillStyle = '#2a3c3c';
    rrect(ctx, bX, bY, bSz, bSz, 6);
    ctx.fill();
    ctx.strokeStyle = '#4a6060';
    ctx.lineWidth = 1;
    rrect(ctx, bX, bY, bSz, bSz, 6);
    ctx.stroke();

    ctx.font = stage.icon.length === 1 ? "18px 'Press Start 2P', monospace" : "11px 'Press Start 2P', monospace";
    ctx.fillStyle = stage.iconColour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.icon, bX + bSz / 2, bY + bSz / 2 + 1);

    const tX = x + 66;
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.title, tX, y + 22);

    const descMaxW = x + TILE_W - 10 - tX;
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    fitText(ctx, stage.description, tX, y + 40, descMaxW, 12, "'Fredoka One', sans-serif", 10);

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
    ctx.font = "14px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('How do you want to play?', CANVAS_WIDTH / 2, 88);
    ctx.restore();

    this.drawModeTile(ctx, 'crew', MODE_LEFT_X, MODE_Y);
    this.drawModeTile(ctx, 'impostor', MODE_RIGHT_X, MODE_Y);

    drawControlsHintsBar(ctx, [
      ['LEFT / RIGHT', 'choose'],
      ['SPACE / ENTER', 'start'],
      ['ESC', 'back'],
    ]);
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
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rrect(ctx, x + 4, y + 5, MODE_W, MODE_H, r);
    ctx.fill();

    ctx.fillStyle = selected ? '#10d8f0' : '#c8dcdc';
    rrect(ctx, x, y, MODE_W, MODE_H, r);
    ctx.fill();

    if (selected) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      rrect(ctx, x, y, MODE_W, MODE_H, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#8aacac';
      ctx.lineWidth = 2;
      rrect(ctx, x, y, MODE_W, MODE_H, r);
      ctx.stroke();
    }

    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#0a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, x + MODE_W / 2, y + 42);

    ctx.fillStyle = selected ? '#0a3a4a' : accent;
    ctx.fillRect(x + 20, y + 60, MODE_W - 40, 2);

    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = selected ? '#0a2a2a' : '#3a5050';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(desc1, x + MODE_W / 2, y + 88);
    ctx.fillText(desc2, x + MODE_W / 2, y + 108);

    const bob = selected ? Math.sin(this.elapsed * 0.004) * 2 : 0;
    this.rr.crewmate(x + MODE_W / 2, y + 134 + bob, accent, 3, 0.7);

    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = progress.completed ? COLOURS.SUCCESS : selected ? '#0a3a4a' : accent;
    ctx.fillText(missionLabel, x + MODE_W / 2, y + 162);

    ctx.restore();
  }

  // ── Shared UI helpers ────────────────────────────────────────────────────────

  private drawTerminalFrame(ctx: CanvasRenderingContext2D): void {
    const m = 5;
    const r = 12;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 12, 0.6)';
    rrect(ctx, m, m, CANVAS_WIDTH - m * 2, CANVAS_HEIGHT - m * 2, r);
    ctx.fill();
    ctx.strokeStyle = '#4a7070';
    ctx.lineWidth = 3;
    rrect(ctx, m, m, CANVAS_WIDTH - m * 2, CANVAS_HEIGHT - m * 2, r);
    ctx.stroke();
    ctx.strokeStyle = '#2a4848';
    ctx.lineWidth = 1;
    rrect(ctx, m + 4, m + 4, CANVAS_WIDTH - (m + 4) * 2, CANVAS_HEIGHT - (m + 4) * 2, r - 2);
    ctx.stroke();
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
    rrect(ctx, bX, bY, bW, bH, 6);
    ctx.fill();
    ctx.strokeStyle = '#40d8c0';
    ctx.lineWidth = 2;
    rrect(ctx, bX, bY, bW, bH, 6);
    ctx.stroke();
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#40d8c0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_WIDTH / 2, bY + bH / 2);
    ctx.restore();
  }
}
