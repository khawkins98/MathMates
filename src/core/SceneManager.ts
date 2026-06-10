import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import type { Scene, SceneName } from '@/types';
import { InputManager } from './InputManager';

const DOOR_CLOSE_MS = 180;
const DOOR_OPEN_MS = 220;

interface DoorTransition {
  phase: 'closing' | 'opening';
  elapsed: number;
  pendingScene: SceneName | null;
  pendingParams?: Record<string, unknown>;
}

export class SceneManager {
  private scenes = new Map<SceneName, Scene>();
  private current: Scene | null = null;
  private currentName: SceneName | null = null;
  private transition: DoorTransition | null = null;
  readonly input: InputManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = new InputManager(canvas);
  }

  register(name: SceneName, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  goto(name: SceneName, params?: Record<string, unknown>): void {
    // First scene (boot): switch instantly, no doors
    if (!this.current) {
      this.switchTo(name, params);
      return;
    }
    if (this.transition) {
      // Retarget mid-transition rather than queueing a second one
      this.transition.pendingScene = name;
      this.transition.pendingParams = params;
      return;
    }
    this.transition = { phase: 'closing', elapsed: 0, pendingScene: name, pendingParams: params };
    this.input.clear();
  }

  private switchTo(name: SceneName, params?: Record<string, unknown>): void {
    if (this.current) {
      this.current.exit();
    }
    this.input.clear();
    const next = this.scenes.get(name);
    if (!next) {
      throw new Error(`Scene not found: ${name}`);
    }
    this.current = next;
    this.currentName = name;
    this.current.enter(params);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  update(dt: number): void {
    if (this.transition) {
      this.transition.elapsed += dt;
      if (this.transition.phase === 'closing' && this.transition.elapsed >= DOOR_CLOSE_MS) {
        if (this.transition.pendingScene) {
          this.switchTo(this.transition.pendingScene, this.transition.pendingParams);
        }
        this.transition.phase = 'opening';
        this.transition.elapsed = 0;
        this.transition.pendingScene = null;
      } else if (this.transition.phase === 'opening' && this.transition.elapsed >= DOOR_OPEN_MS) {
        this.transition = null;
      }
      // The world holds still while the airlock cycles
      return;
    }
    this.current?.update(dt);
  }

  draw(): void {
    if (this.current) {
      this.current.draw(this.ctx);
    }
    if (this.transition) {
      this.drawDoors(this.ctx);
    }
  }

  /** Chunky airlock doors sliding shut/open between scenes — every navigation says "ship". */
  private drawDoors(ctx: CanvasRenderingContext2D): void {
    if (!this.transition) {
      return;
    }
    const { phase, elapsed } = this.transition;
    const duration = phase === 'closing' ? DOOR_CLOSE_MS : DOOR_OPEN_MS;
    const raw = Math.min(1, elapsed / duration);
    // Ease-out; covered = how much of each half-screen the door occupies
    const eased = 1 - (1 - raw) * (1 - raw);
    const covered = phase === 'closing' ? eased : 1 - eased;
    const half = (CANVAS_WIDTH / 2) * covered;

    ctx.save();
    for (const [x, w, edgeX] of [
      [0, half, half],
      [CANVAS_WIDTH - half, half, CANVAS_WIDTH - half],
    ] as Array<[number, number, number]>) {
      if (w <= 0) {
        continue;
      }
      ctx.fillStyle = '#15282c';
      ctx.fillRect(x, 0, w, CANVAS_HEIGHT);
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(edgeX, 0);
      ctx.lineTo(edgeX, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.strokeStyle = '#2a4848';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(edgeX + (x === 0 ? -10 : 10), 0);
      ctx.lineTo(edgeX + (x === 0 ? -10 : 10), CANVAS_HEIGHT);
      ctx.stroke();
      // Door bolts
      ctx.fillStyle = '#3a5858';
      for (let i = 0; i < 4; i += 1) {
        const by = 50 + i * 110;
        const bx = x === 0 ? Math.max(14, edgeX - 26) : Math.min(CANVAS_WIDTH - 14, edgeX + 26);
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  getCurrentName(): SceneName | null {
    return this.currentName;
  }
}
