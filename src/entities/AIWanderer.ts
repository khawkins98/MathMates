import { GRID_COLS, GRID_ROWS } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import type { Grid } from './Grid';

export class AIWanderer {
  private _col: number;
  private _row: number;
  private moveTimer = 0;
  private readonly moveInterval = 900;

  constructor() {
    this._col = 0;
    this._row = 0;
    this.spawnAtEdge(2, 2);
  }

  get col(): number {
    return this._col;
  }

  get row(): number {
    return this._row;
  }

  spawnAtEdge(avoidCol: number, avoidRow: number): void {
    const edges: Array<{ col: number; row: number }> = [];
    for (let c = 0; c < GRID_COLS; c += 1) {
      edges.push({ col: c, row: 0 });
      edges.push({ col: c, row: GRID_ROWS - 1 });
    }
    for (let r = 1; r < GRID_ROWS - 1; r += 1) {
      edges.push({ col: 0, row: r });
      edges.push({ col: GRID_COLS - 1, row: r });
    }
    const far = edges.filter((edge) => Math.abs(edge.col - avoidCol) + Math.abs(edge.row - avoidRow) > 3);
    const pool = far.length > 0 ? far : edges;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this._col = pick.col;
    this._row = pick.row;
  }

  update(dt: number): boolean {
    this.moveTimer += dt;
    if (this.moveTimer < this.moveInterval) {
      return false;
    }
    this.moveTimer -= this.moveInterval;
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ];
    const pick = dirs[Math.floor(Math.random() * dirs.length)];
    this._col = (this._col + pick.dc + GRID_COLS) % GRID_COLS;
    this._row = (this._row + pick.dr + GRID_ROWS) % GRID_ROWS;
    return true;
  }

  draw(rr: RoughRenderer, grid: Grid, elapsed: number): void {
    const { x, y } = grid.cellScreenPos(this._col, this._row);
    const seed = Math.floor(elapsed / 300);
    rr.crewmate(x + 40, y + 40, COLOURS.AI_WANDERER, seed, 0.95);
  }
}
