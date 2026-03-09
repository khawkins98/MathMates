import { Container } from 'pixi.js';
import {
  IMPOSTOR_MOVE_INTERVAL,
  IMPOSTOR_LIFESPAN,
} from '../constants';
import { pickRandom } from '../utils';
import { gridToPixel, pickEdgeCell, getValidAdjacentCells } from './gridHelpers';

const FLICKER_MIN = 0.4;
const FLICKER_MAX = 0.8;
const FLICKER_SPEED = 3; // oscillations per second

export class Impostor extends Container {
  private _gridCol = 0;
  private _gridRow = 0;
  private moveTimer = 0;
  private lifespanTimer = 0;
  private flickerElapsed = 0;

  constructor(playerCol: number, playerRow: number) {
    super();
    this.spawnAtEdge(playerCol, playerRow);
    this.alpha = FLICKER_MIN;
  }

  private spawnAtEdge(playerCol: number, playerRow: number): void {
    const chosen = pickEdgeCell(playerCol, playerRow);
    this._gridCol = chosen.col;
    this._gridRow = chosen.row;
    this.updatePixelPosition();
  }

  private updatePixelPosition(): void {
    const { x, y } = gridToPixel(this._gridCol, this._gridRow);
    this.x = x;
    this.y = y;
  }

  private moveToRandomAdjacent(): void {
    const valid = getValidAdjacentCells(this._gridCol, this._gridRow);
    if (valid.length > 0) {
      const chosen = pickRandom(valid);
      this._gridCol = chosen.col;
      this._gridRow = chosen.row;
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
