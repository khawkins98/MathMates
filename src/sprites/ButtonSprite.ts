import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '@/constants';

const CORNER_RADIUS = 6;

/**
 * Reusable interactive button with hover/press feedback.
 */
export class ButtonSprite extends Container {
  private bg: Graphics;
  private labelText: Text;
  private bgColor: number;
  private btnWidth: number;
  private btnHeight: number;

  /** Callback invoked on click/tap. */
  public onClick: (() => void) | null = null;

  constructor(
    labelText: string,
    width: number,
    height: number,
    bgColor: number = COLORS.HULL_GREY,
  ) {
    super();

    this.btnWidth = width;
    this.btnHeight = height;
    this.bgColor = bgColor;

    // Background
    this.bg = new Graphics();
    this.drawBg(bgColor);
    this.addChild(this.bg);

    // Label
    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
      align: 'center',
    });
    this.labelText = new Text({ text: labelText, style });
    this.labelText.anchor.set(0.5);
    this.labelText.x = width / 2;
    this.labelText.y = height / 2;
    this.addChild(this.labelText);

    // Interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Hit area covers the full button rect
    this.hitArea = { contains: (x: number, y: number) => {
      return x >= 0 && x <= width && y >= 0 && y <= height;
    }};

    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
    this.on('pointerupoutside', this.onPointerOut, this);
  }

  /** Updates the button label text. */
  setLabel(text: string): void {
    this.labelText.text = text;
  }

  private drawBg(color: number): void {
    this.bg.clear();
    this.bg
      .roundRect(0, 0, this.btnWidth, this.btnHeight, CORNER_RADIUS)
      .fill(color);
  }

  private onPointerOver(): void {
    // Slight brightness increase
    this.drawBg(brighten(this.bgColor, 0.15));
  }

  private onPointerOut(): void {
    this.drawBg(this.bgColor);
    this.scale.set(1);
  }

  private onPointerDown(): void {
    this.scale.set(0.95);
  }

  private onPointerUp(): void {
    this.scale.set(1);
    this.drawBg(brighten(this.bgColor, 0.15));
    this.onClick?.();
  }
}

/** Brightens a hex color by a factor (0..1). */
function brighten(hex: number, amount: number): number {
  let r = (hex >> 16) & 0xff;
  let g = (hex >> 8) & 0xff;
  let b = hex & 0xff;

  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));

  return (r << 16) | (g << 8) | b;
}
