export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 440;

export const GRID_COLS = 5;
export const GRID_ROWS = 4;
export const CELL_SIZE = 80;
export const CELL_GAP = 6;

export const GRID_OFFSET_X = (CANVAS_WIDTH - (GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP)) / 2;
export const GRID_OFFSET_Y = 80;

// Entity sprites anchor near the cell bottom so the expression text above
// stays readable. Derived from CELL_SIZE so a grid resize moves them too.
export const CELL_SPRITE_CENTER_X = CELL_SIZE / 2;
export const CELL_SPRITE_ANCHOR_Y = Math.round(CELL_SIZE * 0.66);

export const STARTING_LIVES = 5;
export const FLASH_DURATION = 350;

export const ROUGH_OPTIONS = {
  roughness: 0.8,
  strokeWidth: 3,
};
