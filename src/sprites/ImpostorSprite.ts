import { Graphics } from 'pixi.js';
import { COLORS } from '@/constants';
import { darken } from '@/utils';

const IMPOSTOR_COLOR = 0x8b0000; // Darker red
const BODY_TINT = 0x6a0d0d; // Even darker for sinister feel

/**
 * Creates a procedurally-drawn impostor character.
 * Same body shape as the crewmate but darker, with a jagged mouth
 * drawn over the lower visor area. Single Graphics object for fewer draw calls.
 */
export function createImpostorSprite(): Graphics {
  const gfx = new Graphics();

  // Backpack (behind body)
  gfx.rect(0, 6, 4, 10).fill(darken(IMPOSTOR_COLOR, 0.3));

  // Bean-shaped body (darker tint)
  gfx.roundRect(3, 0, 16, 20, 6).fill(BODY_TINT);

  // Visor base (same shape as crewmate)
  gfx.ellipse(13, 7, 6, 5).fill(COLORS.VISOR_CYAN);

  // Top teeth (drawn first so bottom teeth overlap correctly)
  gfx.moveTo(7, 8);
  gfx.lineTo(9, 5);
  gfx.lineTo(11, 8);
  gfx.lineTo(13, 4);
  gfx.lineTo(15, 8);
  gfx.lineTo(17, 5);
  gfx.lineTo(19, 8);
  gfx.lineTo(19, 4);
  gfx.lineTo(7, 4);
  gfx.closePath();
  gfx.fill(0x220000);

  // Jagged mouth teeth (overlaid on bottom half of visor)
  gfx.moveTo(7, 8);
  gfx.lineTo(9, 11);
  gfx.lineTo(11, 8);
  gfx.lineTo(13, 12);
  gfx.lineTo(15, 8);
  gfx.lineTo(17, 11);
  gfx.lineTo(19, 8);
  gfx.lineTo(19, 12);
  gfx.lineTo(7, 12);
  gfx.closePath();
  gfx.fill(0x220000);

  // Left leg
  gfx.rect(5, 19, 5, 4).fill(BODY_TINT);

  // Right leg
  gfx.rect(12, 19, 5, 4).fill(BODY_TINT);

  // Gap between legs
  gfx.rect(10, 20, 2, 3).fill(0x000000);

  return gfx;
}
