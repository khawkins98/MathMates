import { Container, Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, TRANSITION_DURATION } from '@/constants';

export class TransitionOverlay {
  public root: Container;
  public isActive = false;
  private overlay: Graphics;
  private alpha = 0;
  private fadeDirection: 'in' | 'out' | null = null;
  private elapsed = 0;
  private resolve: (() => void) | null = null;

  constructor() {
    this.root = new Container();
    this.root.zIndex = 9999;
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0x000000);
    this.overlay.alpha = 0;
    this.root.addChild(this.overlay);
  }

  fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.isActive = true;
      this.fadeDirection = 'out';
      this.elapsed = 0;
      this.alpha = 0;
      this.resolve = resolve;
    });
  }

  fadeIn(): Promise<void> {
    return new Promise((resolve) => {
      this.fadeDirection = 'in';
      this.elapsed = 0;
      this.alpha = 1;
      this.resolve = resolve;
    });
  }

  update(dt: number): void {
    if (!this.fadeDirection) return;

    this.elapsed += dt;
    const half = TRANSITION_DURATION / 2;
    const progress = Math.min(this.elapsed / half, 1);

    if (this.fadeDirection === 'out') {
      this.alpha = progress;
    } else {
      this.alpha = 1 - progress;
    }

    this.overlay.alpha = this.alpha;

    if (progress >= 1) {
      const dir = this.fadeDirection;
      this.fadeDirection = null;
      if (dir === 'in') {
        this.isActive = false;
      }
      this.resolve?.();
      this.resolve = null;
    }
  }
}
