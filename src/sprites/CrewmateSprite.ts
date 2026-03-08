import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

/** Available crewmate color palettes. */
export const CREW_COLORS = [
  0xc51111, // red
  0x132ed1, // blue
  0x127f2c, // green
  0xed54ba, // pink
  0xef7d0e, // orange
  0xf5f557, // yellow
] as const;

const DEFAULT_COLOR = CREW_COLORS[0];

/**
 * Creates a procedurally-drawn crewmate character at pixel scale.
 * Body: 16x20 bean-shaped roundRect
 * Visor: ellipse in Visor Cyan
 * Backpack: small rect on the back
 * Legs: two small rects at the bottom
 */
export function createCrewmateSprite(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  // Backpack (drawn first so it sits behind the body)
  gfx.rect(0, 6, 4, 10).fill(darken(color, 0.3));

  // Bean-shaped body
  gfx.roundRect(3, 0, 16, 20, 6).fill(color);

  // Visor (large ellipse)
  gfx.ellipse(13, 7, 6, 5).fill(COLORS.VISOR_CYAN);

  // Visor shine highlight
  gfx.ellipse(15, 5, 2, 1.5).fill(0x9fffff);

  // Left leg
  gfx.rect(5, 19, 5, 4).fill(color);

  // Right leg
  gfx.rect(12, 19, 5, 4).fill(color);

  // Gap between legs
  gfx.rect(10, 20, 2, 3).fill(0x000000);

  container.addChild(gfx);
  return container;
}

/**
 * Creates a tiny 8x10 crewmate for HUD life icons.
 */
export function createMiniCrewmate(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  // Backpack
  gfx.rect(0, 3, 2, 5).fill(darken(color, 0.3));

  // Body
  gfx.roundRect(1, 0, 8, 10, 3).fill(color);

  // Visor
  gfx.ellipse(7, 3, 3, 2).fill(COLORS.VISOR_CYAN);

  // Left leg
  gfx.rect(2, 9, 3, 2).fill(color);

  // Right leg
  gfx.rect(6, 9, 3, 2).fill(color);

  // Gap between legs
  gfx.rect(5, 10, 1, 1).fill(0x000000);

  container.addChild(gfx);
  return container;
}

/** Darkens a hex color by a factor (0..1). */
function darken(hex: number, amount: number): number {
  const r = Math.round(((hex >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((hex >> 8) & 0xff) * (1 - amount));
  const b = Math.round((hex & 0xff) * (1 - amount));
  return (r << 16) | (g << 8) | b;
}
