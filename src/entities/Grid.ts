import type { CellValue } from '@/types';
import { CELL_GAP, CELL_SIZE, GRID_COLS, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_ROWS } from '@/constants';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { Cell } from './Cell';

export class Grid {
  private cells: Cell[] = [];
  private correctIndices = new Set<number>();
  private _totalCorrect = 0;
  private _totalWrong = 0;
  private _consumedCorrect = 0;
  private _consumedWrong = 0;

  constructor(values: CellValue[], isCorrectFn: (v: CellValue) => boolean) {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const idx = row * GRID_COLS + col;
        const cell = new Cell(col, row, values[idx]);
        this.cells.push(cell);
        if (isCorrectFn(values[idx])) {
          this.correctIndices.add(idx);
          this._totalCorrect += 1;
        } else {
          this._totalWrong += 1;
        }
      }
    }
  }

  get totalCorrect(): number {
    return this._totalCorrect;
  }

  get totalWrong(): number {
    return this._totalWrong;
  }

  get correctEaten(): number {
    return this._consumedCorrect;
  }

  get wrongEaten(): number {
    return this._consumedWrong;
  }

  private getIndex(col: number, row: number): number {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return -1;
    }
    return row * GRID_COLS + col;
  }

  getCellAt(col: number, row: number): Cell | null {
    return this.cells[this.getIndex(col, row)] ?? null;
  }

  isCorrectCell(col: number, row: number): boolean {
    return this.correctIndices.has(this.getIndex(col, row));
  }

  toggleSus(col: number, row: number): void {
    const cell = this.getCellAt(col, row);
    cell?.toggleSus();
  }

  consumeCell(col: number, row: number): boolean {
    const idx = this.getIndex(col, row);
    const cell = this.cells[idx];
    if (!cell || cell.state === 'consumed' || cell.state === 'broken') {
      return false;
    }
    const correct = this.correctIndices.has(idx);
    cell.clearSus();
    if (correct) {
      this._consumedCorrect += 1;
      cell.flash('correct', 'consumed');
    } else {
      cell.flash('error', 'consumed');
    }
    return correct;
  }

  impostorBreakCell(col: number, row: number): void {
    const idx = this.getIndex(col, row);
    const cell = this.cells[idx];
    if (!cell || cell.state === 'consumed' || cell.state === 'broken') {
      return;
    }
    if (cell.state === 'correct_flash' || cell.state === 'error_flash') {
      return;
    }
    cell.clearSus();
    this._consumedWrong += 1;
    cell.flash('correct', 'broken');
  }

  impostorEatCorrectCell(col: number, row: number): void {
    const idx = this.getIndex(col, row);
    const cell = this.cells[idx];
    if (!cell || cell.state === 'consumed') {
      return;
    }
    cell.clearSus();
    cell.flash('error', 'consumed');
  }

  repairCell(col: number, row: number): void {
    const cell = this.getCellAt(col, row);
    if (!cell || cell.state !== 'broken') {
      return;
    }
    this._consumedWrong = Math.max(0, this._consumedWrong - 1);
    cell.setState('normal');
  }

  getBrokenPositions(): Array<{ col: number; row: number }> {
    const out: Array<{ col: number; row: number }> = [];
    for (let i = 0; i < this.cells.length; i += 1) {
      if (this.cells[i].state === 'broken') {
        out.push({ col: i % GRID_COLS, row: Math.floor(i / GRID_COLS) });
      }
    }
    return out;
  }

  setHighlighted(col: number, row: number): void {
    for (const cell of this.cells) {
      if (cell.state === 'highlighted') {
        cell.setState('normal');
      }
    }
    const cell = this.getCellAt(col, row);
    if (cell && cell.state === 'normal') {
      cell.setState('highlighted');
    }
  }

  isCleared(): boolean {
    return this._consumedCorrect >= this._totalCorrect;
  }

  isAllWrongCleared(): boolean {
    return this._consumedWrong >= this._totalWrong;
  }

  cellScreenPos(col: number, row: number): { x: number; y: number } {
    return {
      x: GRID_OFFSET_X + col * (CELL_SIZE + CELL_GAP),
      y: GRID_OFFSET_Y + row * (CELL_SIZE + CELL_GAP),
    };
  }

  update(dt: number): void {
    for (const cell of this.cells) {
      cell.update(dt);
    }
  }

  draw(rr: RoughRenderer): void {
    for (const cell of this.cells) {
      const { x, y } = this.cellScreenPos(cell.col, cell.row);
      cell.draw(rr, x, y, CELL_SIZE, CELL_SIZE);
    }
  }
}
