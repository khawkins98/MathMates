import { Easing, type EasingFn } from './Easing';

interface Tween {
  target: Record<string, number>;
  property: string;
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  easing: EasingFn;
  onComplete?: () => void;
}

export class AnimationSystem {
  private tweens: Tween[] = [];

  animate(
    target: Record<string, number>,
    property: string,
    from: number,
    to: number,
    duration: number,
    easing: EasingFn = Easing.linear,
    onComplete?: () => void,
  ): void {
    target[property] = from;
    this.tweens.push({ target, property, from, to, duration, elapsed: 0, easing, onComplete });
  }

  update(dt: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const t = this.tweens[i];
      t.elapsed += dt;
      const progress = Math.min(t.elapsed / t.duration, 1);
      const eased = t.easing(progress);
      t.target[t.property] = t.from + (t.to - t.from) * eased;
      if (progress >= 1) {
        t.target[t.property] = t.to;
        this.tweens.splice(i, 1);
        t.onComplete?.();
      }
    }
  }

  clear(): void {
    this.tweens.length = 0;
  }

  get active(): boolean {
    return this.tweens.length > 0;
  }
}
