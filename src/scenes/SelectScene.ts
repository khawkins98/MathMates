import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { getModeProgress, getNextScenarioIndex, getProgress, isCrewStageUnlocked, isImpostorStageUnlocked, type ProgressData } from '@/core/progress';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { STAGES } from '@/stages';
import type { GameMode } from '@/types';
import type { MissionParams } from './sceneParams';

const TILE_WIDTH = 262;
const TILE_HEIGHT = 58;
const LEFT_X = 20;
const RIGHT_X = 318;
const TOP_Y = 74;
const ROW_GAP = 68;

export class SelectScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private progress: ProgressData = getProgress();
  private selectedStageIndex = 0;
  private selectedModeIndex = 0;
  private elapsed = 0;

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
  }

  enter(_params?: Record<string, unknown>): void {
    this.progress = getProgress();
    this.selectedStageIndex = 0;
    this.selectedModeIndex = 0;
    this.snapToUnlockedTile();
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  private snapToUnlockedTile(): void {
    const currentMode = this.selectedModeIndex === 0 ? 'crew' : 'impostor';
    if (this.isUnlocked(this.selectedStageIndex, currentMode)) {
      return;
    }
    for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex += 1) {
      if (this.isUnlocked(stageIndex, 'crew')) {
        this.selectedStageIndex = stageIndex;
        this.selectedModeIndex = 0;
        return;
      }
    }
  }

  private isUnlocked(stageIndex: number, mode: GameMode): boolean {
    const stage = STAGES[stageIndex];
    return mode === 'crew'
      ? isCrewStageUnlocked(stageIndex, this.progress)
      : isImpostorStageUnlocked(stage.id, this.progress);
  }

  update(dt: number): void {
    this.elapsed += dt;
    let action = this.manager.input.shift();
    while (action) {
      switch (action) {
        case 'up':
          this.selectedStageIndex = (this.selectedStageIndex - 1 + STAGES.length) % STAGES.length;
          break;
        case 'down':
          this.selectedStageIndex = (this.selectedStageIndex + 1) % STAGES.length;
          break;
        case 'left':
          this.selectedModeIndex = 0;
          break;
        case 'right':
          this.selectedModeIndex = 1;
          break;
        case 'back':
        case 'pause':
          this.manager.goto('TITLE');
          return;
        case 'eat':
        case 'confirm': {
          const mode: GameMode = this.selectedModeIndex === 0 ? 'crew' : 'impostor';
          if (this.isUnlocked(this.selectedStageIndex, mode)) {
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
          break;
        }
        default:
          break;
      }
      action = this.manager.input.shift();
    }
  }

  private tileX(mode: GameMode): number {
    return mode === 'crew' ? LEFT_X : RIGHT_X;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLOURS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 42px 'Caveat', cursive`;
    ctx.fillText('Choose a mission', CANVAS_WIDTH / 2, 30);
    ctx.font = `16px 'Nunito', sans-serif`;
    ctx.fillStyle = '#dbe4ff';
    ctx.fillText('Each stage has a crew run and an impostor flip-side.', CANVAS_WIDTH / 2, 52);
    ctx.restore();

    for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex += 1) {
      const stage = STAGES[stageIndex];
      const y = TOP_Y + stageIndex * ROW_GAP;
      this.drawTile(ctx, stageIndex, 'crew', this.tileX('crew'), y, stage);
      this.drawTile(ctx, stageIndex, 'impostor', this.tileX('impostor'), y, stage);
    }
    ctx.save();
    ctx.fillStyle = '#cfd9ed';
    ctx.font = `14px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Arrows: move  •  Space/Enter: start  •  Esc/Backspace: title', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 18);
    ctx.restore();
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    stageIndex: number,
    mode: GameMode,
    x: number,
    y: number,
    stage: (typeof STAGES)[number],
  ): void {
    const unlocked = this.isUnlocked(stageIndex, mode);
    const selected = this.selectedStageIndex === stageIndex && (this.selectedModeIndex === 0 ? 'crew' : 'impostor') === mode;
    const accent = mode === 'crew' ? COLOURS.SUCCESS : COLOURS.DANGER;
    const fill = mode === 'crew' ? '#14344b' : '#4a1825';
    const progress = getModeProgress(stage.id, mode, this.progress);

    this.rr.cell(x, y, TILE_WIDTH, TILE_HEIGHT, fill, selected ? '#f8f9ff' : accent, stageIndex * 11 + (mode === 'crew' ? 2 : 5));

    if (!unlocked) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#0a1020';
      ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `22px 'Nunito', sans-serif`;
    ctx.fillText(stage.icon, x + 10, y + 16);

    ctx.font = `bold 16px 'Nunito', sans-serif`;
    ctx.fillText(`${stage.title} — ${mode === 'crew' ? 'Crew' : 'Impostor'}`, x + 42, y + 16);

    ctx.font = `12px 'Nunito', sans-serif`;
    ctx.fillStyle = '#d3dfff';
    ctx.fillText(stage.description, x + 42, y + 33);

    ctx.fillStyle = unlocked ? accent : '#f3c9cf';
    ctx.font = `bold 12px 'Nunito', sans-serif`;
    const missionLabel = progress.completed
      ? 'Complete ✓'
      : `Mission ${Math.min(progress.completedScenarios + 1, stage.scenarios.length)}/${stage.scenarios.length}`;
    const lockedLabel = mode === 'crew'
      ? stageIndex === 0
        ? 'Unlocked'
        : `Clear ${STAGES[stageIndex - 1].title} first`
      : 'Beat crew mode first';
    ctx.fillText(unlocked ? missionLabel : `🔒 ${lockedLabel}`, x + 42, y + 49);

    if (selected) {
      const pulse = 0.55 + 0.45 * Math.sin(this.elapsed * 0.006);
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.globalAlpha = pulse;
      ctx.strokeRect(x + 3, y + 3, TILE_WIDTH - 6, TILE_HEIGHT - 6);
      ctx.restore();
    }
    ctx.restore();
  }
}
