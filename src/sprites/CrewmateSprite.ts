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
 * Creates a procedurally-drawn crewmate character at pixel scale (~21 × 26 px).
 * Character faces right; backpack on left.
 *
 * Body shape: circle (dome/head) + roundRect (torso) drawn as a compound shape.
 * This gives the characteristic Among Us asymmetric bean: wide rounded dome on top,
 * narrower flat-bottomed torso below.
 *
 * NOTE: If animation (walk cycle, reactions) is needed in future, migrating to
 * PNG spritesheets with sprite.tint for colour-swapping would be the right move.
 */
export function createCrewmateSprite(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.25);

  // --- Outlines (painted first — sit behind all fills) ---
  gfx.roundRect(-1, 6, 6, 12, 3).fill(OUTLINE);  // backpack
  gfx.circle(11, 8, 9).fill(OUTLINE);             // dome
  gfx.roundRect(3, 9, 16, 14, 4).fill(OUTLINE);   // torso

  // --- Backpack ---
  gfx.roundRect(0, 7, 4, 10, 2).fill(bodyDark);
  gfx.rect(0, 9, 1, 5).fill({ color: 0xffffff, alpha: 0.25 }); // highlight strip

  // --- Body: dome (circle) + torso (roundRect) compound ---
  // Together these form the bean: wide rounded head, narrower rectangular torso.
  gfx.circle(11, 8, 8).fill(color);
  gfx.roundRect(4, 10, 14, 12, 3).fill(color);

  // --- Visor — oval on the upper-right face area ---
  gfx.ellipse(14, 9, 5, 6).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(10, 4, 3, 3, 1).fill(0xdfffff); // glass reflection

  // --- Legs ---
  gfx.roundRect(6, 21, 4, 5, 2).fill(bodyDark);
  gfx.roundRect(12, 21, 4, 5, 2).fill(bodyDark);
  gfx.rect(10, 19, 2, 7).fill(OUTLINE); // gap between legs

  container.addChild(gfx);
  return container;
}

/**
 * Creates a tiny ~11×13 px crewmate for HUD life icons.
 */
export function createMiniCrewmate(color: number = DEFAULT_COLOR): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyDark = darken(color, 0.25);

  // Outlines
  gfx.roundRect(-1, 2, 4, 7, 2).fill(OUTLINE);  // backpack
  gfx.circle(6, 4, 5).fill(OUTLINE);             // dome
  gfx.roundRect(1, 4, 9, 8, 3).fill(OUTLINE);    // torso

  // Backpack
  gfx.roundRect(0, 3, 2, 5, 1).fill(bodyDark);

  // Body
  gfx.circle(6, 4, 4).fill(color);
  gfx.roundRect(2, 5, 7, 6, 2).fill(color);

  // Visor
  gfx.ellipse(7, 4, 3, 3).fill(COLORS.VISOR_CYAN);
  gfx.roundRect(5, 2, 2, 2, 0).fill(0xdfffff);

  // Legs
  gfx.roundRect(3, 10, 2, 2, 1).fill(bodyDark);
  gfx.roundRect(6, 10, 2, 2, 1).fill(bodyDark);
  gfx.rect(5, 10, 1, 2).fill(OUTLINE);

  container.addChild(gfx);
  return container;
}
