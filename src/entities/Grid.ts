import { Container } from 'pixi.js';
import { Cell } from './Cell';
import type { GridData } from '../types';
import { GRID_COLS, GRID_ROWS, CELL_SIZE, GUTTER } from '../constants';

export class Grid extends Container {
  private cells: Cell[] = [];
  private correctIndices: Set<number> = new Set();
  private consumedCorrect = 0;
  private consumedWrong = 0;

  constructor() {
    super();

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = new Cell();
        cell.x = col * (CELL_SIZE + GUTTER);
        cell.y = row * (CELL_SIZE + GUTTER);
        this.cells.push(cell);
        this.addChild(cell);
      }
    }
  }

  populate(data: GridData): void {
    this.correctIndices = new Set(data.correctIndices);
    this.consumedCorrect = 0;
    this.consumedWrong = 0;

    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      cell.setValue(i < data.cells.length ? data.cells[i] : '');
      cell.setState('normal');
    }
  }

  getCellAt(col: number, row: number): Cell | undefined {
    const index = this.getIndex(col, row);
    return this.cells[index];
  }

  consumeCell(col: number, row: number): boolean {
    const index = this.getIndex(col, row);
    const cell = this.cells[index];
    if (!cell || cell.state === 'consumed') {
      return false;
    }

    const isCorrect = this.correctIndices.has(index);

    if (isCorrect) {
      cell.flash('correct');
      this.consumedCorrect++;
    } else {
      cell.flash('error');
      this.consumedWrong++;
    }

    return isCorrect;
  }

  isCleared(): boolean {
    return this.consumedCorrect >= this.correctIndices.size;
  }

  getCol(index: number): number {
    return ((index % GRID_COLS) + GRID_COLS) % GRID_COLS;
  }

  getRow(index: number): number {
    return ((Math.floor(index / GRID_COLS) % GRID_ROWS) + GRID_ROWS) % GRID_ROWS;
  }

  getIndex(col: number, row: number): number {
    const wrappedCol = ((col % GRID_COLS) + GRID_COLS) % GRID_COLS;
    const wrappedRow = ((row % GRID_ROWS) + GRID_ROWS) % GRID_ROWS;
    return wrappedRow * GRID_COLS + wrappedCol;
  }

  highlightCell(col: number, row: number): void {
    const cell = this.getCellAt(col, row);
    if (cell && cell.state === 'normal') {
      cell.setState('highlighted');
    }
  }

  toggleSusCell(col: number, row: number): void {
    const cell = this.getCellAt(col, row);
    if (cell && cell.state !== 'consumed') {
      cell.toggleSus();
    }
  }

  unhighlightCell(col: number, row: number): void {
    const cell = this.getCellAt(col, row);
    if (cell && cell.state === 'highlighted') {
      cell.setState('normal');
    }
  }

  update(dt: number): void {
    for (const cell of this.cells) {
      cell.update(dt);
    }
  }

  get totalCorrect(): number {
    return this.correctIndices.size;
  }

  get correctEaten(): number {
    return this.consumedCorrect;
  }

  get totalWrong(): number {
    return this.cells.length - this.correctIndices.size;
  }

  get wrongEaten(): number {
    return this.consumedWrong;
  }

  isCorrectCell(col: number, row: number): boolean {
    const index = this.getIndex(col, row);
    return this.correctIndices.has(index);
  }

  /**
   * Consume a cell with an explicit flash type (for impostor mode where
   * correct/error flash colors are inverted).
   */
  consumeCellWithFlash(col: number, row: number, flashType: 'correct' | 'error'): void {
    const index = this.getIndex(col, row);
    const cell = this.cells[index];
    if (!cell || cell.state === 'consumed') return;

    const isCorrect = this.correctIndices.has(index);
    if (isCorrect) {
      this.consumedCorrect++;
    } else {
      this.consumedWrong++;
    }

    cell.flash(flashType);
  }

  isAllWrongCleared(): boolean {
    return this.consumedWrong >= this.totalWrong;
  }

  getUnconsumedCorrectPositions(): Array<{ col: number; row: number }> {
    const positions: Array<{ col: number; row: number }> = [];
    for (const index of this.correctIndices) {
      const cell = this.cells[index];
      if (cell && cell.state !== 'consumed') {
        positions.push({ col: this.getCol(index), row: this.getRow(index) });
      }
    }
    return positions;
  }

}
