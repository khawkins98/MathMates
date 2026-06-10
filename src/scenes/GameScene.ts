import { AudioManager } from '@/audio/AudioManager';
import { CANVAS_HEIGHT, CANVAS_WIDTH, CELL_GAP, CELL_SIZE, FLASH_DURATION, GRID_COLS, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_ROWS, STARTING_LIVES } from '@/constants';
import { recordStageResult } from '@/core/progress';
import type { SceneManager } from '@/core/SceneManager';
import { AICrewmate } from '@/entities/AICrewmate';
import { AIWanderer } from '@/entities/AIWanderer';
import { Grid } from '@/entities/Grid';
import { Player } from '@/entities/Player';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawSpaceBackground, makeStars } from '@/rendering/drawHelpers';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { STAGES } from '@/stages';
import type { Scene, ScenarioDefinition, StageDefinition } from '@/types';
import { HUD } from '@/ui/HUD';
import { isMissionParams, makeMissionSeed, type CompleteSceneParams, type GameOverSceneParams, type MissionParams } from './sceneParams';

function multiplierForStreak(streak: number): number {
  if (streak >= 9) {
    return 3;
  }
  if (streak >= 6) {
    return 2;
  }
  if (streak >= 3) {
    return 1.5;
  }
  return 1;
}

export class GameScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private audio: AudioManager;
  private hud = new HUD();
  private stars = makeStars(40);
  private stage: StageDefinition | null = null;
  private scenario: ScenarioDefinition | null = null;
  private mission: MissionParams | null = null;
  private grid: Grid | null = null;
  private player = new Player();
  private wanderer: AIWanderer | null = null;
  private crewmates: AICrewmate[] = [];
  private wandererEnabled = true;
  private score = 0;
  private streak = 0;
  private multiplier = 1;
  private lives = STARTING_LIVES;
  private elapsedMs = 0;
  private eatLockMs = 0;
  private pendingResolution = false;
  private paused = false;
  private ended = false;
  private successfulActions = 0;
  private mistakes = 0;
  private livesLostToImpostor = 0;
  private bonusAwarded = false;
  private statusText = '';

  constructor(manager: SceneManager, rr: RoughRenderer, audio: AudioManager) {
    this.manager = manager;
    this.rr = rr;
    this.audio = audio;
  }

  enter(params?: Record<string, unknown>): void {
    if (!isMissionParams(params)) {
      this.manager.goto('SELECT');
      return;
    }

    const stage = STAGES[params.stageIndex];
    const scenarioId = stage?.scenarios[params.scenarioIndex];
    const scenario = scenarioId ? SCENARIO_REGISTRY.get(scenarioId) : undefined;
    if (!stage || !scenario) {
      this.manager.goto('SELECT');
      return;
    }

    this.stage = stage;
    this.scenario = scenario;
    this.mission = { ...params };
    this.grid = new Grid(scenario.generateGrid(params.seed), (value) => scenario.isCorrect(value));
    this.player = new Player(0, 0);
    this.grid.setHighlighted(this.player.col, this.player.row);
    this.wandererEnabled = !(params.mode === 'crew' && params.stageIndex === 0 && params.scenarioIndex === 0);
    this.wanderer = params.mode === 'crew' && this.wandererEnabled ? new AIWanderer() : null;
    if (this.wanderer) {
      this.wanderer.spawnAtEdge(this.player.col, this.player.row);
    }
    this.crewmates = params.mode === 'impostor'
      ? this.buildCrewmates(params.stageIndex)
      : [];
    this.score = 0;
    this.streak = 0;
    this.multiplier = 1;
    this.lives = STARTING_LIVES;
    this.elapsedMs = 0;
    this.eatLockMs = 0;
    this.pendingResolution = false;
    this.paused = false;
    this.ended = false;
    this.successfulActions = 0;
    this.mistakes = 0;
    this.livesLostToImpostor = 0;
    this.bonusAwarded = false;
    this.statusText = params.mode === 'crew' ? 'Eat the correct answers.' : 'Break the wrong answers before they are repaired.';
    this.hud = new HUD();
    this.syncHud();
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    if (this.ended || !this.grid || !this.mission || !this.scenario || !this.stage) {
      return;
    }

    let moved = false;
    let action = this.manager.input.shift();
    while (action) {
      if (action === 'pause') {
        this.paused = !this.paused;
        action = this.manager.input.shift();
        continue;
      }

      if (this.paused) {
        if (action === 'back') {
          this.manager.goto('SELECT');
          return;
        }
        if (action === 'eat') {
          this.paused = false;
        }
        action = this.manager.input.shift();
        continue;
      }

      switch (action) {
        case 'up':
        case 'down':
        case 'left':
        case 'right':
          this.player.move(action);
          this.grid.setHighlighted(this.player.col, this.player.row);
          moved = true;
          break;
        case 'sus':
          this.grid.toggleSus(this.player.col, this.player.row);
          break;
        case 'eat':
          if (this.eatLockMs <= 0) {
            this.handleEat();
          }
          break;
        case 'back':
          this.paused = true;
          break;
        default:
          break;
      }
      action = this.manager.input.shift();
    }

    if (this.paused || this.ended) {
      return;
    }

    this.elapsedMs += dt;
    this.eatLockMs = Math.max(0, this.eatLockMs - dt);
    this.grid.update(dt);
    this.player.update(dt);
    this.hud.update(dt);

    if (this.mission.mode === 'crew' && this.wanderer) {
      const movedWanderer = this.wanderer.update(dt);
      if ((moved || movedWanderer) && this.player.col === this.wanderer.col && this.player.row === this.wanderer.row) {
        this.handleWandererCollision();
        if (this.ended) {
          return;
        }
      }
    }

    if (this.mission.mode === 'impostor') {
      for (const crewmate of this.crewmates) {
        const repaired = crewmate.update(dt, this.grid);
        if (repaired) {
          this.grid.repairCell(crewmate.col, crewmate.row);
          this.audio.repair();
          this.statusText = `${crewmate.personality.name} crewmate repaired a cell!`;
        }
      }
    }

    if (this.pendingResolution && this.eatLockMs <= 0) {
      this.pendingResolution = false;
      this.resolveAfterEat();
      if (this.ended) {
        return;
      }
    }

    this.syncHud();
  }

  private handleEat(): void {
    if (!this.grid || !this.mission) {
      return;
    }
    const cell = this.grid.getCellAt(this.player.col, this.player.row);
    if (!cell || cell.state === 'correct_flash' || cell.state === 'error_flash') {
      return;
    }
    if (cell.state === 'consumed' || cell.state === 'broken') {
      // Nothing left to eat here — but in impostor mode a crewmate dwelling on
      // a broken cell (repairing it) can still be ejected. Without this, the
      // advertised counterplay barely exists: repairers spend most of their
      // time dwelling and used to be invulnerable the whole while.
      if (this.mission.mode === 'impostor') {
        this.checkCrewmateElimination();
        this.eatLockMs = FLASH_DURATION;
        this.syncHud();
      }
      return;
    }
    if (cell.sus) {
      this.statusText = 'Cell is marked sus — press S to unmark before eating.';
      return;
    }

    if (this.mission.mode === 'crew') {
      const correct = this.grid.consumeCell(this.player.col, this.player.row);
      if (correct) {
        this.awardObjectiveProgress();
        this.audio.cellEat();
        this.statusText = 'Correct! Keep going!';
      } else {
        this.mistakes += 1;
        this.loseLife();
        this.audio.errorBuzz();
        this.statusText = 'Oops — that one does not match the rule.';
      }
    } else {
      const correctCell = this.grid.isCorrectCell(this.player.col, this.player.row);
      if (correctCell) {
        this.grid.impostorEatCorrectCell(this.player.col, this.player.row);
        this.mistakes += 1;
        this.loseLife();
        this.audio.errorBuzz();
        this.statusText = 'Yikes! You ate a correct answer.';
      } else {
        this.grid.impostorBreakCell(this.player.col, this.player.row);
        this.awardObjectiveProgress();
        this.audio.sabotageEat();
        this.statusText = 'Sabotage successful!';
        this.checkCrewmateElimination();
      }
    }

    this.eatLockMs = FLASH_DURATION;
    this.pendingResolution = true;
    this.syncHud();
  }

  private awardObjectiveProgress(): void {
    const points = Math.round(10 * this.multiplier);
    this.score += points;
    this.successfulActions += 1;
    this.streak += 1;
    this.multiplier = multiplierForStreak(this.streak);
  }

  private loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.streak = 0;
    this.multiplier = 1;
  }

  private handleWandererCollision(): void {
    if (!this.wanderer) {
      return;
    }
    this.livesLostToImpostor += 1;
    this.loseLife();
    this.audio.errorBuzz();
    this.statusText = 'The impostor bumped into you!';
    if (this.lives <= 0) {
      this.goToGameOver();
      return;
    }
    this.wanderer.spawnAtEdge(this.player.col, this.player.row);
    this.syncHud();
  }

  private checkCrewmateElimination(): void {
    let eliminated = 0;
    for (const crewmate of this.crewmates) {
      if (crewmate.alive && crewmate.col === this.player.col && crewmate.row === this.player.row) {
        crewmate.eliminate();
        this.score += 25;
        eliminated += 1;
      }
    }
    if (eliminated > 0) {
      this.audio.crewmateEject();
      this.statusText = eliminated > 1 ? 'Double sabotage! Crewmates eliminated.' : 'Crewmate eliminated!';
    }
  }

  private resolveAfterEat(): void {
    if (!this.grid || !this.mission || !this.stage || !this.scenario) {
      return;
    }

    if (this.isMissionClear()) {
      if (!this.bonusAwarded && this.elapsedMs <= this.scenario.parTime * 1000) {
        this.score += 50;
        this.bonusAwarded = true;
      }
      const progression = recordStageResult(this.stage.id, this.mission.mode, this.mission.scenarioIndex, this.score, this.elapsedMs);
      const nextMission = this.buildNextMission(progression.stageJustCompleted);
      const completeParams: CompleteSceneParams = {
        ...this.mission,
        stageTitle: this.stage.title,
        scenarioTitle: this.scenario.title,
        score: this.score,
        accuracy: this.getAccuracy(),
        timeMs: this.elapsedMs,
        lives: this.lives,
        bonusAwarded: this.bonusAwarded,
        nextMission,
      };
      this.ended = true;
      this.audio.missionComplete();
      this.manager.goto('COMPLETE', completeParams as unknown as Record<string, unknown>);
      return;
    }

    if (this.lives <= 0) {
      this.goToGameOver();
    }
  }

  private buildNextMission(stageJustCompleted: boolean): MissionParams | null {
    if (!this.mission || !this.stage) {
      return null;
    }

    // Next scenario within current stage
    if (this.mission.scenarioIndex + 1 < this.stage.scenarios.length) {
      return {
        ...this.mission,
        scenarioIndex: this.mission.scenarioIndex + 1,
        seed: makeMissionSeed(),
      };
    }

    // Finished all crew scenarios for the first time → pivot to impostor on same stage
    if (this.mission.mode === 'crew' && stageJustCompleted) {
      return {
        stageId: this.stage.id,
        stageIndex: this.mission.stageIndex,
        scenarioIndex: 0,
        mode: 'impostor',
        seed: makeMissionSeed(),
      };
    }

    // Any other completion → advance to next stage in the same mode
    const nextStage = STAGES[this.mission.stageIndex + 1];
    if (nextStage) {
      return {
        stageId: nextStage.id,
        stageIndex: this.mission.stageIndex + 1,
        scenarioIndex: 0,
        mode: this.mission.mode,
        seed: makeMissionSeed(),
      };
    }

    return null;
  }

  private isMissionClear(): boolean {
    if (!this.grid || !this.mission) {
      return false;
    }
    return this.mission.mode === 'crew' ? this.grid.isCleared() : this.grid.isAllWrongCleared();
  }

  private getAccuracy(): number {
    const total = this.successfulActions + this.mistakes;
    if (total === 0) {
      return 1;
    }
    return this.successfulActions / total;
  }

  private goToGameOver(): void {
    if (!this.mission || !this.stage || !this.scenario) {
      return;
    }
    const gameOverParams: GameOverSceneParams = {
      retryMission: {
        ...this.mission,
        seed: makeMissionSeed(),
      },
      stageTitle: this.stage.title,
      scenarioTitle: this.scenario.title,
      score: this.score,
      mode: this.mission.mode,
      reason: this.livesLostToImpostor > this.mistakes ? 'impostor' : 'mistakes',
    };
    this.ended = true;
    this.audio.eliminationSting();
    this.manager.goto('GAME_OVER', gameOverParams as unknown as Record<string, unknown>);
  }

  private buildCrewmates(stageIndex: number): AICrewmate[] {
    // Stage 0: 1 slow wanderer — just a gentle obstacle
    // Stage 1: 1 diligent crewmate — somewhat targeted
    // Stage 2–3: 2 crewmates — meaningful pressure
    // Stage 4+: 2 crewmates (keen + diligent) — toughest pairing, still beatable
    if (stageIndex <= 0) {
      return [new AICrewmate(1, 4, 0)];
    }
    if (stageIndex === 1) {
      return [new AICrewmate(0, 4, 0)];
    }
    if (stageIndex <= 3) {
      return [new AICrewmate(0, 4, 0), new AICrewmate(1, 0, 3)];
    }
    return [new AICrewmate(2, 4, 0), new AICrewmate(0, 0, 3)];
  }

  private syncHud(): void {
    if (!this.grid || !this.scenario || !this.mission) {
      return;
    }
    this.hud.setScore(this.score);
    this.hud.setMultiplier(this.multiplier);
    this.hud.setLives(this.lives, STARTING_LIVES);
    this.hud.setRule(this.mission.mode === 'impostor' ? this.scenario.impostorRuleText : this.scenario.ruleText);
    this.hud.setImpostorMode(this.mission.mode === 'impostor');
    this.hud.setProgress(
      this.mission.mode === 'crew' ? this.grid.correctEaten : this.grid.wrongEaten,
      this.mission.mode === 'crew' ? this.grid.totalCorrect : this.grid.totalWrong,
      this.mission.mode === 'crew' ? COLOURS.SUCCESS : COLOURS.DANGER,
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsedMs, this.stars);

    ctx.fillStyle = COLOURS.GRID_BG;
    ctx.fillRect(
      GRID_OFFSET_X - 12,
      GRID_OFFSET_Y - 10,
      GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP + 24,
      GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP + 20,
    );

    if (this.grid) {
      this.grid.draw(this.rr);
      if (this.mission?.mode === 'crew' && this.wanderer) {
        this.wanderer.draw(this.rr, this.grid, this.elapsedMs);
      }
      if (this.mission?.mode === 'impostor') {
        for (const crewmate of this.crewmates) {
          crewmate.draw(this.rr, this.grid);
        }
      }
      this.player.draw(this.rr, this.grid, this.mission?.mode === 'impostor' ? COLOURS.PLAYER_IMPOSTOR : COLOURS.PLAYER_CREW);
    }

    this.hud.draw(ctx, this.rr);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dde7f6';
    ctx.font = "14px 'Fredoka One', sans-serif";
    ctx.fillText(this.statusText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 18);
    ctx.restore();

    if (this.paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.rr.cell(160, 140, 280, 150, '#10233a', '#ffffff', 207);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "24px 'Press Start 2P', monospace";
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 5;
      ctx.strokeText('PAUSED', CANVAS_WIDTH / 2, 178);
      ctx.fillStyle = '#f0fafa';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 178);
      ctx.font = "15px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c8e8e0';
      ctx.fillText('Space or Esc to resume', CANVAS_WIDTH / 2, 220);
      ctx.fillText('Backspace returns to stage select', CANVAS_WIDTH / 2, 248);
      ctx.restore();
    }
  }
}
