import { Container } from 'pixi.js';

export abstract class Scene {
  public root: Container;

  constructor() {
    this.root = new Container();
  }

  abstract enter(data?: unknown): void;
  abstract update(dt: number): void;
  abstract exit(): void;
}
