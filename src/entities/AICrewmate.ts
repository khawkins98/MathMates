import { Container } from 'pixi.js';
import {
  AI_MOVE_INTERVAL_BASE,
  AI_MOVE_INTERVAL_MIN,
  AI_CHASE_DISTANCE,
} from '../constants';
import { pickRandom } from '../utils';
import { gridToPixel, pickEdgeCell, getValidAdjacentCells } from './gridHelpers';
import type { Grid } from './Grid';

function manhattan(c1: number, r1: number, c2: number, r2: number): number {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2);
}

/**
 * AI-controlled crewmate that hunts correct cells and chases the player.
 * Used as the enemy in Impostor Mode.
 */
export class AICrewmate extends Container {
  private _gridCol = 0;
  private _gridRow = 0;
  private moveTimer = 0;
  private moveInterval: number;

  constructor(
    playerCol: number,
    playerRow: number,
    difficulty: number,
  ) {
    super();
    this.moveInterval = this.calcMoveInterval(difficulty);
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

  respawnAtEdge(playerCol: number, playerRow: number): void {
    this.spawnAtEdge(playerCol, playerRow);
    this.moveTimer = 0;
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

  checkCollision(playerCol: number, playerRow: number): boolean {
    return this._gridCol === playerCol && this._gridRow === playerRow;
  }

  /**
   * Returns true if the AI moved onto an unconsumed correct cell.
   * Caller should handle the consumption via grid.consumeCellWithFlash.
   */
  update(dt: number, grid: Grid, playerCol: number, playerRow: number): boolean {
    this.moveTimer += dt;
    if (this.moveTimer < this.moveInterval) return false;
    this.moveTimer -= this.moveInterval;

    const target = this.pickMoveTarget(grid, playerCol, playerRow);

    if (target) {
      this._gridCol = target.col;
      this._gridRow = target.row;
      this.updatePixelPosition();

      // Check if we landed on an unconsumed correct cell
      if (grid.isCorrectCell(this._gridCol, this._gridRow)) {
        const cell = grid.getCellAt(this._gridCol, this._gridRow);
        if (cell && cell.state !== 'consumed') {
          return true;
        }
      }
    }

    return false;
  }

  private pickMoveTarget(
    grid: Grid,
    playerCol: number,
    playerRow: number,
  ): { col: number; row: number } | null {
    const roll = Math.random();

    if (roll < 0.1) {
      // 10%: random move
      return this.randomAdjacentMove();
    } else if (roll < 0.3) {
      // 20%: chase player if within range, else seek correct
      const dist = manhattan(this._gridCol, this._gridRow, playerCol, playerRow);
      if (dist <= AI_CHASE_DISTANCE) {
        return this.stepToward(playerCol, playerRow);
      }
      return this.seekNearestCorrect(grid);
    } else {
      // 70%: greedy walk toward nearest unconsumed correct cell
      return this.seekNearestCorrect(grid);
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

  private seekNearestCorrect(grid: Grid): { col: number; row: number } | null {
    const targets = grid.getUnconsumedCorrectPositions();
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
