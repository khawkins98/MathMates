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
const TILE_H = 60;
const COL_X = [16, 312] as const;
const TOP_Y = 62;
const ROW_GAP = 72;

// Mode tiles
const MODE_W = 232;
const MODE_H = 170;
const MODE_LEFT_X = 62;
const MODE_RIGHT_X = 306;
const MODE_Y = 96;

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
    ctx.save();
    ctx.font = "15px 'Press Start 2P', monospace";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Choose your mission', CANVAS_WIDTH / 2, 26);
    ctx.fillStyle = '#f0fafa';
    ctx.fillText('Choose your mission', CANVAS_WIDTH / 2, 26);
    ctx.restore();

    for (let i = 0; i < STAGES.length; i += 1) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = COL_X[col];
      const y = TOP_Y + row * ROW_GAP;
      this.drawStageTile(ctx, i, x, y);
    }

    ctx.save();
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Arrows: move  •  Space/Enter: select  •  Esc: back',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 10,
    );
    ctx.restore();
  }

  private drawStageTile(ctx: CanvasRenderingContext2D, index: number, x: number, y: number): void {
    const stage = STAGES[index];
    const selected = this.selectedStageIndex === index;
    const crewDone = getModeProgress(stage.id, 'crew', this.progress).completed;
    const impostorDone = getModeProgress(stage.id, 'impostor', this.progress).completed;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + 3, y + 4, TILE_W, TILE_H);
    // Fill
    ctx.fillStyle = '#ddf4f0';
    ctx.fillRect(x, y, TILE_W, TILE_H);
    // Border
    if (selected) {
      const pulse = 0.55 + 0.45 * Math.sin(this.elapsed * 0.006);
      ctx.strokeStyle = COLOURS.PLAYER_CREW;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5 + 0.5 * pulse;
    } else {
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(x, y, TILE_W, TILE_H);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Icon
    ctx.save();
    ctx.font = '22px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(stage.icon, x + 8, y + 30);
    ctx.restore();

    // Title
    ctx.save();
    ctx.font = "bold 13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#080c0c';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.title, x + 38, y + 16);
    ctx.restore();

    // Description
    ctx.save();
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#2a4040';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.description, x + 38, y + 31);
    ctx.restore();

    // Cleared badges
    if (crewDone || impostorDone) {
      const badges = [crewDone && 'Crew', impostorDone && 'Impostor'].filter(Boolean).join(' & ');
      ctx.save();
      ctx.font = "10px 'Fredoka One', sans-serif";
      ctx.fillStyle = COLOURS.SUCCESS;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`✓ ${badges}`, x + 38, y + 48);
      ctx.restore();
    }
  }

  // ── Mode select ─────────────────────────────────────────────────────────────

  private drawModeSelect(ctx: CanvasRenderingContext2D): void {
    const stage = STAGES[this.selectedStageIndex];

    // Stage name
    ctx.save();
    ctx.font = "13px 'Press Start 2P', monospace";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(stage.title, CANVAS_WIDTH / 2, 32);
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(stage.title, CANVAS_WIDTH / 2, 32);
    ctx.restore();

    ctx.save();
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('How do you want to play?', CANVAS_WIDTH / 2, 60);
    ctx.restore();

    this.drawModeTile(ctx, 'crew', MODE_LEFT_X, MODE_Y);
    this.drawModeTile(ctx, 'impostor', MODE_RIGHT_X, MODE_Y);

    ctx.save();
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Left/Right: choose  •  Space/Enter: start  •  Esc: back',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 10,
    );
    ctx.restore();
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

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 4, y + 5, MODE_W, MODE_H);
    // Fill
    ctx.fillStyle = '#ddf4f0';
    ctx.fillRect(x, y, MODE_W, MODE_H);
    // Border
    if (selected) {
      const pulse = 0.55 + 0.45 * Math.sin(this.elapsed * 0.006);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.5 + 0.5 * pulse;
    } else {
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 3;
    }
    ctx.strokeRect(x, y, MODE_W, MODE_H);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Mode label
    ctx.save();
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#080c0c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, x + MODE_W / 2, y + 44);
    ctx.restore();

    // Accent divider
    ctx.save();
    ctx.fillStyle = accent;
    ctx.fillRect(x + 20, y + 62, MODE_W - 40, 3);
    ctx.restore();

    // Description lines
    ctx.save();
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#2a4040';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(desc1, x + MODE_W / 2, y + 88);
    ctx.fillText(desc2, x + MODE_W / 2, y + 106);
    ctx.restore();

    // Progress
    ctx.save();
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = progress.completed ? COLOURS.SUCCESS : accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(missionLabel, x + MODE_W / 2, y + 142);
    ctx.restore();
  }
}
