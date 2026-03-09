import { Container } from 'pixi.js';
import {
  AI_MOVE_INTERVAL_BASE,
  AI_MOVE_INTERVAL_MIN,
  AI_CHASE_DISTANCE,
  AI_DWELL_DURATION,
} from '../constants';
import { pickRandom } from '../utils';
import { gridToPixel, manhattan, pickEdgeCell, getValidAdjacentCells } from './gridHelpers';
import type { Grid } from './Grid';

export interface AIPersonality {
  name: string;
  colorIndex: number; // index into CREW_COLORS
  speedOffset: number; // ms added to base move interval (negative = faster)
  seekCorrect: number; // weight 0-1
  seekWrong: number; // weight 0-1
  random: number; // weight 0-1
  chasePlayer: number; // weight 0-1
}

export const AI_PERSONALITIES: AIPersonality[] = [
  {
    name: 'Cautious',
    colorIndex: 1, // blue
    speedOffset: 200,
    seekCorrect: 0.50,
    seekWrong: 0.20,
    random: 0.20,
    chasePlayer: 0.10,
  },
  {
    name: 'Wanderer',
    colorIndex: 2, // green
    speedOffset: 0,
    seekCorrect: 0.30,
    seekWrong: 0.40,
    random: 0.25,
    chasePlayer: 0.05,
  },
  {
    name: 'Suspicious',
    colorIndex: 4, // orange
    speedOffset: -200,
    seekCorrect: 0.40,
    seekWrong: 0.20,
    random: 0.15,
    chasePlayer: 0.25,
  },
];

/**
 * AI-controlled crewmate with personality-driven behavior.
 * Used as the enemy in Impostor Mode.
 */
export class AICrewmate extends Container {
  private _gridCol = 0;
  private _gridRow = 0;
  private moveTimer = 0;
  private moveInterval: number;
  private _alive = true;
  private personality: AIPersonality;

  // Dwell mechanic
  private dwellTimer = 0;
  private _isDwelling = false;
  private dwellDuration: number;
  private dwellElapsed = 0; // for pulse animation

  constructor(
    personality: AIPersonality,
    playerCol: number,
    playerRow: number,
    difficulty: number,
  ) {
    super();
    this.personality = personality;
    this.moveInterval = this.calcMoveInterval(difficulty) + personality.speedOffset;
    this.dwellDuration = this.moveInterval * AI_DWELL_DURATION;
    this.spawnAtEdge(playerCol, playerRow);
  }

  private calcMoveInterval(difficulty: number): number {
    const t = Math.min((difficulty - 1) / 4, 1);
    return AI_MOVE_INTERVAL_BASE + (AI_MOVE_INTERVAL_MIN - AI_MOVE_INTERVAL_BASE) * t;
  }

  private spawnAtEdge(playerCol: number, playerRow: number): void {
    const chosen = pickEdgeCell(playerCol, playerRow);
    this._gridCol = chosen.col;
    this._gridRow = chosen.row;
    this.updatePixelPosition();
  }

  spawnAt(col: number, row: number): void {
    this._gridCol = col;
    this._gridRow = row;
    this.updatePixelPosition();
  }

  respawnAtEdge(playerCol: number, playerRow: number): void {
    this.spawnAtEdge(playerCol, playerRow);
    this.moveTimer = 0;
    this.cancelDwell();
  }

  private updatePixelPosition(): void {
    const { x, y } = gridToPixel(this._gridCol, this._gridRow);
    this.x = x;
    this.y = y;
  }

  get gridCol(): number {
    return this._gridCol;
  }

  get gridRow(): number {
    return this._gridRow;
  }

  get alive(): boolean {
    return this._alive;
  }

  get personalityConfig(): AIPersonality {
    return this.personality;
  }

  eliminate(): void {
    this._alive = false;
    this.cancelDwell();
  }

  checkCollision(playerCol: number, playerRow: number): boolean {
    return this._alive && this._gridCol === playerCol && this._gridRow === playerRow;
  }

  private cancelDwell(): void {
    this._isDwelling = false;
    this.dwellTimer = 0;
    this.dwellElapsed = 0;
    this.scale.set(1);
  }

  /**
   * Returns true if the AI completed dwelling on an unconsumed correct cell.
   * Caller should handle the consumption via grid.consumeCellWithFlash.
   *
   * When playerCol/playerRow are null, the crewmate will not chase the player.
   */
  update(
    dt: number,
    grid: Grid,
    playerCol: number | null,
    playerRow: number | null,
  ): boolean {
    if (!this._alive) return false;

    // Dwell pulse animation
    if (this._isDwelling) {
      this.dwellElapsed += dt;
      const pulse = 1.0 + 0.1 * Math.sin(this.dwellElapsed * 0.01);
      this.scale.set(pulse);

      this.dwellTimer += dt;
      if (this.dwellTimer >= this.dwellDuration) {
        // Dwell complete — consume signal
        this.cancelDwell();
        return true;
      }
      // Move tick can interrupt dwell — crewmate moves away, cancelling it
      this.moveTimer += dt;
      if (this.moveTimer >= this.moveInterval) {
        this.moveTimer -= this.moveInterval;
        this.cancelDwell();
        const target = this.pickMoveTarget(grid, playerCol, playerRow);
        if (target) {
          this._gridCol = target.col;
          this._gridRow = target.row;
          this.updatePixelPosition();
          this.checkAndStartDwell(grid);
        }
      }
      return false;
    }

    this.moveTimer += dt;
    if (this.moveTimer < this.moveInterval) return false;
    this.moveTimer -= this.moveInterval;

    const target = this.pickMoveTarget(grid, playerCol, playerRow);

    if (target) {
      this._gridCol = target.col;
      this._gridRow = target.row;
      this.updatePixelPosition();

      // Check if we landed on an unconsumed correct cell — start dwelling
      if (this.checkAndStartDwell(grid)) {
        return false; // dwelling started, no consume yet
      }
    }

    return false;
  }

  private checkAndStartDwell(grid: Grid): boolean {
    if (grid.isCorrectCell(this._gridCol, this._gridRow)) {
      const cell = grid.getCellAt(this._gridCol, this._gridRow);
      if (cell && cell.state !== 'consumed') {
        this._isDwelling = true;
        this.dwellTimer = 0;
        this.dwellElapsed = 0;
        return true;
      }
    }
    return false;
  }

  private pickMoveTarget(
    grid: Grid,
    playerCol: number | null,
    playerRow: number | null,
  ): { col: number; row: number } | null {
    const roll = Math.random();
    const { seekWrong, random, chasePlayer } = this.personality;

    if (roll < random) {
      return this.randomAdjacentMove();
    } else if (roll < random + chasePlayer) {
      if (playerCol != null && playerRow != null) {
        const dist = manhattan(this._gridCol, this._gridRow, playerCol, playerRow);
        if (dist <= AI_CHASE_DISTANCE) {
          return this.stepToward(playerCol, playerRow);
        }
      }
      return this.seekNearest(grid.getUnconsumedCorrectPositions());
    } else if (roll < random + chasePlayer + seekWrong) {
      // Crewmates only eat correct cells — redirect to correct-seeking
      return this.seekNearest(grid.getUnconsumedCorrectPositions()) ?? this.randomAdjacentMove();
    } else {
      // seekCorrect (remaining weight)
      return this.seekNearest(grid.getUnconsumedCorrectPositions());
    }
  }

  private randomAdjacentMove(): { col: number; row: number } | null {
    const valid = getValidAdjacentCells(this._gridCol, this._gridRow);
    return valid.length > 0 ? pickRandom(valid) : null;
  }

  private stepToward(targetCol: number, targetRow: number): { col: number; row: number } | null {
    const valid = getValidAdjacentCells(this._gridCol, this._gridRow);
    if (valid.length === 0) return null;

    let best = valid[0];
    let bestDist = manhattan(best.col, best.row, targetCol, targetRow);
    for (let i = 1; i < valid.length; i++) {
      const d = manhattan(valid[i].col, valid[i].row, targetCol, targetRow);
      if (d < bestDist) {
        bestDist = d;
        best = valid[i];
      }
    }
    return best;
  }

  private seekNearest(targets: Array<{ col: number; row: number }>): { col: number; row: number } | null {
    if (targets.length === 0) return null;

    let nearest = targets[0];
    let bestDist = manhattan(this._gridCol, this._gridRow, nearest.col, nearest.row);
    for (let i = 1; i < targets.length; i++) {
      const d = manhattan(this._gridCol, this._gridRow, targets[i].col, targets[i].row);
      if (d < bestDist) {
        bestDist = d;
        nearest = targets[i];
      }
    }

    return this.stepToward(nearest.col, nearest.row);
  }
}
