export class GameLoop {
  private lastTime = 0;
  private running = false;
  private readonly onTick: (dt: number) => void;
  private readonly MAX_DT = 100;

  constructor(onTick: (dt: number) => void) {
    this.onTick = onTick;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  private tick(now: number): void {
    if (!this.running) {
      return;
    }
    const dt = Math.min(now - this.lastTime, this.MAX_DT);
    this.lastTime = now;
    this.onTick(dt);
    requestAnimationFrame((t) => this.tick(t));
  }

  stop(): void {
    this.running = false;
  }
}
