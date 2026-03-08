import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const DEFAULT_SIZE = 16;

/**
 * Creates a padlock icon drawn in Hull Grey.
 * Shackle arc on top, rectangular body, circular keyhole.
 */
export function createPadlock(size: number = DEFAULT_SIZE): Container {
  const container = new Container();
  const gfx = new Graphics();

  const bodyW = size;
  const bodyH = size * 0.65;
  const bodyY = size * 0.45;
  const shackleRadius = size * 0.3;
  const shackleWidth = size * 0.15;

  // Shackle arc
  const centerX = bodyW / 2;
  const shackleY = bodyY;

  gfx.arc(centerX, shackleY, shackleRadius, Math.PI, 0);
  gfx.stroke({ width: shackleWidth, color: COLORS.HULL_GREY });

  // Body (rounded rect)
  gfx.roundRect(0, bodyY, bodyW, bodyH, 2).fill(COLORS.HULL_GREY);

  // Keyhole (circle)
  const keyholeRadius = size * 0.1;
  const keyholeX = bodyW / 2;
  const keyholeY = bodyY + bodyH * 0.4;
  gfx.circle(keyholeX, keyholeY, keyholeRadius).fill(COLORS.DEEP_SPACE);

  // Keyhole slot (small rect below circle)
  const slotW = keyholeRadius * 0.8;
  const slotH = bodyH * 0.25;
  gfx.rect(
    keyholeX - slotW / 2,
    keyholeY,
    slotW,
    slotH,
  ).fill(COLORS.DEEP_SPACE);

  container.addChild(gfx);
  return container;
}
