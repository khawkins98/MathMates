import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { Grid } from '@/entities/Grid';
import { Player } from '@/entities/Player';
import { Impostor } from '@/entities/Impostor';
import { HUD } from '@/ui/HUD';
import { EliminationOverlay } from '@/ui/EliminationOverlay';
import { ScoringSystem } from '@/systems/ScoringSystem';
import { LivesSystem } from '@/systems/LivesSystem';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { createImpostorSprite } from '@/sprites/ImpostorSprite';
import { ButtonSprite } from '@/sprites/ButtonSprite';
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
  COLORS,
} from '@/constants';
import type { StageDefinition, InputAction } from '@/types';

interface GameSceneData {
  stage: StageDefinition;
  missionIndex: number;
}

export class GameScene extends Scene {
  private manager: SceneManager;

  // Entities
  private grid: Grid | null = null;
  private player: Player | null = null;
  private impostor: Impostor | null = null;

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

  // Stage data (kept for navigation)
  private stage: StageDefinition | null = null;
  private missionIndex = 0;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(data?: unknown): void {
    const { stage, missionIndex } = data as GameSceneData;
    this.stage = stage;
    this.missionIndex = missionIndex;

    // Reset state
    this.playing = true;
    this.paused = false;
    this.eliminationPlaying = false;
    this.impostorSpawnTimer = 0;
    this.impostorScheduled = false;
    this.impostor = null;

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
    const crewmate = createCrewmateSprite(CREW_COLORS[0]);
    crewmate.pivot.set(11, 12); // Center the 22x24 sprite
    this.player.addChild(crewmate);
    this.player.moveTo(0, 0);
    this.grid.addChild(this.player);

    // Highlight starting cell
    this.grid.highlightCell(0, 0);

    // Create HUD
    this.hud = new HUD();
    this.hud.setRule(stage.getRuleText(missionIndex));
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

    // Determine if impostor is active for this mission
    this.impostorEnabled =
      stage.impostorEnabled && this.manager.save.settings.impostorEnabled;

    if (this.impostorEnabled) {
      this.scheduleImpostorSpawn();
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

    if (this.paused || this.eliminationPlaying) {
      return;
    }

    if (!this.playing) return;

    // Update player idle bobbing animation
    this.player?.update(dt);

    // Update grid cell flash animations
    this.grid?.update(dt);

    // Update HUD (impostor warning pulse)
    this.hud?.update(dt);

    // Handle impostor logic
    if (this.impostorEnabled) {
      this.updateImpostor(dt);
    }

    // Process input actions
    const actions = this.manager.input.drain();
    for (const action of actions) {
      this.handleAction(action);
      // If an action triggered elimination or win, stop processing further actions
      if (!this.playing || this.eliminationPlaying) break;
    }
  }

  exit(): void {
    // Clean up all display objects
    this.root.removeChildren();

    // Remove impostor reference
    this.removeImpostor();

    // Reset state
    this.playing = false;
    this.paused = false;
    this.eliminationPlaying = false;
    this.impostorScheduled = false;
    this.impostorSpawnTimer = 0;

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
        this.quitToMenu();
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
      // Already eaten -- ignore
      return;
    }

    const wasCorrect = this.grid.consumeCell(col, row);

    if (wasCorrect) {
      this.scoring.recordCorrect();
      this.manager.sound.cellEat();

      // Update HUD
      this.hud.setScore(this.scoring.score);
      this.hud.setMultiplier(this.scoring.multiplier);

      // Check win condition
      if (this.grid.isCleared()) {
        this.handleWin();
      }
    } else {
      this.scoring.recordWrong();
      this.lives.loseLife();
      this.manager.sound.errorBuzz();

      // Update HUD multiplier (reset on wrong answer)
      this.hud.setMultiplier(this.scoring.multiplier);

      // Trigger elimination sequence
      this.triggerElimination();
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
  // Quit to menu
  // ---------------------------------------------------------------------------

  private quitToMenu(): void {
    this.playing = false;
    this.manager.input.setEnabled(false);
    this.manager.goto('SELECT');
  }

  // ---------------------------------------------------------------------------
  // Elimination sequence
  // ---------------------------------------------------------------------------

  private async triggerElimination(): Promise<void> {
    if (!this.eliminationOverlay || !this.hud || !this.lives) return;

    this.eliminationPlaying = true;
    this.manager.input.setEnabled(false);

    // Play sound
    this.manager.sound.eliminationSting();

    // Play visual sequence -- shake the grid container for dramatic effect
    await this.eliminationOverlay.play(this.grid ?? undefined);

    // Update HUD lives display
    this.hud.setLives(this.lives.remaining, STARTING_LIVES);

    // Check for game over
    if (this.lives.isGameOver()) {
      this.playing = false;
      this.manager.goto('GAME_OVER', {
        stage: this.stage,
        missionIndex: this.missionIndex,
        score: this.scoring?.score ?? 0,
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
    const correctEaten = this.grid.correctEaten;
    const wrongAnswers = this.grid.correctEaten > 0
      ? (STARTING_LIVES - this.lives.remaining)
      : 0;
    const totalAttempts = correctEaten + wrongAnswers;
    const accuracy = totalAttempts > 0 ? correctEaten / totalAttempts : 1;

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
    });
  }

  // ---------------------------------------------------------------------------
  // Impostor system
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
    if (!this.grid) return;

    this.impostorScheduled = false;
    this.impostorSpawnTimer = 0;

    this.impostor = new Impostor();
    const impostorSprite = createImpostorSprite();
    impostorSprite.pivot.set(11, 12); // Center the sprite
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

    // Lose a life but do NOT reset the maths streak — impostor collision
    // is a random game event, not a mathematical mistake
    this.lives.loseLife();
    this.manager.sound.errorBuzz();

    // Trigger elimination sequence
    this.triggerElimination();
  }
}
