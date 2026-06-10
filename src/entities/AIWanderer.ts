import { CELL_SPRITE_ANCHOR_Y, CELL_SPRITE_CENTER_X, GRID_COLS, GRID_ROWS } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import type { Grid } from './Grid';

export interface WandererTick {
  moved: boolean;
  /** It just reached a correct cell and started chewing — telegraph this. */
  startedChewing: boolean;
  /** It finished chewing: the correct answer at this position is gone. */
  ate: { col: number; row: number } | null;
}

type WandererMode = 'wander' | 'hunt' | 'chew';

function wrappedStep(from: number, to: number, size: number): -1 | 0 | 1 {
  const forward = (to - from + size) % size;
  const backward = (from - to + size) % size;
  if (forward === 0) {
    return 0;
  }
  return forward <= backward ? 1 : -1;
}

/**
 * The crew-mode impostor. By default it wanders randomly; with hunting
 * enabled it periodically targets a correct answer, walks to it, chews for a
 * telegraphed window, and eats it — turning the board into a shared resource
 * the player has to race for.
 */
export class AIWanderer {
  private _col: number;
  private _row: number;
  private moveTimer = 0;
  private readonly moveInterval = 900;
  private mode: WandererMode = 'wander';
  private huntTimer = 0;
  private huntIntervalMs = 0; // 0 = hunting disabled
  private chewDurationMs = 4000;
  private chewTimer = 0;
  private target: { col: number; row: number } | null = null;

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

  /** The cell currently being chewed, for the danger telegraph. null when not chewing. */
  get chewTarget(): { col: number; row: number } | null {
    return this.mode === 'chew' ? this.target : null;
  }

  /** 0..1 progress through the current chew, for telegraph urgency. */
  get chewProgress(): number {
    return this.mode === 'chew' ? Math.min(1, this.chewTimer / this.chewDurationMs) : 0;
  }

  configureHunting(intervalMs: number, chewMs: number): void {
    this.huntIntervalMs = intervalMs;
    this.chewDurationMs = chewMs;
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
    const wrapped = (a: number, b: number, size: number): number => {
      const d = Math.abs(a - b);
      return Math.min(d, size - d);
    };
    const far = edges.filter((edge) => wrapped(edge.col, avoidCol, GRID_COLS) + wrapped(edge.row, avoidRow, GRID_ROWS) > 3);
    const pool = far.length > 0 ? far : edges;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this._col = pick.col;
    this._row = pick.row;
    // Getting bumped/respawned interrupts any meal in progress
    this.mode = 'wander';
    this.target = null;
    this.chewTimer = 0;
  }

  update(dt: number, grid: Grid): WandererTick {
    const tick: WandererTick = { moved: false, startedChewing: false, ate: null };

    if (this.huntIntervalMs > 0 && this.mode === 'wander') {
      this.huntTimer += dt;
      if (this.huntTimer >= this.huntIntervalMs) {
        this.huntTimer = 0;
        const candidates = grid.getCorrectAvailablePositions();
        if (candidates.length > 0) {
          this.target = candidates[Math.floor(Math.random() * candidates.length)];
          this.mode = 'hunt';
        }
      }
    }

    if (this.mode === 'chew' && this.target) {
      // The player beat it to the cell — nothing left to chew
      if (!grid.isCorrectCell(this.target.col, this.target.row)) {
        this.mode = 'wander';
        this.target = null;
        this.chewTimer = 0;
        return tick;
      }
      this.chewTimer += dt;
      if (this.chewTimer >= this.chewDurationMs) {
        tick.ate = { ...this.target };
        this.mode = 'wander';
        this.target = null;
        this.chewTimer = 0;
      }
      return tick;
    }

    this.moveTimer += dt;
    if (this.moveTimer < this.moveInterval) {
      return tick;
    }
    this.moveTimer -= this.moveInterval;
    tick.moved = true;

    if (this.mode === 'hunt' && this.target) {
      // Target already eaten by the player — go back to wandering
      if (!grid.isCorrectCell(this.target.col, this.target.row)) {
        this.mode = 'wander';
        this.target = null;
      } else {
        const dc = wrappedStep(this._col, this.target.col, GRID_COLS);
        if (dc !== 0) {
          this._col = (this._col + dc + GRID_COLS) % GRID_COLS;
        } else {
          const dr = wrappedStep(this._row, this.target.row, GRID_ROWS);
          this._row = (this._row + dr + GRID_ROWS) % GRID_ROWS;
        }
        if (this._col === this.target.col && this._row === this.target.row) {
          this.mode = 'chew';
          this.chewTimer = 0;
          tick.startedChewing = true;
        }
        return tick;
      }
    }

    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ];
    const pick = dirs[Math.floor(Math.random() * dirs.length)];
    this._col = (this._col + pick.dc + GRID_COLS) % GRID_COLS;
    this._row = (this._row + pick.dr + GRID_ROWS) % GRID_ROWS;
    return tick;
  }

  draw(rr: RoughRenderer, grid: Grid, elapsed: number): void {
    const { x, y } = grid.cellScreenPos(this._col, this._row);
    const seed = Math.floor(elapsed / 300);
    // Chewing: vibrate with rising urgency so the theft is telegraphed
    const jitter = this.mode === 'chew' ? (1 + this.chewProgress) * 1.6 : 0;
    const jx = jitter ? (Math.random() - 0.5) * 2 * jitter : 0;
    const jy = jitter ? (Math.random() - 0.5) * 2 * jitter : 0;
    rr.crewmate(x + CELL_SPRITE_CENTER_X + jx, y + CELL_SPRITE_ANCHOR_Y + jy, COLOURS.AI_WANDERER, seed, 0.85);
  }
}
