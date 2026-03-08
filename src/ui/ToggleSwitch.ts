import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const TRACK_WIDTH = 40;
const TRACK_HEIGHT = 20;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const KNOB_RADIUS = 8;
const KNOB_PADDING = 2;
const KNOB_LEFT_X = TRACK_RADIUS;
const KNOB_RIGHT_X = TRACK_WIDTH - TRACK_RADIUS;
const KNOB_CENTER_Y = TRACK_HEIGHT / 2;

/**
 * ON/OFF toggle switch for settings screens.
 * Rounded rect track with a sliding circle knob.
 * ON: Success Green track, knob right.
 * OFF: Hull Grey track, knob left.
 */
export class ToggleSwitch extends Container {
  private track: Graphics;
  private knob: Graphics;
  private _value: boolean;

  /** Callback invoked when the toggle state changes. */
  public onChange: ((value: boolean) => void) | null = null;

  constructor(initialValue = false) {
    super();

    this._value = initialValue;

    // Track
    this.track = new Graphics();
    this.addChild(this.track);

    // Knob
    this.knob = new Graphics();
    this.addChild(this.knob);

    this.draw();

    // Interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= TRACK_WIDTH && y >= 0 && y <= TRACK_HEIGHT,
    };

    this.on('pointerdown', this.toggle, this);
  }

  get value(): boolean {
    return this._value;
  }

  setValue(v: boolean): void {
    if (this._value === v) return;
    this._value = v;
    this.draw();
  }

  private toggle(): void {
    this._value = !this._value;
    this.draw();
    this.onChange?.(this._value);
  }

  private draw(): void {
    const trackColor = this._value ? COLORS.SUCCESS_GREEN : COLORS.HULL_GREY;
    const knobX = this._value ? KNOB_RIGHT_X : KNOB_LEFT_X;

    // Track
    this.track.clear();
    this.track
      .roundRect(0, 0, TRACK_WIDTH, TRACK_HEIGHT, TRACK_RADIUS)
      .fill(trackColor);

    // Knob
    this.knob.clear();
    this.knob
      .circle(knobX, KNOB_CENTER_Y, KNOB_RADIUS - KNOB_PADDING)
      .fill(COLORS.STAR_WHITE);
  }
}
