import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const DEFAULT_SIZE = 32;

/**
 * Pixel-art style 4-tooth gear icon (N/S/E/W teeth).
 * Rectangular teeth read cleanly at low pixel-scale resolutions.
 */
export function createGear(size: number = DEFAULT_SIZE): Container {
  const container = new Container();
  const gfx = new Graphics();

  const cx = size / 2;
  const cy = size / 2;
  const bodyR = size * 0.33;
  const holeR = size * 0.12;
  const toothHalf = size * 0.11; // half-width of each tooth
  const toothProtrude = size * 0.18; // how far tooth extends beyond body edge
  const overlap = size * 0.04; // tooth overlaps slightly into body to avoid gaps

  // 4 rectangular teeth at N / S / W / E
  gfx.rect(cx - toothHalf, cy - bodyR - toothProtrude, toothHalf * 2, toothProtrude + overlap).fill(COLORS.HULL_GREY);
  gfx.rect(cx - toothHalf, cy + bodyR - overlap, toothHalf * 2, toothProtrude + overlap).fill(COLORS.HULL_GREY);
  gfx.rect(cx - bodyR - toothProtrude, cy - toothHalf, toothProtrude + overlap, toothHalf * 2).fill(COLORS.HULL_GREY);
  gfx.rect(cx + bodyR - overlap, cy - toothHalf, toothProtrude + overlap, toothHalf * 2).fill(COLORS.HULL_GREY);

  // Circle body (painted over tooth roots so joins look seamless)
  gfx.circle(cx, cy, bodyR).fill(COLORS.HULL_GREY);

  // Centre hole
  gfx.circle(cx, cy, holeR).fill(COLORS.DEEP_SPACE);

  container.addChild(gfx);
  container.alpha = 0.8;
  return container;
}
