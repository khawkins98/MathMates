import { CELL_SPRITE_ANCHOR_Y, CELL_SPRITE_CENTER_X, GRID_COLS, GRID_ROWS } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import type { Grid } from './Grid';

interface AIPersonality {
  name: string;
  colour: string;
  moveInterval: number;
  dwellDuration: number;
  seekBroken: number;
}

const PERSONALITIES: AIPersonality[] = [
  { name: 'diligent', colour: COLOURS.AI_CREW_1, moveInterval: 1100, dwellDuration: 3500, seekBroken: 0.55 },
  { name: 'wanderer', colour: COLOURS.AI_CREW_2, moveInterval: 1300, dwellDuration: 4500, seekBroken: 0.25 },
  { name: 'keen', colour: COLOURS.AI_CREW_3, moveInterval: 900, dwellDuration: 3000, seekBroken: 0.70 },
];

function shortestWrappedStep(from: number, to: number, size: number): -1 | 0 | 1 {
  const raw = to - from;
  const wrappedForward = (to - from + size) % size;
  const wrappedBackward = (from - to + size) % size;
  if (raw === 0) {
    return 0;
  }
  if (wrappedForward <= wrappedBackward) {
    return 1;
  }
  return -1;
}

function wrappedDistance(from: number, to: number, size: number): number {
  const diff = Math.abs(to - from);
  return Math.min(diff, size - diff);
}

export class AICrewmate {
  private _col: number;
  private _row: number;
  private _alive = true;
  private moveTimer = 0;
  private dwellTimer = 0;
  private dwellElapsed = 0;
  private isDwelling = false;
  readonly personality: AIPersonality;
  private elapsed = 0;

  constructor(personalityIndex: number, startCol: number, startRow: number) {
    this.personality = PERSONALITIES[personalityIndex % PERSONALITIES.length];
    this._col = startCol;
    this._row = startRow;
  }

  get col(): number {
    return this._col;
  }

  get row(): number {
    return this._row;
  }

  get alive(): boolean {
    return this._alive;
  }

  eliminate(): void {
    this._alive = false;
  }

  update(dt: number, grid: Grid): boolean {
    if (!this._alive) {
      return false;
    }
    this.elapsed += dt;

    if (this.isDwelling) {
      this.dwellElapsed += dt;
      this.dwellTimer += dt;
      if (this.dwellTimer >= this.personality.dwellDuration) {
        this.isDwelling = false;
        this.dwellTimer = 0;
        return true;
      }
      return false;
    }

    this.moveTimer += dt;
    if (this.moveTimer < this.personality.moveInterval) {
      return false;
    }
    this.moveTimer -= this.personality.moveInterval;

    const target = this.pickTarget(grid);
    if (target) {
      this._col = target.col;
      this._row = target.row;
    }

    const cell = grid.getCellAt(this._col, this._row);
    if (cell && cell.state === 'broken') {
      this.isDwelling = true;
      this.dwellTimer = 0;
      this.dwellElapsed = 0;
    }

    return false;
  }

  private pickTarget(grid: Grid): { col: number; row: number } {
    const broken = grid.getBrokenPositions();
    if (broken.length > 0 && Math.random() < this.personality.seekBroken) {
      return this.stepToward(broken);
    }
    return this.randomAdjacent();
  }

  private stepToward(targets: Array<{ col: number; row: number }>): { col: number; row: number } {
    let best = targets[0];
    let bestScore = wrappedDistance(this._col, best.col, GRID_COLS) + wrappedDistance(this._row, best.row, GRID_ROWS);
    for (const target of targets) {
      const score = wrappedDistance(this._col, target.col, GRID_COLS) + wrappedDistance(this._row, target.row, GRID_ROWS);
      if (score < bestScore) {
        best = target;
        bestScore = score;
      }
    }

    const dx = wrappedDistance(this._col, best.col, GRID_COLS);
    const dy = wrappedDistance(this._row, best.row, GRID_ROWS);
    if (dx >= dy && dx > 0) {
      const step = shortestWrappedStep(this._col, best.col, GRID_COLS);
      return { col: (this._col + step + GRID_COLS) % GRID_COLS, row: this._row };
    }
    if (dy > 0) {
      const step = shortestWrappedStep(this._row, best.row, GRID_ROWS);
      return { col: this._col, row: (this._row + step + GRID_ROWS) % GRID_ROWS };
    }
    return { col: this._col, row: this._row };
  }

  private randomAdjacent(): { col: number; row: number } {
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ];
    const pick = dirs[Math.floor(Math.random() * dirs.length)];
    return {
      col: (this._col + pick.dc + GRID_COLS) % GRID_COLS,
      row: (this._row + pick.dr + GRID_ROWS) % GRID_ROWS,
    };
  }

  draw(rr: RoughRenderer, grid: Grid): void {
    if (!this._alive) {
      return;
    }
    const { x, y } = grid.cellScreenPos(this._col, this._row);
    const pulse = this.isDwelling ? 1 + 0.15 * Math.sin(this.dwellElapsed * 0.01) : 1;
    const seed = Math.floor(this.elapsed / 300);
    rr.crewmate(x + CELL_SPRITE_CENTER_X, y + CELL_SPRITE_ANCHOR_Y, this.personality.colour, seed, 0.72 * pulse);
  }
}
