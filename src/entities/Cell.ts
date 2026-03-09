import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CellState } from '../types';
import { CELL_SIZE, COLORS } from '../constants';

const CORNER_RADIUS = 6;
const BORDER_WIDTH = 2;
const FLASH_DURATION = 300; // ms

const textStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 16,
  fontWeight: 'bold',
  fill: COLORS.STAR_WHITE,
  align: 'center',
});

export class Cell extends Container {
  private bg: Graphics;
  private valueText: Text;
  private susMarker: Graphics;
  private _state: CellState = 'normal';
  private _value: number | string = '';
  private _sus = false;
  private flashTimer = 0;
  private flashType: 'correct' | 'error' | null = null;

  constructor() {
    super();

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.valueText = new Text({ text: '', style: textStyle });
    this.valueText.anchor.set(0.5);
    this.valueText.x = CELL_SIZE / 2;
    this.valueText.y = CELL_SIZE / 2 - 6;
    this.addChild(this.valueText);

    // Sus marker - small thumbs-down in top-right corner
    this.susMarker = new Graphics();
    this.susMarker.visible = false;
    this.drawSusMarker();
    this.addChild(this.susMarker);

    this.drawCell();
  }

  get state(): CellState {
    return this._state;
  }

  get value(): number | string {
    return this._value;
  }

  get sus(): boolean {
    return this._sus;
  }

  toggleSus(): void {
    this._sus = !this._sus;
    this.susMarker.visible = this._sus;
  }

  clearSus(): void {
    this._sus = false;
    this.susMarker.visible = false;
  }

  setValue(v: number | string): void {
    this._value = v;
    this.valueText.text = String(v);
  }

  setState(state: CellState): void {
    this._state = state;
    this.drawCell();

    if (state === 'consumed') {
      this.alpha = 0.2;
      this.clearSus();
    } else {
      this.alpha = 1;
    }
  }

  flash(type: 'correct' | 'error'): void {
    this.flashType = type;
    this.flashTimer = FLASH_DURATION;
    this._state = type === 'correct' ? 'correct_flash' : 'error_flash';
    this.drawCell();
  }

  update(dt: number): void {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;

      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        this.flashType = null;

        if (this._state === 'correct_flash') {
          this.setState('consumed');
        } else if (this._state === 'error_flash') {
          // Mark wrong cells as consumed so they can't be re-eaten
          this.setState('consumed');
        }
      } else {
        // Animate fade: interpolate fill from flash color back to normal
        const progress = 1 - this.flashTimer / FLASH_DURATION;
        this.drawFlash(progress);
      }
    }
  }

  private drawSusMarker(): void {
    const g = this.susMarker;
    g.clear();
    // Thumbs-down icon in top-right corner of cell
    const cx = CELL_SIZE - 12;
    const cy = 12;
    // Hand/fist circle
    g.circle(cx, cy, 5).fill(COLORS.CREW_RED);
    // Thumb pointing down
    g.rect(cx - 1.5, cy + 4, 3, 5).fill(COLORS.CREW_RED);
  }

  private drawCell(): void {
    const g = this.bg;
    g.clear();

    let fillColor: number;
    let borderColor: number;

    switch (this._state) {
      case 'highlighted':
        fillColor = COLORS.DEEP_SPACE;
        borderColor = COLORS.VISOR_CYAN;
        break;
      case 'correct_flash':
        fillColor = COLORS.SUCCESS_GREEN;
        borderColor = COLORS.SUCCESS_GREEN;
        break;
      case 'error_flash':
        fillColor = COLORS.CREW_RED;
        borderColor = COLORS.CREW_RED;
        break;
      case 'consumed':
        fillColor = COLORS.DEEP_SPACE;
        borderColor = COLORS.HULL_GREY;
        break;
      case 'normal':
      default:
        fillColor = COLORS.DEEP_SPACE;
        borderColor = COLORS.HULL_GREY;
        break;
    }

    // Border
    g.roundRect(0, 0, CELL_SIZE, CELL_SIZE, CORNER_RADIUS);
    g.fill({ color: borderColor });

    // Inner fill
    g.roundRect(
      BORDER_WIDTH,
      BORDER_WIDTH,
      CELL_SIZE - BORDER_WIDTH * 2,
      CELL_SIZE - BORDER_WIDTH * 2,
      CORNER_RADIUS - 1,
    );
    g.fill({ color: fillColor });
  }

  private drawFlash(progress: number): void {
    const g = this.bg;
    g.clear();

    const flashColor =
      this.flashType === 'correct' ? COLORS.SUCCESS_GREEN : COLORS.CREW_RED;

    const fillColor = lerpColor(flashColor, COLORS.DEEP_SPACE, progress);
    const borderColor = lerpColor(flashColor, COLORS.HULL_GREY, progress);

    g.roundRect(0, 0, CELL_SIZE, CELL_SIZE, CORNER_RADIUS);
    g.fill({ color: borderColor });

    g.roundRect(
      BORDER_WIDTH,
      BORDER_WIDTH,
      CELL_SIZE - BORDER_WIDTH * 2,
      CELL_SIZE - BORDER_WIDTH * 2,
      CORNER_RADIUS - 1,
    );
    g.fill({ color: fillColor });
  }
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;

  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);

  return (r << 16) | (g << 8) | bl;
}
