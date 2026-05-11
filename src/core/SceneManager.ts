import type { Scene, SceneName } from '@/types';
import { InputManager } from './InputManager';

export class SceneManager {
  private scenes = new Map<SceneName, Scene>();
  private current: Scene | null = null;
  private currentName: SceneName | null = null;
  readonly input: InputManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = new InputManager();
  }

  register(name: SceneName, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  goto(name: SceneName, params?: Record<string, unknown>): void {
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

  update(dt: number): void {
    this.current?.update(dt);
  }

  draw(): void {
    if (this.current) {
      this.current.draw(this.ctx);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getCtx(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCurrentName(): SceneName | null {
    return this.currentName;
  }
}
