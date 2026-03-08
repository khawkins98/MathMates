import { Container } from 'pixi.js';
import {
  CELL_SIZE,
  GUTTER,
  GRID_COLS,
  GRID_ROWS,
  IMPOSTOR_MOVE_INTERVAL,
  IMPOSTOR_LIFESPAN,
} from '../constants';
import { randomInt, pickRandom } from '../utils';

const FLICKER_MIN = 0.4;
const FLICKER_MAX = 0.8;
const FLICKER_SPEED = 3; // oscillations per second

export class Impostor extends Container {
  private _gridCol = 0;
  private _gridRow = 0;
  private moveTimer = 0;
  private lifespanTimer = 0;
  private flickerElapsed = 0;

  constructor() {
    super();
    this.spawnAtEdge();
    this.alpha = FLICKER_MIN;
  }

  private spawnAtEdge(): void {
    // Pick a random edge cell
    const edge = randomInt(0, 3);
    switch (edge) {
      case 0: // top
        this._gridCol = randomInt(0, GRID_COLS - 1);
        this._gridRow = 0;
        break;
      case 1: // bottom
        this._gridCol = randomInt(0, GRID_COLS - 1);
        this._gridRow = GRID_ROWS - 1;
        break;
      case 2: // left
        this._gridCol = 0;
        this._gridRow = randomInt(0, GRID_ROWS - 1);
        break;
      case 3: // right
        this._gridCol = GRID_COLS - 1;
        this._gridRow = randomInt(0, GRID_ROWS - 1);
        break;
    }

    this.updatePixelPosition();
  }

  private updatePixelPosition(): void {
    this.x = this._gridCol * (CELL_SIZE + GUTTER) + CELL_SIZE / 2;
    this.y = this._gridRow * (CELL_SIZE + GUTTER) + CELL_SIZE / 2;
  }

  private moveToRandomAdjacent(): void {
    const directions: Array<{ dc: number; dr: number }> = [
      { dc: 0, dr: -1 }, // up
      { dc: 0, dr: 1 },  // down
      { dc: -1, dr: 0 }, // left
      { dc: 1, dr: 0 },  // right
    ];

    // Filter to valid adjacent cells (stay within grid)
    const valid = directions.filter(({ dc, dr }) => {
      const nc = this._gridCol + dc;
      const nr = this._gridRow + dr;
      return nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS;
    });

    if (valid.length > 0) {
      const { dc, dr } = pickRandom(valid);
      this._gridCol += dc;
      this._gridRow += dr;
      this.updatePixelPosition();
    }
  }

  getGridPosition(): { col: number; row: number } {
    return { col: this._gridCol, row: this._gridRow };
  }

  isExpired(): boolean {
    return this.lifespanTimer >= IMPOSTOR_LIFESPAN;
  }

  checkCollision(playerCol: number, playerRow: number): boolean {
    return this._gridCol === playerCol && this._gridRow === playerRow;
  }

  update(dt: number): void {
    this.lifespanTimer += dt;
    this.moveTimer += dt;
    this.flickerElapsed += dt;

    // Random walk
    if (this.moveTimer >= IMPOSTOR_MOVE_INTERVAL) {
      this.moveTimer -= IMPOSTOR_MOVE_INTERVAL;
      this.moveToRandomAdjacent();
    }

    // Flickering alpha oscillation
    const phase = (this.flickerElapsed / 1000) * FLICKER_SPEED * Math.PI * 2;
    const mid = (FLICKER_MIN + FLICKER_MAX) / 2;
    const amp = (FLICKER_MAX - FLICKER_MIN) / 2;
    this.alpha = mid + Math.sin(phase) * amp;
  }
}
