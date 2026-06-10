import type { CellState, CellValue } from '@/types';
import { FLASH_DURATION } from '@/constants';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { COLOURS } from '@/rendering/colours';

const CELL_COLOURS: Record<CellState, { fill: string; stroke: string }> = {
  normal: { fill: COLOURS.CELL_NORMAL, stroke: COLOURS.CELL_NORMAL_STROKE },
  highlighted: { fill: COLOURS.CELL_HIGHLIGHTED, stroke: COLOURS.CELL_HIGHLIGHTED_STROKE },
  consumed: { fill: COLOURS.CELL_CONSUMED, stroke: COLOURS.CELL_CONSUMED_STROKE },
  broken: { fill: COLOURS.CELL_BROKEN, stroke: COLOURS.CELL_BROKEN_STROKE },
  sus: { fill: COLOURS.CELL_NORMAL, stroke: COLOURS.CELL_NORMAL_STROKE },
  correct_flash: { fill: COLOURS.CELL_CORRECT_FLASH, stroke: COLOURS.CELL_CORRECT_FLASH_STROKE },
  error_flash: { fill: COLOURS.CELL_ERROR_FLASH, stroke: COLOURS.CELL_ERROR_FLASH_STROKE },
};

export class Cell {
  readonly col: number;
  readonly row: number;
  readonly value: CellValue;
  private _state: CellState = 'normal';
  private _sus = false;
  private flashTimer = 0;
  private postFlashState: CellState = 'consumed';
  private readonly seed: number;

  constructor(col: number, row: number, value: CellValue) {
    this.col = col;
    this.row = row;
    this.value = value;
    this.seed = col * 7 + row * 13 + 1;
  }

  get state(): CellState {
    return this._state;
  }

  get sus(): boolean {
    return this._sus;
  }

  setState(state: CellState): void {
    this._state = state;
    if (state === 'consumed') {
      this._sus = false;
    }
  }

  flash(type: 'correct' | 'error', postState: CellState = 'consumed'): void {
    this._state = type === 'correct' ? 'correct_flash' : 'error_flash';
    this.flashTimer = 0;
    this.postFlashState = postState;
    if (postState === 'consumed') {
      this._sus = false;
    }
  }

  toggleSus(): void {
    if (this._state === 'normal' || this._state === 'highlighted' || this._state === 'sus') {
      this._sus = !this._sus;
    }
  }

  clearSus(): void {
    this._sus = false;
  }

  update(dt: number): void {
    if (this._state === 'correct_flash' || this._state === 'error_flash') {
      this.flashTimer += dt;
      if (this.flashTimer >= FLASH_DURATION) {
        this._state = this.postFlashState;
        this.flashTimer = 0;
      }
    }
  }

  draw(rr: RoughRenderer, x: number, y: number, w: number, h: number): void {
    const colours = CELL_COLOURS[this._state];
    rr.cell(x, y, w, h, colours.fill, colours.stroke, this.seed);

    if (this._sus && this._state !== 'consumed') {
      const ctx = rr.context;
      ctx.save();
      ctx.strokeStyle = COLOURS.CELL_SUS_MARKER;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w - 20, y + 6);
      ctx.lineTo(x + w - 6, y + 20);
      ctx.moveTo(x + w - 6, y + 6);
      ctx.lineTo(x + w - 20, y + 20);
      ctx.stroke();
      ctx.restore();
    }

    if (this._state !== 'consumed') {
      const ctx = rr.context;
      ctx.save();
      ctx.globalAlpha = this._state === 'broken' ? 0.55 : 1;
      ctx.fillStyle = COLOURS.TEXT_CELL;
      ctx.font = `18px 'Fredoka One', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Nudged above centre so entity sprites (anchored at the cell bottom)
      // never cover the expression — the player must always be able to read
      // the cell they are standing on.
      ctx.fillText(this.value.display, x + w / 2, y + h / 2 - 12);
      ctx.restore();
    }
  }
}
