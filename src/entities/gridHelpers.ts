import { CELL_SIZE, GUTTER, GRID_COLS, GRID_ROWS } from '../constants';
import { pickRandom, shuffle } from '../utils';

/** Convert grid column/row to pixel coordinates (center of cell). */
export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * (CELL_SIZE + GUTTER) + CELL_SIZE / 2,
    y: row * (CELL_SIZE + GUTTER) + CELL_SIZE / 2,
  };
}

/** Manhattan distance between two grid positions. */
export function manhattan(c1: number, r1: number, c2: number, r2: number): number {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2);
}

/** Build the list of all edge cells, excluding a given position. */
function getEdgeCandidates(
  excludeCol: number,
  excludeRow: number,
): Array<{ col: number; row: number }> {
  const edgeCells: Array<{ col: number; row: number }> = [];
  for (let c = 0; c < GRID_COLS; c++) {
    edgeCells.push({ col: c, row: 0 });
    edgeCells.push({ col: c, row: GRID_ROWS - 1 });
  }
  for (let r = 1; r < GRID_ROWS - 1; r++) {
    edgeCells.push({ col: 0, row: r });
    edgeCells.push({ col: GRID_COLS - 1, row: r });
  }

  return edgeCells.filter(
    (c) => c.col !== excludeCol || c.row !== excludeRow,
  );
}

/** Pick a random edge cell, excluding the given player position. */
export function pickEdgeCell(
  playerCol: number,
  playerRow: number,
): { col: number; row: number } {
  return pickRandom(getEdgeCandidates(playerCol, playerRow));
}

/**
 * Pick multiple distinct edge cells, excluding a given position and each other.
 */
export function pickEdgeCells(
  count: number,
  excludeCol: number,
  excludeRow: number,
): Array<{ col: number; row: number }> {
  return shuffle(getEdgeCandidates(excludeCol, excludeRow)).slice(0, count);
}

/** Get all in-bounds adjacent cells (cardinal directions, no wrapping). */
export function getValidAdjacentCells(
  col: number,
  row: number,
): Array<{ col: number; row: number }> {
  const results: Array<{ col: number; row: number }> = [];
  if (row > 0) results.push({ col, row: row - 1 });
  if (row < GRID_ROWS - 1) results.push({ col, row: row + 1 });
  if (col > 0) results.push({ col: col - 1, row });
  if (col < GRID_COLS - 1) results.push({ col: col + 1, row });
  return results;
}
