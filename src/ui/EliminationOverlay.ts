import { Container, Graphics } from 'pixi.js';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ELIMINATION_DURATION } from '@/constants';
import { createImpostorSprite } from '@/sprites/ImpostorSprite';
import { Easing } from '@/core/Easing';

/** Duration breakdown in ms. */
const FLASH_DURATION = 300;
const SHAKE_DURATION = 600;
const SPRITE_APPEAR_DURATION = 400;
const HOLD_DURATION = ELIMINATION_DURATION - FLASH_DURATION - SPRITE_APPEAR_DURATION;

/**
 * Full-screen overlay played when the player answers incorrectly.
 * Sequence (~1.5s total):
 *   1. Red screen flash (alpha 0.6 -> 0)
 *   2. Impostor sprite scale-bounces into center (0 -> 1.2 -> 1.0)
 *   3. Screen shake (container oscillation)
 *   4. Hold briefly, then resolve
 */
export class EliminationOverlay extends Container {
  private flash: Graphics;
  private impostorContainer: Container;
  private impostor: Container;
  private elapsed = 0;
  private playing = false;
  private resolve: (() => void) | null = null;
  private shakeTarget: Container | null = null;
  private shakeOriginX = 0;
  private shakeOriginY = 0;

  constructor() {
    super();
    this.visible = false;
    this.zIndex = 9000;

    // Red flash (full-screen rect)
    this.flash = new Graphics();
    this.flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(COLORS.CREW_RED);
    this.flash.alpha = 0;
    this.addChild(this.flash);

    // Impostor centered
    this.impostorContainer = new Container();
    this.impostorContainer.x = GAME_WIDTH / 2;
    this.impostorContainer.y = GAME_HEIGHT / 2;
    this.addChild(this.impostorContainer);

    this.impostor = createImpostorSprite();
    // Center the impostor around 0,0 for scaling pivot
    this.impostor.pivot.set(11, 12);
    this.impostor.scale.set(0);
    this.impostorContainer.addChild(this.impostor);
  }

  /**
   * Plays the elimination sequence.
   * Optionally accepts a parent container to apply screen shake to.
   */
  play(shakeTarget?: Container): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.shakeTarget = shakeTarget ?? null;
      this.shakeOriginX = shakeTarget?.x ?? 0;
      this.shakeOriginY = shakeTarget?.y ?? 0;
      this.elapsed = 0;
      this.playing = true;
      this.visible = true;
      this.flash.alpha = 0.6;
      this.impostor.scale.set(0);
    });
  }

  /**
   * Must be called each frame during the sequence.
   * @param dt - delta time in ms
   */
  update(dt: number): void {
    if (!this.playing) return;

    this.elapsed += dt;
    const t = this.elapsed;

    // Phase 1: Red flash (0 -> FLASH_DURATION)
    if (t <= FLASH_DURATION) {
      const progress = t / FLASH_DURATION;
      this.flash.alpha = 0.6 * (1 - progress);
    } else {
      this.flash.alpha = 0;
    }

    // Phase 2: Impostor scale-bounce (FLASH_DURATION -> FLASH_DURATION + SPRITE_APPEAR_DURATION)
    const spriteStart = FLASH_DURATION;
    const spriteEnd = spriteStart + SPRITE_APPEAR_DURATION;
    if (t >= spriteStart && t <= spriteEnd) {
      const progress = (t - spriteStart) / SPRITE_APPEAR_DURATION;
      // Scale: 0 -> 1.2 (first 70%) then 1.2 -> 1.0 (last 30%)
      let scale: number;
      if (progress < 0.7) {
        const p = progress / 0.7;
        scale = Easing.easeOutQuad(p) * 1.2;
      } else {
        const p = (progress - 0.7) / 0.3;
        scale = 1.2 - 0.2 * Easing.easeOutQuad(p);
      }
      this.impostor.scale.set(scale * 3); // scale up 3x for visibility
    } else if (t > spriteEnd) {
      this.impostor.scale.set(3);
    }

    // Phase 3: Screen shake (runs alongside phases 1-2)
    if (t <= SHAKE_DURATION && this.shakeTarget) {
      const progress = t / SHAKE_DURATION;
      const decay = 1 - progress;
      const intensity = 4 * decay;
      const freq = 0.05;
      this.shakeTarget.x = this.shakeOriginX + Math.sin(t * freq * Math.PI * 2) * intensity;
      this.shakeTarget.y = this.shakeOriginY + Math.cos(t * freq * Math.PI * 2 * 1.3) * intensity * 0.5;
    } else if (this.shakeTarget) {
      this.shakeTarget.x = this.shakeOriginX;
      this.shakeTarget.y = this.shakeOriginY;
    }

    // Sequence complete
    if (t >= ELIMINATION_DURATION) {
      this.playing = false;
      this.visible = false;
      this.flash.alpha = 0;
      this.impostor.scale.set(0);

      if (this.shakeTarget) {
        this.shakeTarget.x = this.shakeOriginX;
        this.shakeTarget.y = this.shakeOriginY;
        this.shakeTarget = null;
      }

      this.resolve?.();
      this.resolve = null;
    }
  }
}
