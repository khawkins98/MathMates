import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';
import { darken } from '@/utils';

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
const OUTLINE = 0x111111;

/**
 * Creates a procedurally-drawn crewmate character at pixel scale.
 *
 * Layout (21 × 24 px bounding box, character faces right):
 *   Backpack — left side, darker shade, rounded rect with highlight strip
 *   Body     — bean-shaped roundRect with dark outline
 *   Visor    — shield-shaped roundRect (not plain ellipse) + glass reflection
 *   Legs     — two rounded rects with dark gap
 */
export function createCrewmateSprite(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.28);

  // --- Outlines (drawn first — sit behind all fills) ---
  gfx.roundRect(-1, 5, 6, 12, 2).fill(OUTLINE);   // backpack outline
  gfx.roundRect(2, -1, 17, 22, 7).fill(OUTLINE);   // body outline

  // --- Backpack ---
  gfx.roundRect(0, 6, 4, 10, 2).fill(bodyDark);
  gfx.rect(1, 8, 1, 5).fill({ color: 0xffffff, alpha: 0.25 }); // highlight strip

  // --- Body ---
  gfx.roundRect(3, 0, 16, 20, 6).fill(color);

  // --- Visor — shield shape (rectangular with rounded corners) ---
  gfx.roundRect(10, 3, 8, 9, 3).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(11, 4, 4, 3, 1).fill(0xaaffff); // glass reflection

  // --- Legs ---
  gfx.roundRect(5, 19, 5, 5, 2).fill(bodyDark);
  gfx.roundRect(12, 19, 5, 5, 2).fill(bodyDark);
  gfx.rect(10, 20, 2, 4).fill(OUTLINE); // gap shadow

  container.addChild(gfx);
  return container;
}

/**
 * Creates a tiny 10×12 crewmate for HUD life icons.
 */
export function createMiniCrewmate(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.28);

  // Outlines
  gfx.roundRect(0, 2, 3, 7, 1).fill(OUTLINE);   // backpack outline
  gfx.roundRect(1, -1, 9, 13, 4).fill(OUTLINE);  // body outline

  // Backpack
  gfx.roundRect(1, 3, 2, 5, 1).fill(bodyDark);

  // Body
  gfx.roundRect(2, 0, 8, 10, 3).fill(color);

  // Visor — shield shape
  gfx.roundRect(5, 2, 4, 5, 2).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(6, 2, 2, 2, 0).fill(0xaaffff); // reflection

  // Legs
  gfx.roundRect(3, 9, 2, 2, 1).fill(bodyDark);
  gfx.roundRect(6, 9, 2, 2, 1).fill(bodyDark);
  gfx.rect(5, 9, 1, 2).fill(OUTLINE); // gap

  container.addChild(gfx);
  return container;
}
