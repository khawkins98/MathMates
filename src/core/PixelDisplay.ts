/**
 * PixelDisplay — viewport scaling + optional low-resolution pixel rendering.
 *
 * Usage in main.ts:
 *   const display = new PixelDisplay(app, { logicalWidth: 520, logicalHeight: 380 });
 *   const manager = new SceneManager(app, display.gameContainer);
 *
 * Options:
 *   pixelScale: 2   → renders at 260×190, upscaled 2× with nearest-neighbor
 *                     sampling — every logical pixel becomes a 2×2 pixel block.
 *   integerScaling  → CSS scale snapped to integer multiples so every game pixel
 *                     maps to an identical N×N square of screen pixels.
 *                     Trades viewport fill for perfect pixel alignment.
 *
 * Both options are off by default (current behaviour preserved).
 */

import { Application, Container, Matrix, RenderTexture, Sprite } from 'pixi.js';
import { PixelateFilter } from 'pixi-filters';

export interface PixelDisplayOptions {
  logicalWidth: number;
  logicalHeight: number;
  /**
   * Downscale factor for the GPU render texture.
   * 1 (default) = full resolution. 2 = half-res (2×2 chunky pixel blocks).
   * Must divide both logicalWidth and logicalHeight exactly.
   */
  pixelScale?: number;
  /**
   * Snap CSS viewport scale to integer multiples so every game pixel maps to an
   * identical N×N block of screen pixels. Off by default.
   */
  integerScaling?: boolean;
  /**
   * Apply a PixelateFilter (from pixi-filters) as a post-processing pass.
   * Value is the pixel block size in screen pixels — 2 is subtle, 4 is chunky.
   * Renders at full resolution then snaps sampling to a grid; text stays sharp
   * before the filter is applied, unlike the pixelScale RenderTexture approach.
   * Leave undefined to disable (default).
   */
  filterSize?: number;
}

export class PixelDisplay {
  /**
   * The Container that all game scenes and overlays must render into.
   * Pass this to SceneManager instead of app.stage.
   */
  readonly gameContainer: Container;

  constructor(app: Application, opts: PixelDisplayOptions) {
    const { logicalWidth, logicalHeight, pixelScale = 1, integerScaling = false, filterSize } = opts;

    this.gameContainer = new Container();

    if (filterSize !== undefined) {
      this.gameContainer.filters = [new PixelateFilter(filterSize)];
    }

    if (pixelScale > 1) {
      this._setupLowResRender(app, logicalWidth, logicalHeight, pixelScale);
    } else {
      app.stage.addChild(this.gameContainer);
    }

    const canvas = app.canvas;
    canvas.style.imageRendering = 'pixelated';

    const resize = () => {
      const maxScale = Math.min(
        window.innerWidth / logicalWidth,
        window.innerHeight / logicalHeight,
      );
      const cssScale = integerScaling ? Math.max(1, Math.floor(maxScale)) : maxScale;
      canvas.style.width = `${Math.floor(logicalWidth * cssScale)}px`;
      canvas.style.height = `${Math.floor(logicalHeight * cssScale)}px`;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private _setupLowResRender(
    app: Application,
    w: number,
    h: number,
    scale: number,
  ): void {
    const texW = Math.floor(w / scale);
    const texH = Math.floor(h / scale);

    if (texW * scale !== w || texH * scale !== h) {
      console.warn(
        `PixelDisplay: pixelScale ${scale} does not divide ${w}×${h} exactly — ` +
          `texture will be ${texW}×${texH}. Consider using a divisor of both dimensions.`,
      );
    }

    const texture = RenderTexture.create({ width: texW, height: texH });
    texture.source.scaleMode = 'nearest';

    const displaySprite = new Sprite(texture);
    // Scale the sprite to fill the full logical canvas.
    // Use separate x/y scale to tolerate imperfect division.
    displaySprite.scale.set(w / texW, h / texH);
    app.stage.addChild(displaySprite);

    // Pre-built down-scale matrix — avoids allocating one per frame.
    const downMatrix = new Matrix().scale(1 / scale, 1 / scale);

    // Render the game container to the low-res texture.
    // Priority -1 sits between scene updates (NORMAL = 0) and PixiJS's default
    // auto-render (LOW = -25), so the texture is always fresh for that frame.
    app.ticker.add(
      () => {
        app.renderer.render({
          container: this.gameContainer,
          target: texture,
          transform: downMatrix,
          clear: true,
        });
      },
      null,
      -1,
    );
    // PixiJS auto-render (at LOW = -25) then draws app.stage — which contains
    // displaySprite — to the screen.  No manual override needed.
  }
}
