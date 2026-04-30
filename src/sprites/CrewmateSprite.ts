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
