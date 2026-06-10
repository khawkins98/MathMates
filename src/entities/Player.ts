import { CELL_SPRITE_ANCHOR_Y, CELL_SPRITE_CENTER_X, GRID_COLS, GRID_ROWS } from '@/constants';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import type { Grid } from './Grid';

export class Player {
  private _col: number;
  private _row: number;
  private bobTimer = 0;

  constructor(startCol = 0, startRow = 0) {
    this._col = startCol;
    this._row = startRow;
  }

  get col(): number {
    return this._col;
  }

  get row(): number {
    return this._row;
  }

  move(dir: 'up' | 'down' | 'left' | 'right'): void {
    switch (dir) {
      case 'up':
        this._row = (this._row - 1 + GRID_ROWS) % GRID_ROWS;
        break;
      case 'down':
        this._row = (this._row + 1) % GRID_ROWS;
        break;
      case 'left':
        this._col = (this._col - 1 + GRID_COLS) % GRID_COLS;
        break;
      case 'right':
        this._col = (this._col + 1) % GRID_COLS;
        break;
    }
  }

  update(dt: number): void {
    this.bobTimer += dt;
  }

  draw(rr: RoughRenderer, grid: Grid, colour: string): void {
    const { x, y } = grid.cellScreenPos(this._col, this._row);
    const bob = Math.sin(this.bobTimer * 0.004) * 2;
    const seed = Math.floor(this.bobTimer / 250);
    // Anchored low in the cell so the expression text above stays readable.
    rr.crewmate(x + CELL_SPRITE_CENTER_X, y + CELL_SPRITE_ANCHOR_Y + bob, colour, seed, 0.9);
  }
}
