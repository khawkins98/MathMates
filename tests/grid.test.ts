import { describe, expect, it } from 'vitest';
import { FLASH_DURATION, GRID_COLS, GRID_ROWS } from '@/constants';
import { Grid } from '@/entities/Grid';
import type { CellValue } from '@/types';

// 8 correct cells (numeric 1) followed by 12 wrong cells (numeric 0)
function makeGrid(): Grid {
  const values: CellValue[] = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => ({
    display: i < 8 ? `C${i}` : `W${i}`,
    numeric: i < 8 ? 1 : 0,
  }));
  return new Grid(values, (v) => v.numeric === 1);
}

function settleFlash(grid: Grid): void {
  grid.update(FLASH_DURATION + 1);
}

describe('Grid counters', () => {
  it('counts totals from the correctness function', () => {
    const grid = makeGrid();
    expect(grid.totalCorrect).toBe(8);
    expect(grid.totalWrong).toBe(12);
  });

  it('crew mode: consuming all correct cells clears the mission', () => {
    const grid = makeGrid();
    for (let i = 0; i < 8; i += 1) {
      const correct = grid.consumeCell(i % GRID_COLS, Math.floor(i / GRID_COLS));
      expect(correct).toBe(true);
      settleFlash(grid);
    }
    expect(grid.correctEaten).toBe(8);
    expect(grid.isCleared()).toBe(true);
  });

  it('consuming a wrong cell does not advance correctEaten', () => {
    const grid = makeGrid();
    expect(grid.consumeCell(4, 3)).toBe(false); // last cell is wrong
    expect(grid.correctEaten).toBe(0);
    expect(grid.isCleared()).toBe(false);
  });

  it('a cell cannot be consumed twice', () => {
    const grid = makeGrid();
    expect(grid.consumeCell(0, 0)).toBe(true);
    settleFlash(grid);
    expect(grid.consumeCell(0, 0)).toBe(false);
    expect(grid.correctEaten).toBe(1);
  });

  it('impostor mode: break → repair → re-break keeps the counter consistent', () => {
    const grid = makeGrid();
    grid.impostorBreakCell(4, 3);
    settleFlash(grid);
    expect(grid.wrongEaten).toBe(1);

    grid.repairCell(4, 3);
    expect(grid.wrongEaten).toBe(0);
    expect(grid.getCellAt(4, 3)?.state).toBe('normal');

    grid.impostorBreakCell(4, 3);
    settleFlash(grid);
    expect(grid.wrongEaten).toBe(1);
  });

  it('repairCell ignores cells that are not broken', () => {
    const grid = makeGrid();
    grid.repairCell(0, 0);
    expect(grid.wrongEaten).toBe(0);
  });

  it('impostor mode: breaking all wrong cells clears the mission', () => {
    const grid = makeGrid();
    for (let i = 8; i < 20; i += 1) {
      grid.impostorBreakCell(i % GRID_COLS, Math.floor(i / GRID_COLS));
      settleFlash(grid);
    }
    expect(grid.wrongEaten).toBe(12);
    expect(grid.isAllWrongCleared()).toBe(true);
  });

  it('getBrokenPositions reports broken cells', () => {
    const grid = makeGrid();
    grid.impostorBreakCell(4, 3);
    settleFlash(grid);
    expect(grid.getBrokenPositions()).toEqual([{ col: 4, row: 3 }]);
  });

  it('sus marking blocks nothing at grid level and clears on consume', () => {
    const grid = makeGrid();
    grid.toggleSus(0, 0);
    expect(grid.getCellAt(0, 0)?.sus).toBe(true);
    grid.consumeCell(0, 0);
    expect(grid.getCellAt(0, 0)?.sus).toBe(false);
  });
});
