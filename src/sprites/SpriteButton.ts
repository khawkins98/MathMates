import { Container, Sprite, Texture } from 'pixi.js';

/**
 * Interactive button backed by PNG sprite textures — one per interaction state.
 * Designed for the Title Screen START button which uses the concept-art sprites.
 *
 * Pivot: origin is top-left (0,0). Set container pivot externally if you want
 * a centred anchor for pulsing effects, etc.
 */
export class SpriteButton extends Container {
  private _sprite: Sprite;
  private _texIdle: Texture;
  private _texHover: Texture;
  private _texPressed: Texture;

  /** Callback invoked on click/tap. */
  public onClick: (() => void) | null = null;

  /** Logical width of the button (matches displayWidth passed to constructor). */
  public readonly btnWidth: number;
  /** Logical height of the button (matches displayHeight passed to constructor). */
  public readonly btnHeight: number;

  constructor(
    texIdle: Texture,
    texHover: Texture,
    texPressed: Texture,
    displayWidth: number,
    displayHeight: number,
  ) {
    super();

    this._texIdle = texIdle;
    this._texHover = texHover;
    this._texPressed = texPressed;
    this.btnWidth = displayWidth;
    this.btnHeight = displayHeight;

    this._sprite = new Sprite(texIdle);
    this._sprite.width = displayWidth;
    this._sprite.height = displayHeight;
    this.addChild(this._sprite);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= displayWidth && y >= 0 && y <= displayHeight,
    };

    this.on('pointerover', this._onOver, this);
    this.on('pointerout', this._onOut, this);
    this.on('pointerdown', this._onDown, this);
    this.on('pointerup', this._onUp, this);
    this.on('pointerupoutside', this._onOut, this);
  }

  private _onOver(): void {
    this._sprite.texture = this._texHover;
  }

  private _onOut(): void {
    this._sprite.texture = this._texIdle;
    this.scale.set(1);
  }

  private _onDown(): void {
    this._sprite.texture = this._texPressed;
    this.scale.set(0.95);
  }

  private _onUp(): void {
    this._sprite.texture = this._texHover;
    this.scale.set(1);
    this.onClick?.();
  }
}
