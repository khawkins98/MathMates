import { Container } from 'pixi.js';
import { CELL_SIZE, GUTTER } from '../constants';

const BOB_AMPLITUDE = 2; // pixels
const BOB_PERIOD = 1000; // ms

export class Player extends Container {
  private _gridCol = 0;
  private _gridRow = 0;
  private bobElapsed = 0;
  private baseY = 0;

  constructor() {
    super();
  }

  get gridCol(): number {
    return this._gridCol;
  }

  get gridRow(): number {
    return this._gridRow;
  }

  moveTo(col: number, row: number): void {
    this._gridCol = col;
    this._gridRow = row;

    this.x = col * (CELL_SIZE + GUTTER) + CELL_SIZE / 2;
    this.baseY = row * (CELL_SIZE + GUTTER) + CELL_SIZE / 2;
    this.y = this.baseY;
  }

  getGridPosition(): { col: number; row: number } {
    return { col: this._gridCol, row: this._gridRow };
  }

  update(dt: number): void {
    this.bobElapsed += dt;

    const phase = (this.bobElapsed / BOB_PERIOD) * Math.PI * 2;
    this.y = this.baseY + Math.sin(phase) * BOB_AMPLITUDE;
  }
}
