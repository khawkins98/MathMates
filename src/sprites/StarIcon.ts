import { Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const DEFAULT_SIZE = 12;

/**
 * Creates a 5-pointed star icon.
 * Filled: Success Green fill. Empty: Hull Grey outline only.
 */
export function createStar(filled: boolean, size: number = DEFAULT_SIZE): Graphics {
  const gfx = new Graphics();
  const innerRadius = size * 0.4;

  gfx.star(size, size, 5, size, innerRadius);

  if (filled) {
    gfx.fill(COLORS.SUCCESS_GREEN);
  } else {
    gfx.stroke({ width: 1, color: COLORS.HULL_GREY });
  }

  return gfx;
}
