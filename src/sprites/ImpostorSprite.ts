import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const IMPOSTOR_COLOR = 0x8b0000; // Darker red
const BODY_TINT = 0x6a0d0d; // Even darker for sinister feel

/**
 * Creates a procedurally-drawn impostor character.
 * Same body shape as the crewmate but darker, with a jagged mouth
 * drawn over the lower visor area.
 */
export function createImpostorSprite(): Container {
  const container = new Container();
  const gfx = new Graphics();

  // Backpack (behind body)
  gfx.rect(0, 6, 4, 10).fill(darken(IMPOSTOR_COLOR, 0.3));

  // Bean-shaped body (darker tint)
  gfx.roundRect(3, 0, 16, 20, 6).fill(BODY_TINT);

  // Visor base (same shape as crewmate)
  gfx.ellipse(13, 7, 6, 5).fill(COLORS.VISOR_CYAN);

  // Jagged mouth teeth (overlaid on bottom half of visor)
  // Drawn as triangular zigzag shapes
  const mouthGfx = new Graphics();
  mouthGfx.moveTo(7, 8);
  mouthGfx.lineTo(9, 11);
  mouthGfx.lineTo(11, 8);
  mouthGfx.lineTo(13, 12);
  mouthGfx.lineTo(15, 8);
  mouthGfx.lineTo(17, 11);
  mouthGfx.lineTo(19, 8);
  mouthGfx.lineTo(19, 12);
  mouthGfx.lineTo(7, 12);
  mouthGfx.closePath();
  mouthGfx.fill(0x220000);

  // Top teeth (mirrored, smaller)
  const topTeeth = new Graphics();
  topTeeth.moveTo(7, 8);
  topTeeth.lineTo(9, 5);
  topTeeth.lineTo(11, 8);
  topTeeth.lineTo(13, 4);
  topTeeth.lineTo(15, 8);
  topTeeth.lineTo(17, 5);
  topTeeth.lineTo(19, 8);
  topTeeth.lineTo(19, 4);
  topTeeth.lineTo(7, 4);
  topTeeth.closePath();
  topTeeth.fill(0x220000);

  // Left leg
  gfx.rect(5, 19, 5, 4).fill(BODY_TINT);

  // Right leg
  gfx.rect(12, 19, 5, 4).fill(BODY_TINT);

  // Gap between legs
  gfx.rect(10, 20, 2, 3).fill(0x000000);

  container.addChild(gfx);
  container.addChild(topTeeth);
  container.addChild(mouthGfx);
  return container;
}

/** Darkens a hex color by a factor (0..1). */
function darken(hex: number, amount: number): number {
  const r = Math.round(((hex >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((hex >> 8) & 0xff) * (1 - amount));
  const b = Math.round((hex & 0xff) * (1 - amount));
  return (r << 16) | (g << 8) | b;
}
