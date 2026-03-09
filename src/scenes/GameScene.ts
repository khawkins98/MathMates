import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { Grid } from '@/entities/Grid';
import { Player } from '@/entities/Player';
import { Impostor } from '@/entities/Impostor';
import { AICrewmate, AI_PERSONALITIES } from '@/entities/AICrewmate';
import { HUD } from '@/ui/HUD';
import { EliminationOverlay, type EliminationVariant } from '@/ui/EliminationOverlay';
import { ScoringSystem } from '@/systems/ScoringSystem';
import { LivesSystem } from '@/systems/LivesSystem';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { createImpostorSprite } from '@/sprites/ImpostorSprite';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { pickEdgeCells, manhattan } from '@/entities/gridHelpers';
import {
  GRID_COLS,
  GRID_ROWS,
  GAME_WIDTH,
  GAME_HEIGHT,
  HUD_HEIGHT,
  GRID_WIDTH,
  GRID_HEIGHT,
  STARTING_LIVES,
  IMPOSTOR_SPAWN_INTERVAL,
  AI_CREWMATE_COUNT,
  AI_EJECT_DURATION,
  COLORS,
} from '@/constants';
import type { StageDefinition, InputAction, GameMode } from '@/types';

const FLOAT_DURATION = 800; // ms for floating text animation

const FLOAT_TEXT_STYLE = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 14,
  fontWeight: 'bold',
  fill: COLORS.SUCCESS_GREEN,
});

interface GameSceneData {
  stage: StageDefinition;
  missionIndex: number;
  mode?: GameMode;
}

interface EjectingCrewmate {
  container: AICrewmate;
  elapsed: number;
}

interface FloatingText {
  text: Text;
  elapsed: number;
}

export class GameScene extends Scene {
  private manager: SceneManager;

  // Entities
  private grid: Grid | null = null;
  private player: Player | null = null;
  private impostor: Impostor | null = null;
  private aiCrewmates: AICrewmate[] = [];

  // Eject / floating text animations
  private ejectingCrewmates: EjectingCrewmate[] = [];
  private floatingTexts: FloatingText[] = [];

  // UI
  private hud: HUD | null = null;
  private eliminationOverlay: EliminationOverlay | null = null;

  // Systems
  private scoring: ScoringSystem | null = null;
  private lives: LivesSystem | null = null;

  // State
  private playing = false;
  private paused = false;
  private eliminationPlaying = false;
  private startTime = 0;
  private impostorEnabled = false;
  private impostorSpawnTimer = 0;
  private impostorScheduled = false;
  private wrongMathCount = 0;
  private mode: GameMode = 'crew';

  // Pause overlay
  private pauseOverlay: Graphics | null = null;

  // Stage data (kept for navigation)
  private stage: StageDefinition | null = null;
  private missionIndex = 0;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(data?: unknown): void {
    const sceneData = data as GameSceneData;
    const { stage, missionIndex } = sceneData;
    this.stage = stage;
    this.missionIndex = missionIndex;
    this.mode = sceneData.mode ?? 'crew';

    // Reset state
    this.playing = true;
    this.paused = false;
    this.eliminationPlaying = false;
    this.impostorSpawnTimer = 0;
    this.impostorScheduled = false;
    this.impostor = null;
    this.aiCrewmates = [];
    this.ejectingCrewmates = [];
    this.floatingTexts = [];
    this.wrongMathCount = 0;
    this.pauseOverlay = null;

    // Generate grid data from the stage definition
    const gridData = stage.generateGrid(missionIndex, GRID_COLS, GRID_ROWS);

    // Create grid entity and populate
    this.grid = new Grid();
    this.grid.populate(gridData);

    // Center grid horizontally, position below HUD
    this.grid.x = Math.round((GAME_WIDTH - GRID_WIDTH) / 2);
    this.grid.y = Math.round(HUD_HEIGHT + (GAME_HEIGHT - HUD_HEIGHT - GRID_HEIGHT) / 2);
    this.root.addChild(this.grid);

    // Create player at grid position (0, 0)
    this.player = new Player();
    if (this.mode === 'impostor') {
      // Player is the impostor in impostor mode
      const impostorSprite = createImpostorSprite();
      impostorSprite.pivot.set(11, 12);
      impostorSprite.y = 16;
      impostorSprite.scale.set(0.8);
      this.player.addChild(impostorSprite);
    } else {
      const crewmate = createCrewmateSprite(CREW_COLORS[0]);
      crewmate.pivot.set(11, 12);
      crewmate.y = 16;
      crewmate.scale.set(0.8);
      this.player.addChild(crewmate);
    }
    this.player.moveTo(0, 0);
    this.grid.addChild(this.player);

    // Highlight starting cell
    this.grid.highlightCell(0, 0);

    // Create HUD
    this.hud = new HUD();
    if (this.mode === 'impostor') {
      // Invert rule text for impostor mode
      const baseRule = stage.getRuleText(missionIndex);
      this.hud.setRule(`NOT ${baseRule}`);
      this.hud.setModeIndicator('impostor');
      this.hud.setProgress(0, this.grid.totalCorrect, COLORS.SUCCESS_GREEN);
    } else {
      this.hud.setRule(stage.getRuleText(missionIndex));
      this.hud.setProgress(0, this.grid.totalCorrect, COLORS.SUCCESS_GREEN);
    }
    this.root.addChild(this.hud);

    // Create scoring and lives systems
    this.scoring = new ScoringSystem();
    this.lives = new LivesSystem();

    // Initialize HUD displays
    this.hud.setScore(0);
    this.hud.setMultiplier(1);
    this.hud.setLives(this.lives.remaining, STARTING_LIVES);

    // Quit button (top-right, above grid)
    const quitBtn = new ButtonSprite('Quit', 50, 22, COLORS.HULL_GREY);
    quitBtn.x = GAME_WIDTH - 58;
    quitBtn.y = 5;
    quitBtn.onClick = () => this.quitToMenu();
    this.root.addChild(quitBtn);

    // Create elimination overlay (on top of everything)
    this.eliminationOverlay = new EliminationOverlay();
    this.root.addChild(this.eliminationOverlay);

    if (this.mode === 'impostor') {
      // Spawn AI crewmates as enemies
      this.spawnAICrewmates();
    } else {
      // Determine if impostor is active for this mission (crew mode only)
      this.impostorEnabled =
        stage.impostorEnabled && this.manager.save.settings.impostorEnabled;

      if (this.impostorEnabled) {
        this.scheduleImpostorSpawn();
      }
    }

    // Record start time
    this.startTime = performance.now();

    // Enable input
    this.manager.input.clear();
    this.manager.input.setEnabled(true);
  }

  update(dt: number): void {
    // Always update the elimination overlay animation if it's playing
    if (this.eliminationOverlay) {
      this.eliminationOverlay.update(dt);
    }

    // Process pause/unpause even while paused
    if (this.paused) {
      const action = this.manager.input.shift();
      if (action === 'pause') {
        this.togglePause();
      }
      return;
    }

    if (this.eliminationPlaying) return;
    if (!this.playing) return;

    // Update player idle bobbing animation
    this.player?.update(dt);

    // Update grid cell flash animations
    this.grid?.update(dt);

    // Update HUD (impostor warning pulse)
    this.hud?.update(dt);

    // Update eject animations
    this.updateEjectAnimations(dt);

    // Update floating texts
    this.updateFloatingTexts(dt);

    // Handle impostor logic or AI crewmate logic
    if (this.mode === 'impostor') {
      this.updateAICrewmates(dt);
    } else if (this.impostorEnabled) {
      this.updateImpostor(dt);
    }

    // Process one input action per frame to prevent teleporting
    const action = this.manager.input.shift();
    if (action) {
      this.handleAction(action);
    }
  }

  exit(): void {
    // Remove impostor reference before destroying children
    this.removeImpostor();

    // Remove AI crewmate references
    this.removeAllAICrewmates();

    // Clean up eject animations
    for (const ej of this.ejectingCrewmates) {
      ej.container.removeFromParent();
      ej.container.destroy({ children: true });
    }
    this.ejectingCrewmates = [];

    // Clean up floating texts
    for (const ft of this.floatingTexts) {
      ft.text.removeFromParent();
      ft.text.destroy();
    }
    this.floatingTexts = [];

    // Remove pause overlay if showing
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy({ children: true });
      this.pauseOverlay = null;
    }

    // Destroy all display objects to free GPU geometry and textures
    this.destroyChildren();

    // Reset state
    this.playing = false;
    this.paused = false;
    this.eliminationPlaying = false;
    this.impostorScheduled = false;
    this.impostorSpawnTimer = 0;
    this.wrongMathCount = 0;
    this.mode = 'crew';

    // Temporarily disable input to prevent stale actions carrying over
    this.manager.input.setEnabled(false);
    this.manager.input.clear();

    // Null out references
    this.grid = null;
    this.player = null;
    this.hud = null;
    this.eliminationOverlay = null;
    this.scoring = null;
    this.lives = null;
    this.stage = null;
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  private handleAction(action: InputAction): void {
    switch (action) {
      case 'move_up':
        this.movePlayer(0, -1);
        break;
      case 'move_down':
        this.movePlayer(0, 1);
        break;
      case 'move_left':
        this.movePlayer(-1, 0);
        break;
      case 'move_right':
        this.movePlayer(1, 0);
        break;
      case 'eat':
        this.eatCurrentCell();
        break;
      case 'sus':
        this.toggleSusCurrentCell();
        break;
      case 'pause':
        this.togglePause();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Player movement (wrapping)
  // ---------------------------------------------------------------------------

  private movePlayer(dc: number, dr: number): void {
    if (!this.player || !this.grid) return;

    const { col, row } = this.player.getGridPosition();

    // Unhighlight old cell
    this.grid.unhighlightCell(col, row);

    // Compute new position with wrapping
    const newCol = ((col + dc) % GRID_COLS + GRID_COLS) % GRID_COLS;
    const newRow = ((row + dr) % GRID_ROWS + GRID_ROWS) % GRID_ROWS;

    this.player.moveTo(newCol, newRow);

    // Highlight new cell (only if not already consumed)
    this.grid.highlightCell(newCol, newRow);
  }

  // ---------------------------------------------------------------------------
  // Eat logic
  // ---------------------------------------------------------------------------

  private eatCurrentCell(): void {
    if (!this.player || !this.grid || !this.scoring || !this.lives || !this.hud) return;

    const { col, row } = this.player.getGridPosition();

    // Check if cell is already consumed before attempting
    const cell = this.grid.getCellAt(col, row);
    if (!cell || cell.state === 'consumed') {
      return;
    }

    if (this.mode === 'impostor') {
      this.eatCurrentCellImpostor(col, row);
    } else {
      this.eatCurrentCellCrew(col, row);
    }
  }

  private eatCurrentCellCrew(col: number, row: number): void {
    if (!this.grid || !this.scoring || !this.lives || !this.hud) return;

    const wasCorrect = this.grid.consumeCell(col, row);

    if (wasCorrect) {
      this.scoring.recordCorrect();
      this.manager.sound.cellEat();

      this.hud.setScore(this.scoring.score);
      this.hud.setMultiplier(this.scoring.multiplier);
      this.hud.setProgress(this.grid.correctEaten, this.grid.totalCorrect, COLORS.SUCCESS_GREEN);

      if (this.grid.isCleared()) {
        this.handleWin();
      }
    } else {
      this.scoring.recordWrong();
      this.lives.loseLife();
      this.wrongMathCount++;
      this.manager.sound.errorBuzz();

      this.hud.setMultiplier(this.scoring.multiplier);
      this.triggerElimination();
    }
  }

  private eatCurrentCellImpostor(col: number, row: number): void {
    if (!this.grid || !this.scoring || !this.lives || !this.hud) return;

    const isCorrect = this.grid.isCorrectCell(col, row);

    if (!isCorrect) {
      // Eating a wrong cell is SUCCESS in impostor mode (green flash)
      this.grid.consumeCellWithFlash(col, row, 'correct');
      this.scoring.recordCorrect();
      this.manager.sound.sabotageEat();

      this.hud.setScore(this.scoring.score);
      this.hud.setMultiplier(this.scoring.multiplier);

      // Check if any alive crewmate is standing on this cell — eliminate them
      this.checkCrewmateElimination(col, row);

      // Check win: all wrong cells cleared
      if (this.grid.isAllWrongCleared()) {
        this.handleWin();
      }
    } else {
      // Eating a correct cell is a MISTAKE in impostor mode (red flash)
      this.grid.consumeCellWithFlash(col, row, 'error');
      this.scoring.recordWrong();
      this.lives.loseLife();
      this.wrongMathCount++;
      this.manager.sound.errorBuzz();

      this.hud.setMultiplier(this.scoring.multiplier);
      this.triggerElimination('voted_out');
    }
  }

  // ---------------------------------------------------------------------------
  // Sus marking
  // ---------------------------------------------------------------------------

  private toggleSusCurrentCell(): void {
    if (!this.player || !this.grid) return;
    const { col, row } = this.player.getGridPosition();
    this.grid.toggleSusCell(col, row);
  }

  // ---------------------------------------------------------------------------
  // Pause / quit
  // ---------------------------------------------------------------------------

  private togglePause(): void {
    this.paused = !this.paused;

    if (this.paused) {
      // Show pause overlay
      this.pauseOverlay = new Graphics();
      this.pauseOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.6 });
      this.root.addChild(this.pauseOverlay);

      const style = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 32,
        fontWeight: 'bold',
        fill: COLORS.STAR_WHITE,
        align: 'center',
      });
      const pausedText = new Text({ text: 'PAUSED', style });
      pausedText.anchor.set(0.5);
      pausedText.x = GAME_WIDTH / 2;
      pausedText.y = GAME_HEIGHT / 2 - 30;
      this.pauseOverlay.addChild(pausedText);

      const hintStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fill: COLORS.HULL_GREY,
        align: 'center',
      });
      const hintText = new Text({ text: 'Press ESC to resume', style: hintStyle });
      hintText.anchor.set(0.5);
      hintText.x = GAME_WIDTH / 2;
      hintText.y = GAME_HEIGHT / 2 + 10;
      this.pauseOverlay.addChild(hintText);

      // Quit button inside pause overlay
      const quitBtn = new ButtonSprite('Quit Mission', 130, 34, COLORS.CREW_RED);
      quitBtn.x = GAME_WIDTH / 2 - 65;
      quitBtn.y = GAME_HEIGHT / 2 + 40;
      quitBtn.onClick = () => this.quitToMenu();
      this.pauseOverlay.addChild(quitBtn);
    } else {
      // Remove pause overlay
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy({ children: true });
        this.pauseOverlay = null;
      }
    }
  }

  private quitToMenu(): void {
    this.playing = false;
    this.manager.input.setEnabled(false);
    this.manager.goto('SELECT');
  }

  // ---------------------------------------------------------------------------
  // Elimination sequence
  // ---------------------------------------------------------------------------

  private async triggerElimination(variant: EliminationVariant = 'eliminated'): Promise<void> {
    if (!this.eliminationOverlay || !this.hud || !this.lives) return;

    this.eliminationPlaying = true;
    this.manager.input.setEnabled(false);

    // Play sound
    this.manager.sound.eliminationSting();

    // Play visual sequence -- shake the grid container for dramatic effect
    await this.eliminationOverlay.play(this.grid ?? undefined, variant);

    // Update HUD lives display
    this.hud.setLives(this.lives.remaining, STARTING_LIVES);

    // Check for game over
    if (this.lives.isGameOver()) {
      this.playing = false;
      this.manager.goto('GAME_OVER', {
        stage: this.stage,
        missionIndex: this.missionIndex,
        score: this.scoring?.score ?? 0,
        mode: this.mode,
        loseReason: 'lives',
      });
    } else {
      // Resume play
      this.eliminationPlaying = false;
      this.manager.input.setEnabled(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Win condition
  // ---------------------------------------------------------------------------

  private handleWin(): void {
    if (!this.scoring || !this.lives || !this.stage || !this.grid) return;

    this.playing = false;
    this.manager.input.setEnabled(false);

    // Calculate elapsed time
    const elapsed = performance.now() - this.startTime;

    // Apply time bonus
    this.scoring.applyTimeBonus(elapsed, this.stage.parTime);

    // Calculate accuracy
    const successCount = this.mode === 'impostor' ? this.grid.wrongEaten : this.grid.correctEaten;
    const totalAttempts = successCount + this.wrongMathCount;
    const accuracy = totalAttempts > 0 ? successCount / totalAttempts : 1;

    // Play completion sound
    this.manager.sound.missionComplete();

    // Navigate to completion scene
    this.manager.goto('COMPLETE', {
      stage: this.stage,
      missionIndex: this.missionIndex,
      score: this.scoring.score,
      accuracy,
      livesRemaining: this.lives.remaining,
      maxLives: STARTING_LIVES,
      elapsed,
      parTime: this.stage.parTime,
      mode: this.mode,
    });
  }

  // ---------------------------------------------------------------------------
  // Impostor system (crew mode)
  // ---------------------------------------------------------------------------

  private scheduleImpostorSpawn(): void {
    this.impostorSpawnTimer = 0;
    this.impostorScheduled = true;
  }

  private updateImpostor(dt: number): void {
    if (!this.player || !this.grid) return;

    // If an impostor is currently active, update it
    if (this.impostor) {
      this.impostor.update(dt);

      // Check collision with player
      const { col, row } = this.player.getGridPosition();
      if (this.impostor.checkCollision(col, row)) {
        this.handleImpostorCollision();
        return;
      }

      // Check if the impostor has expired
      if (this.impostor.isExpired()) {
        this.removeImpostor();
        this.scheduleImpostorSpawn();
      }
    } else if (this.impostorScheduled) {
      // Count down to next spawn
      this.impostorSpawnTimer += dt;
      if (this.impostorSpawnTimer >= IMPOSTOR_SPAWN_INTERVAL) {
        this.spawnImpostor();
      }
    }
  }

  private spawnImpostor(): void {
    if (!this.grid || !this.player) return;

    this.impostorScheduled = false;
    this.impostorSpawnTimer = 0;

    const { col, row } = this.player.getGridPosition();
    this.impostor = new Impostor(col, row);
    const impostorSprite = createImpostorSprite();
    impostorSprite.pivot.set(11, 12);
    impostorSprite.y = 18;
    impostorSprite.scale.set(0.65);
    this.impostor.addChild(impostorSprite);
    this.grid.addChild(this.impostor);

    // Show warning in HUD
    this.hud?.showImpostorWarning(true);
  }

  private removeImpostor(): void {
    if (this.impostor) {
      this.impostor.removeFromParent();
      this.impostor.destroy({ children: true });
      this.impostor = null;
    }

    // Hide warning in HUD
    this.hud?.showImpostorWarning(false);
  }

  private handleImpostorCollision(): void {
    if (!this.scoring || !this.lives || !this.hud) return;

    // Remove the impostor that caught the player
    this.removeImpostor();

    // Schedule next impostor spawn
    this.scheduleImpostorSpawn();

    // Lose a life but do NOT reset the maths streak — impostor collision
    // is a random game event, not a mathematical mistake
    this.lives.loseLife();
    this.manager.sound.errorBuzz();

    // Trigger elimination sequence
    this.triggerElimination();
  }

  // ---------------------------------------------------------------------------
  // AI Crewmate system (Impostor Mode) — multiple crewmates
  // ---------------------------------------------------------------------------

  private spawnAICrewmates(): void {
    if (!this.grid || !this.player || !this.stage) return;

    const { col, row } = this.player.getGridPosition();
    const edgeCells = pickEdgeCells(AI_CREWMATE_COUNT, col, row);

    for (let i = 0; i < AI_CREWMATE_COUNT; i++) {
      const personality = AI_PERSONALITIES[i];
      const crewmate = new AICrewmate(personality, col, row, this.stage.difficulty);

      // Override spawn position to use distinct edge cells
      if (edgeCells[i]) {
        crewmate.spawnAt(edgeCells[i].col, edgeCells[i].row);
      }

      const sprite = createCrewmateSprite(CREW_COLORS[personality.colorIndex]);
      sprite.pivot.set(11, 12);
      sprite.y = 18;
      sprite.x = (i - 1) * 10;
      sprite.scale.set(0.65);
      crewmate.addChild(sprite);
      this.grid.addChild(crewmate);
      this.aiCrewmates.push(crewmate);
    }

    // Update HUD with crewmate status
    this.updateCrewmateStatusHUD();
  }

  private removeAllAICrewmates(): void {
    for (const crewmate of this.aiCrewmates) {
      crewmate.removeFromParent();
      crewmate.destroy({ children: true });
    }
    this.aiCrewmates = [];
  }

  private updateAICrewmates(dt: number): void {
    if (!this.player || !this.grid || !this.hud || !this.lives) return;

    const { col: pCol, row: pRow } = this.player.getGridPosition();

    // Find nearest alive crewmate to player for chase exclusivity
    let nearestDist = Infinity;
    let nearestIdx = -1;
    for (let i = 0; i < this.aiCrewmates.length; i++) {
      const c = this.aiCrewmates[i];
      if (!c.alive) continue;
      const dist = manhattan(c.gridCol, c.gridRow, pCol, pRow);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    for (let i = 0; i < this.aiCrewmates.length; i++) {
      const crewmate = this.aiCrewmates[i];
      if (!crewmate.alive) continue;

      // Only the nearest crewmate chases — others get null player position
      const canChase = i === nearestIdx;
      const consumed = crewmate.update(
        dt,
        this.grid,
        canChase ? pCol : null,
        canChase ? pRow : null,
      );

      if (consumed) {
        // AI completed dwell and consumes a correct cell
        this.grid.consumeCellWithFlash(crewmate.gridCol, crewmate.gridRow, 'correct');

        // Update progress bar with crewmate progress (threat indicator)
        this.hud.setProgress(this.grid.correctEaten, this.grid.totalCorrect, COLORS.SUCCESS_GREEN);

        // Check if AI cleared all correct cells — player loses
        if (this.grid.isCleared()) {
          this.handleImpostorLose();
          return;
        }
      }

      // Check collision with player (using real player position)
      if (crewmate.checkCollision(pCol, pRow)) {
        this.handleAICrewmateCatch(crewmate);
        return; // Only handle one collision per frame
      }
    }
  }

  private handleAICrewmateCatch(crewmate: AICrewmate): void {
    if (!this.lives || !this.player) return;

    this.lives.loseLife();
    this.manager.sound.errorBuzz();

    // Respawn the crewmate that caught the player at edge
    const { col, row } = this.player.getGridPosition();
    crewmate.respawnAtEdge(col, row);

    this.triggerElimination('voted_out');
  }

  // ---------------------------------------------------------------------------
  // Crewmate Elimination
  // ---------------------------------------------------------------------------

  private checkCrewmateElimination(col: number, row: number): void {
    for (const crewmate of this.aiCrewmates) {
      if (crewmate.alive && crewmate.gridCol === col && crewmate.gridRow === row) {
        this.eliminateCrewmate(crewmate);
        break; // Only eliminate one per cell eat
      }
    }
  }

  private eliminateCrewmate(crewmate: AICrewmate): void {
    if (!this.scoring || !this.hud || !this.grid) return;

    crewmate.eliminate();

    // Award points
    this.scoring.recordElimination();
    this.hud.setScore(this.scoring.score);
    this.hud.setMultiplier(this.scoring.multiplier);

    // Play eject sound
    this.manager.sound.crewmateEject();

    // Start eject animation (spin + shrink)
    this.ejectingCrewmates.push({ container: crewmate, elapsed: 0 });

    // Show floating "+25" text
    const floatText = new Text({ text: '+25', style: FLOAT_TEXT_STYLE });
    floatText.anchor.set(0.5);
    floatText.x = crewmate.x;
    floatText.y = crewmate.y - 10;
    this.grid.addChild(floatText);
    this.floatingTexts.push({ text: floatText, elapsed: 0 });

    // Update HUD crewmate status
    this.updateCrewmateStatusHUD();
  }

  private updateEjectAnimations(dt: number): void {
    for (let i = this.ejectingCrewmates.length - 1; i >= 0; i--) {
      const ej = this.ejectingCrewmates[i];
      ej.elapsed += dt;

      const progress = Math.min(ej.elapsed / AI_EJECT_DURATION, 1);

      // Scale 1 → 0
      ej.container.scale.set(1 - progress);

      // 720 degree spin (2 full rotations)
      ej.container.rotation = progress * Math.PI * 4;

      if (progress >= 1) {
        ej.container.removeFromParent();
        ej.container.destroy({ children: true });
        this.ejectingCrewmates.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.elapsed += dt;

      const progress = Math.min(ft.elapsed / FLOAT_DURATION, 1);

      // Rise upward
      ft.text.y -= dt * 0.03;

      // Fade out
      ft.text.alpha = 1 - progress;

      if (progress >= 1) {
        ft.text.removeFromParent();
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateCrewmateStatusHUD(): void {
    if (!this.hud) return;

    const statuses = this.aiCrewmates.map((c) => ({
      color: CREW_COLORS[c.personalityConfig.colorIndex],
      alive: c.alive,
    }));
    this.hud.setCrewmateStatus(statuses);
  }

  private handleImpostorLose(): void {
    this.playing = false;
    this.manager.input.setEnabled(false);
    this.manager.goto('GAME_OVER', {
      stage: this.stage,
      missionIndex: this.missionIndex,
      score: this.scoring?.score ?? 0,
      mode: this.mode,
      loseReason: 'ai_cleared',
    });
  }
}
