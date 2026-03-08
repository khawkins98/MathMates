import { Container } from 'pixi.js';

export abstract class Scene {
  public root: Container;

  constructor() {
    this.root = new Container();
  }

  /** Remove and destroy all children to free GPU geometry and textures. */
  protected destroyChildren(): void {
    const removed = this.root.removeChildren();
    for (const child of removed) {
      child.destroy({ children: true });
    }
  }

  abstract enter(data?: unknown): void;
  abstract update(dt: number): void;
  abstract exit(): void;
}
