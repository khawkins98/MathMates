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
 * Layout (~21 × 26 px, character faces right):
 *   Backpack — left/back side, thinner rounded rect
 *   Body     — tall capsule (radius=half-width → fully rounded top+bottom) + outline
 *   Visor    — large oval on the right/face side
 *   Shading  — 2 px dark strip on left edge + subtle highlight on upper-right
 *   Legs     — two small rounded rects at body base
 */
export function createCrewmateSprite(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.25);

  // --- Outlines (painted first — behind all fills) ---
  gfx.roundRect(-1, 5, 5, 11, 2).fill(OUTLINE);  // backpack
  gfx.roundRect(2, -1, 18, 24, 9).fill(OUTLINE);  // body

  // --- Backpack (left/back side) ---
  gfx.roundRect(0, 6, 3, 9, 2).fill(bodyDark);
  gfx.rect(0, 8, 1, 4).fill({ color: 0xffffff, alpha: 0.25 }); // highlight strip

  // --- Body — tall capsule (radius 8 on width 16 gives fully rounded ends) ---
  gfx.roundRect(3, 0, 16, 22, 8).fill(color);

  // Inner shading: 2 px darker strip on left/back edge
  gfx.roundRect(3, 2, 2, 18, 1).fill(darken(color, 0.2));
  // Subtle upper-right highlight (light source from front-right)
  gfx.ellipse(16, 6, 4, 6).fill({ color: 0xffffff, alpha: 0.1 });

  // --- Visor — large oval, upper-right face area ---
  gfx.ellipse(14, 9, 5, 7).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(10, 4, 3, 2, 1).fill(0xdfffff); // glass reflection

  // --- Legs ---
  gfx.roundRect(6, 21, 4, 4, 2).fill(bodyDark);
  gfx.roundRect(12, 21, 4, 4, 2).fill(bodyDark);
  gfx.rect(10, 22, 2, 3).fill(OUTLINE); // gap shadow

  container.addChild(gfx);
  return container;
}

/**
 * Creates a tiny 10×12 crewmate for HUD life icons.
 */
export function createMiniCrewmate(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.25);

  // Outlines
  gfx.roundRect(0, 2, 3, 7, 1).fill(OUTLINE);   // backpack
  gfx.roundRect(1, -1, 9, 13, 5).fill(OUTLINE);  // body

  // Backpack
  gfx.roundRect(1, 3, 2, 5, 1).fill(bodyDark);

  // Body — capsule (radius 4 on width 8)
  gfx.roundRect(2, 0, 8, 11, 4).fill(color);
  gfx.roundRect(2, 1, 1, 9, 0).fill(darken(color, 0.18)); // shadow strip

  // Visor — oval
  gfx.ellipse(7, 5, 3, 4).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(5, 2, 2, 2, 0).fill(0xdfffff); // reflection

  // Legs
  gfx.roundRect(3, 10, 2, 2, 1).fill(bodyDark);
  gfx.roundRect(6, 10, 2, 2, 1).fill(bodyDark);
  gfx.rect(5, 10, 1, 2).fill(OUTLINE);

  container.addChild(gfx);
  return container;
}
