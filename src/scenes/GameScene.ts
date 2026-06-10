import { AudioManager } from '@/audio/AudioManager';
import { CANVAS_HEIGHT, CANVAS_WIDTH, CELL_GAP, CELL_SIZE, FLASH_DURATION, GRID_COLS, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_ROWS, STARTING_LIVES } from '@/constants';
import { recordMiss } from '@/core/misses';
import { recordStageResult } from '@/core/progress';
import type { SceneManager } from '@/core/SceneManager';
import { AICrewmate } from '@/entities/AICrewmate';
import { AIWanderer } from '@/entities/AIWanderer';
import { Grid } from '@/entities/Grid';
import { Player } from '@/entities/Player';
import { COLOURS } from '@/rendering/colours';
import { Effects } from '@/rendering/effects';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawPanel, drawSpaceBackground, makeStars } from '@/rendering/drawHelpers';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { STAGES } from '@/stages';
import type { Scene, ScenarioDefinition, StageDefinition } from '@/types';
import { EjectionCutscene } from '@/ui/EjectionCutscene';
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
  private effects = new Effects();
  private cutscene: EjectionCutscene | null = null;
  private suspicion = 0;
  private errorFreeze: { display: string; numeric: number; remainingMs: number } | null = null;

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
      // Stage 0 keeps the impostor harmless while controls are being learned;
      // later stages give it an appetite for the player's answers.
      if (params.stageIndex >= 4) {
        this.wanderer.configureHunting(9000, 3000);
      } else if (params.stageIndex >= 1) {
        this.wanderer.configureHunting(12000, 4200);
      }
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
    this.effects = new Effects();
    this.cutscene = null;
    this.suspicion = 0;
    this.errorFreeze = null;
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

    this.effects.update(dt);

    if (this.cutscene) {
      this.manager.input.clear();
      this.cutscene.update(dt);
      if (this.cutscene && !this.cutscene.active) {
        this.cutscene = null;
      }
      return;
    }

    if (this.errorFreeze) {
      // Teaching moment: hold the action until the child says they're ready.
      // A short grace period stops a buffered keypress from skipping it unread.
      this.errorFreeze.remainingMs -= dt;
      const skip = this.manager.input.shift() || this.manager.input.shiftTap();
      if (skip && this.errorFreeze.remainingMs <= 1600) {
        this.errorFreeze = null;
        this.manager.input.clear();
      }
      this.grid.update(dt);
      return;
    }

    this.handlePointerInput();

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
        default:
          break;
      }
      if (moved) {
        // One step per frame: buffered moves (key mashing or tap paths) play
        // out cell by cell so the wanderer collision check can't be skipped.
        break;
      }
      switch (action) {
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
      const tick = this.wanderer.update(dt, this.grid);
      if (tick.startedChewing) {
        this.audio.impostorChomp();
        this.statusText = 'The impostor is eating an answer — stop it!';
      }
      if (tick.ate) {
        const stolen = this.grid.stealCorrectCell(tick.ate.col, tick.ate.row);
        if (stolen) {
          const pos = this.grid.cellScreenPos(tick.ate.col, tick.ate.row);
          this.effects.sadPuff(pos.x + CELL_SIZE / 2, pos.y + CELL_SIZE / 2);
          this.audio.sabotageEat();
          this.statusText = 'The impostor ate an answer!';
        }
      }
      if ((moved || tick.moved) && this.player.col === this.wanderer.col && this.player.row === this.wanderer.row) {
        this.handleWandererCollision();
        if (this.ended || this.cutscene) {
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

  private handlePointerInput(): void {
    let tap = this.manager.input.shiftTap();
    while (tap) {
      this.handleTap(tap.x, tap.y);
      tap = this.manager.input.shiftTap();
    }
    let press = this.manager.input.shiftLongPress();
    while (press) {
      this.handleLongPress(press.x, press.y);
      press = this.manager.input.shiftLongPress();
    }
  }

  private handleTap(x: number, y: number): void {
    if (this.paused) {
      // Bottom strip of the pause panel quits to stage select; anywhere else resumes.
      const inPanel = x >= 160 && x <= 440 && y >= 140 && y <= 290;
      if (inPanel && y >= 235) {
        this.manager.goto('SELECT');
        return;
      }
      this.paused = false;
      return;
    }
    const cell = this.cellFromPoint(x, y);
    if (!cell) {
      return;
    }
    if (cell.col === this.player.col && cell.row === this.player.row) {
      if (this.eatLockMs <= 0) {
        this.handleEat();
      }
      return;
    }
    this.enqueueStepsTo(cell.col, cell.row);
  }

  private handleLongPress(x: number, y: number): void {
    if (this.paused) {
      return;
    }
    const cell = this.cellFromPoint(x, y);
    if (cell) {
      this.grid?.toggleSus(cell.col, cell.row);
    } else {
      this.paused = true;
    }
  }

  private cellFromPoint(x: number, y: number): { col: number; row: number } | null {
    const pitch = CELL_SIZE + CELL_GAP;
    const gx = x - GRID_OFFSET_X;
    const gy = y - GRID_OFFSET_Y;
    const col = Math.floor(gx / pitch);
    const row = Math.floor(gy / pitch);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return null;
    }
    // Reject taps that land in the gutter between cells
    if (gx - col * pitch > CELL_SIZE || gy - row * pitch > CELL_SIZE) {
      return null;
    }
    return { col, row };
  }

  /** Queue arrow steps along the shortest wrapped path; they play out one per frame. */
  private enqueueStepsTo(col: number, row: number): void {
    const step = (from: number, to: number, size: number): { dir: 1 | -1 | 0; count: number } => {
      const forward = (to - from + size) % size;
      const backward = (from - to + size) % size;
      if (forward === 0) {
        return { dir: 0, count: 0 };
      }
      return forward <= backward ? { dir: 1, count: forward } : { dir: -1, count: backward };
    };
    const h = step(this.player.col, col, GRID_COLS);
    const v = step(this.player.row, row, GRID_ROWS);
    for (let i = 0; i < h.count; i += 1) {
      this.manager.input.push(h.dir > 0 ? 'right' : 'left');
    }
    for (let i = 0; i < v.count; i += 1) {
      this.manager.input.push(v.dir > 0 ? 'down' : 'up');
    }
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

    const cellPos = this.grid.cellScreenPos(this.player.col, this.player.row);
    const cx = cellPos.x + CELL_SIZE / 2;
    const cy = cellPos.y + CELL_SIZE / 2;

    if (this.mission.mode === 'crew') {
      const correct = this.grid.consumeCell(this.player.col, this.player.row);
      if (correct) {
        const before = this.multiplier;
        this.awardObjectiveProgress();
        this.audio.cellEat(this.streak);
        const points = Math.round(10 * before);
        this.effects.scorePop(cx, cy - 14, `+${points}`, COLOURS.GOLD);
        this.effects.burst(cx, cy, [COLOURS.GOLD, COLOURS.CYAN, '#ffffff']);
        if (this.multiplier > before) {
          this.effects.showStamp(`STREAK x${this.multiplier % 1 === 0 ? this.multiplier : this.multiplier.toFixed(1)}!`, COLOURS.GOLD);
          this.audio.streakUp();
        }
        this.statusText = 'Correct! Keep going!';
      } else {
        this.mistakes += 1;
        this.loseLife();
        this.audio.errorBuzz();
        this.effects.sadPuff(cx, cy);
        recordMiss(cell.value.display, cell.value.numeric, this.scenario?.id ?? '');
        this.errorFreeze = { display: cell.value.display, numeric: cell.value.numeric, remainingMs: 2400 };
        this.statusText = 'Oops — that one does not match the rule.';
      }
    } else {
      const correctCell = this.grid.isCorrectCell(this.player.col, this.player.row);
      if (correctCell) {
        this.grid.impostorEatCorrectCell(this.player.col, this.player.row);
        this.mistakes += 1;
        this.loseLife();
        this.audio.errorBuzz();
        this.effects.sadPuff(cx, cy);
        recordMiss(cell.value.display, cell.value.numeric, this.scenario?.id ?? '');
        this.errorFreeze = { display: cell.value.display, numeric: cell.value.numeric, remainingMs: 2400 };
        this.statusText = 'Yikes! You ate a correct answer.';
      } else {
        this.grid.impostorBreakCell(this.player.col, this.player.row);
        const before = this.multiplier;
        this.awardObjectiveProgress();
        this.audio.sabotageEat();
        this.effects.scorePop(cx, cy - 14, `+${Math.round(10 * before)}`, COLOURS.DANGER);
        this.effects.burst(cx, cy, [COLOURS.DANGER, COLOURS.GOLD], 6);
        if (this.multiplier > before) {
          this.effects.showStamp(`STREAK x${this.multiplier % 1 === 0 ? this.multiplier : this.multiplier.toFixed(1)}!`, COLOURS.DANGER);
          this.audio.streakUp();
        }
        this.statusText = 'Sabotage successful!';
        this.checkCrewmateElimination();
        this.raiseSuspicionIfSeen();
        if (this.ended || this.cutscene) {
          return;
        }
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
    this.effects.shake(5, 280);
    this.effects.damageFlash();
    this.statusText = 'The impostor bumped into you!';
    if (this.lives <= 0) {
      this.audio.crewmateEject();
      this.cutscene = new EjectionCutscene('You were ejected . . .', COLOURS.PLAYER_CREW, () => this.goToGameOver());
      return;
    }
    this.wanderer.spawnAtEdge(this.player.col, this.player.row);
    this.syncHud();
  }

  private checkCrewmateElimination(): void {
    if (!this.grid) {
      return;
    }
    let eliminated = 0;
    let colour = COLOURS.AI_CREW_1;
    for (const crewmate of this.crewmates) {
      if (crewmate.alive && crewmate.col === this.player.col && crewmate.row === this.player.row) {
        crewmate.eliminate();
        colour = crewmate.personality.colour;
        this.score += 25;
        this.suspicion = Math.max(0, this.suspicion - 1);
        eliminated += 1;
      }
    }
    if (eliminated > 0) {
      const pos = this.grid.cellScreenPos(this.player.col, this.player.row);
      this.effects.scorePop(pos.x + CELL_SIZE / 2, pos.y + 8, '+25', COLOURS.GOLD);
      this.audio.crewmateEject();
      this.statusText = eliminated > 1 ? 'Double sabotage! Crewmates eliminated.' : 'Crewmate eliminated!';
      this.cutscene = new EjectionCutscene('A crewmate was ejected', colour, () => {});
    }
  }

  /** Breaking a cell with a crewmate nearby raises suspicion; five strikes calls a meeting. */
  private raiseSuspicionIfSeen(): void {
    const wrapped = (a: number, b: number, size: number): number => {
      const d = Math.abs(a - b);
      return Math.min(d, size - d);
    };
    const seen = this.crewmates.some(
      (c) =>
        c.alive &&
        wrapped(c.col, this.player.col, GRID_COLS) + wrapped(c.row, this.player.row, GRID_ROWS) <= 2,
    );
    if (!seen) {
      return;
    }
    this.suspicion += 1;
    this.audio.suspicionSting();
    if (this.suspicion >= 5) {
      this.statusText = 'Emergency meeting! You were caught!';
      this.audio.eliminationSting();
      this.cutscene = new EjectionCutscene('The crew caught you!', COLOURS.PLAYER_IMPOSTOR, () => this.goToGameOver('caught'));
      return;
    }
    this.effects.showStamp('SEEN!', COLOURS.DANGER);
    this.statusText = `A crewmate saw you! Suspicion ${this.suspicion}/5`;
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
      const accuracy = this.getAccuracy();
      const badges = 1 + (accuracy >= 0.8 ? 1 : 0) + (accuracy >= 0.8 && this.bonusAwarded ? 1 : 0);
      const progression = recordStageResult(this.stage.id, this.mission.mode, this.mission.scenarioIndex, this.score, this.elapsedMs, badges);
      const nextMission = this.buildNextMission(progression.stageJustCompleted);
      const completeParams: CompleteSceneParams = {
        ...this.mission,
        stageTitle: this.stage.title,
        scenarioTitle: this.scenario.title,
        score: this.score,
        accuracy,
        timeMs: this.elapsedMs,
        lives: this.lives,
        bonusAwarded: this.bonusAwarded,
        badges,
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

  private goToGameOver(reason?: 'caught'): void {
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
      reason: reason ?? (this.livesLostToImpostor > this.mistakes ? 'impostor' : 'mistakes'),
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
    this.hud.setO2(this.scenario ? Math.max(0, 1 - this.elapsedMs / (this.scenario.parTime * 1000)) : 0);
    this.hud.setSuspicion(this.mission.mode === 'impostor' ? this.suspicion : -1, 5);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.cutscene) {
      this.cutscene.draw(ctx, this.rr);
      return;
    }

    const shakeOffset = this.effects.shakeOffset();
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    drawSpaceBackground(ctx, this.elapsedMs, this.stars);

    // Impostor mode plays under emergency lighting — same room, redder mood
    if (this.mission?.mode === 'impostor') {
      const sweep = (this.elapsedMs * 0.0004) % (Math.PI * 2);
      const sx = CANVAS_WIDTH / 2 + Math.cos(sweep) * 180;
      const grad = ctx.createRadialGradient(sx, CANVAS_HEIGHT / 2, 40, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT);
      grad.addColorStop(0, 'rgba(180, 30, 30, 0.10)');
      grad.addColorStop(1, 'rgba(90, 10, 20, 0.16)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.fillStyle = COLOURS.GRID_BG;
    ctx.fillRect(
      GRID_OFFSET_X - 12,
      GRID_OFFSET_Y - 10,
      GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP + 24,
      GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP + 20,
    );

    if (this.grid) {
      this.grid.draw(this.rr);

      // Danger telegraph: pulsing ring around the answer being chewed
      const chew = this.wanderer?.chewTarget;
      if (chew && this.grid) {
        const pos = this.grid.cellScreenPos(chew.col, chew.row);
        const pulse = 0.5 + 0.5 * Math.sin(this.elapsedMs * 0.012);
        ctx.save();
        ctx.strokeStyle = COLOURS.DANGER;
        ctx.lineWidth = 3 + pulse * 2;
        ctx.globalAlpha = 0.55 + pulse * 0.45;
        ctx.strokeRect(pos.x - 3, pos.y - 3, CELL_SIZE + 6, CELL_SIZE + 6);
        ctx.restore();
      }

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
    if (!this.paused) {
      ctx.fillText(this.statusText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 18);
    }
    ctx.restore();

    this.effects.draw(ctx);
    ctx.restore(); // shake translate

    if (this.errorFreeze) {
      this.drawErrorFreeze(ctx);
    }

    if (this.paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawPanel(ctx, 130, 130, 340, 170, '#10233a', '#4a7070', 3);

      // The player takes a nap on top of the panel
      const nap = Math.sin(this.elapsedMs * 0.002);
      this.rr.crewmate(CANVAS_WIDTH / 2 + 120, 124 + nap, COLOURS.PLAYER_CREW, 4, 0.7);
      ctx.font = "12px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c8e8e0';
      ctx.textAlign = 'left';
      ctx.fillText('z', CANVAS_WIDTH / 2 + 142, 102 - nap * 2);
      ctx.fillText('z', CANVAS_WIDTH / 2 + 152, 92 - nap * 3);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "24px 'Press Start 2P', monospace";
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 5;
      ctx.strokeText('PAUSED', CANVAS_WIDTH / 2, 172);
      ctx.fillStyle = '#f0fafa';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 172);
      ctx.font = "14px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#c8e8e0';
      ctx.fillText('Tap or press Space to resume', CANVAS_WIDTH / 2, 216);
      ctx.fillText('Tap here or Backspace for stage select', CANVAS_WIDTH / 2, 248);
      ctx.restore();
    }
  }

  /** Teaching overlay: why the eaten answer was wrong, in numbers a child can check. */
  private drawErrorFreeze(ctx: CanvasRenderingContext2D): void {
    if (!this.errorFreeze || !this.scenario || !this.mission) {
      return;
    }
    const { display, numeric } = this.errorFreeze;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawPanel(ctx, 110, 128, 380, 168, '#3a2020', COLOURS.DANGER, 3);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isBareNumber = !display.includes('+') && !display.includes('−');
    const headline = isBareNumber ? `${display}` : `${display} = ${numeric}`;
    ctx.font = "26px 'Fredoka One', sans-serif";
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 6;
    ctx.strokeText(headline, CANVAS_WIDTH / 2, 178);
    ctx.fillStyle = '#ffd0d8';
    ctx.fillText(headline, CANVAS_WIDTH / 2, 178);

    const ruleLine = this.mission.mode === 'impostor'
      ? 'That one was CORRECT — leave those alone!'
      : `We need: ${this.scenario.ruleText.toLowerCase()}`;
    ctx.font = "16px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(ruleLine, CANVAS_WIDTH / 2, 222);

    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#9ab8b8';
    ctx.fillText('tap or press any key to keep going', CANVAS_WIDTH / 2, 274);
    ctx.restore();
  }
}
