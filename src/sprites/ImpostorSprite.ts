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

  // Visor — only upper portion visible as "eyes"
  gfx.ellipse(13, 6, 6, 4).fill(COLORS.VISOR_CYAN);
  // Visor shine
  gfx.ellipse(15, 4, 2, 1.5).fill(0x9fffff);

  // Dark mouth opening across lower visor area
  gfx.rect(8, 9, 11, 4).fill(0x220000);

  // Top teeth (pointing down into mouth)
  gfx.moveTo(8, 9);
  gfx.lineTo(10, 9);
  gfx.lineTo(10, 11);
  gfx.closePath();
  gfx.fill(0xdddddd);

  gfx.moveTo(12, 9);
  gfx.lineTo(14, 9);
  gfx.lineTo(13, 11);
  gfx.closePath();
  gfx.fill(0xdddddd);

  gfx.moveTo(16, 9);
  gfx.lineTo(18, 9);
  gfx.lineTo(17, 11);
  gfx.closePath();
  gfx.fill(0xdddddd);

  // Bottom teeth (pointing up into mouth)
  gfx.moveTo(9, 13);
  gfx.lineTo(11, 13);
  gfx.lineTo(10, 11);
  gfx.closePath();
  gfx.fill(0xdddddd);

  gfx.moveTo(13, 13);
  gfx.lineTo(15, 13);
  gfx.lineTo(14, 11);
  gfx.closePath();
  gfx.fill(0xdddddd);

  // Left leg
  gfx.rect(5, 19, 5, 4).fill(BODY_TINT);

  // Right leg
  gfx.rect(12, 19, 5, 4).fill(BODY_TINT);

  // Gap between legs
  gfx.rect(10, 20, 2, 3).fill(0x000000);

  return gfx;
}
