import { Container, Graphics } from 'pixi.js';
import { darken } from '@/utils';

// Pixel art palette indices — used in BODY_ART grid only
const T = 0;  // transparent (skip draw)
const K = 1;  // outline  (#111111)
const B = 2;  // body     (crew colour, tintable)
const D = 3;  // shadow   (darkened body — backpack / left side)
const V = 4;  // visor    (cyan)
const G = 5;  // glass    (near-white visor highlight)

/**
 * 14×10 static body art.  Legs are drawn procedurally so they can animate.
 *
 * Character faces RIGHT; backpack is the D/K bump on the left (cols 0–1, rows 3–7).
 * The dome widens at rows 3–4 (full 14 px) then tapers to 11 px at the base (row 8).
 */
const BODY_ART = [
  //  0  1  2  3  4  5  6  7  8  9 10 11 12 13
  [T, T, T, K, K, K, K, K, K, K, K, T, T, T],  // 0  dome top
  [T, T, K, B, B, B, B, B, B, B, B, K, T, T],  // 1  dome
  [T, K, K, B, B, V, V, V, B, B, B, B, K, T],  // 2  visor (3 px)
  [K, D, K, B, B, V, G, V, V, B, B, B, B, K],  // 3  visor highlight + backpack
  [K, D, K, B, B, V, V, V, V, B, B, B, B, K],  // 4  visor mid (4 px wide)
  [K, D, K, B, B, B, V, V, B, B, B, B, K, T],  // 5  visor bottom
  [K, D, K, B, B, B, B, B, B, B, B, B, K, T],  // 6  body
  [K, D, K, B, B, B, B, B, B, B, B, K, T, T],  // 7  body narrows
  [T, K, K, B, B, B, B, B, B, B, K, T, T, T],  // 8  lower body
  [T, T, K, K, K, K, K, K, K, K, K, T, T, T],  // 9  bottom outline
] as const;

/** Art canvas dimensions (1 unit = 1 art pixel).  Scale the container for display size. */
export const PIXEL_ART_W = 14;
/** Body (10 rows) + legs (3 rows). */
export const PIXEL_ART_H = 13;

const OUTLINE_COLOR = 0x111111;
const VISOR_CYAN    = 0x00d9ff;
const VISOR_GLASS   = 0xdfffff;

const LEGS_Y     = 10;  // Y coordinate where legs start (row after body outline)
const LEG_LEFT_X = 3;   // cols 3–6
const LEG_RIGHT_X = 8;  // cols 8–11

/**
 * Pixel-art crewmate rendered entirely via PixiJS Graphics rectangles.
 *
 * At scale 1 the container is PIXEL_ART_W × PIXEL_ART_H (14 × 13) units.
 * Scale the outer container to reach your target display size — vector-drawn
 * pixels stay crispy at any integer or fractional scale.
 *
 * ### Animation
 * Call `update(dt)` each frame to drive:
 * - Walk-cycle leg animation (enabled via `setWalking(true)`)
 * - Pop/bounce effect (triggered via `pop()`)
 *
 * The container's `x/y` position and idle bob are the caller's responsibility
 * (matching the pattern already used by `Player.update()` and `TitleScene`).
 *
 * ### 3-D perspective lean
 * `setLean(amount)` applies a horizontal skew that simulates perspective tilt,
 * giving a sense of depth/direction without a real 3-D renderer.
 */
export class PixelCrewmate extends Container {
  readonly crewColor: number;
  private readonly darkColor: number;

  /** Inner container: horizontal flip lives here so outer pivot/scale are unaffected. */
  private readonly flipContainer: Container;
  private readonly bodyGfx: Graphics;
  private readonly legGfx: Graphics;

  private _elapsed    = 0;
  private _walking    = false;
  private _popT       = -1;   // -1 = inactive
  private _baseScale  = 1;    // scale at the moment pop() was first triggered
  private _facingLeft = false;

  constructor(color: number = 0xc51111) {
    super();
    this.crewColor = color;
    this.darkColor = darken(color, 0.25);

    this.flipContainer = new Container();
    this.addChild(this.flipContainer);

    this.bodyGfx = new Graphics();
    this.legGfx  = new Graphics();
    this.flipContainer.addChild(this.bodyGfx);
    this.flipContainer.addChild(this.legGfx);

    this._drawBody();
    this._drawLegs(0, 0);
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Advance all animations.
   * @param dt  Delta time in milliseconds.
   */
  update(dt: number): void {
    this._elapsed += dt;

    if (this._walking) {
      const phase = this._elapsed * 0.007;  // ≈ 1.1 full cycles / second
      this._drawLegs(
        Math.sin(phase) * 1.8,
        Math.sin(phase + Math.PI) * 1.8,
      );
    }

    if (this._popT >= 0) {
      this._popT += dt;
      const dur = 450;
      if (this._popT < dur) {
        const t = this._popT / dur;
        // Spring: scale up to 1.4× base then settle back to base
        const s = 1 + 0.4 * Math.sin(t * Math.PI) * (1 - t * 0.6);
        this.scale.set(this._baseScale * s);
      } else {
        this._popT = -1;
        this.scale.set(this._baseScale);
      }
    }
  }

  /** Enable/disable walk-cycle leg animation. */
  setWalking(on: boolean): void {
    this._walking = on;
    if (!on) {
      this._drawLegs(0, 0);
    }
  }

  /**
   * Simulate perspective depth by skewing on the X axis.
   * @param amount  −1 (lean left) to +1 (lean right)
   */
  setLean(amount: number): void {
    this.skew.x = amount * 0.18;
  }

  /**
   * Mirror the crewmate horizontally so it faces left.
   * Pivot is adjusted on the inner flip container so the outer container's
   * pivot (set by the scene for positioning) is not affected.
   */
  setFacingLeft(left: boolean): void {
    this._facingLeft = left;
    this.flipContainer.scale.x  = left ? -1 : 1;
    this.flipContainer.pivot.x  = left ? PIXEL_ART_W : 0;
  }

  /** Trigger a scale-bounce pop (e.g. correct-answer celebration). */
  pop(): void {
    if (this._popT < 0) {
      // Capture the caller's base scale only when not already mid-animation,
      // so retriggering doesn't corrupt the permanent resting scale.
      this._baseScale = this.scale.x;
    }
    this._popT = 0;
  }

  // ─── Private drawing ─────────────────────────────────────────────────────

  private _drawBody(): void {
    const gfx = this.bodyGfx;
    gfx.clear();

    for (let row = 0; row < BODY_ART.length; row++) {
      const rowData = BODY_ART[row];
      for (let col = 0; col < PIXEL_ART_W; col++) {
        const px = rowData[col];
        if (px === T) continue;
        gfx.rect(col, row, 1, 1).fill(this._colorFor(px));
      }
    }
  }

  /**
   * Redraws the legs with per-leg Y offsets for the walk cycle.
   * Each leg is a 4×3 outline box with a 2×2 coloured fill inside.
   * @param leftOff   Y pixel offset for the left leg  (−1.8 … +1.8)
   * @param rightOff  Y pixel offset for the right leg (−1.8 … +1.8)
   */
  private _drawLegs(leftOff: number, rightOff: number): void {
    const gfx = this.legGfx;
    const o   = OUTLINE_COLOR;
    const d   = this.darkColor;
    gfx.clear();

    // Snap to integer rows for pixel-crisp rendering
    const ly = Math.round(LEGS_Y + leftOff);
    const ry = Math.round(LEGS_Y + rightOff);

    // Left leg (cols 3–6)
    gfx.rect(LEG_LEFT_X,     ly, 4, 3).fill(o);   // outline box
    gfx.rect(LEG_LEFT_X + 1, ly, 2, 2).fill(d);   // inner fill (top 2 rows)

    // Right leg (cols 8–11)
    gfx.rect(LEG_RIGHT_X,     ry, 4, 3).fill(o);
    gfx.rect(LEG_RIGHT_X + 1, ry, 2, 2).fill(d);
  }

  private _colorFor(px: number): number {
    switch (px) {
      case K: return OUTLINE_COLOR;
      case B: return this.crewColor;
      case D: return this.darkColor;
      case V: return VISOR_CYAN;
      case G: return VISOR_GLASS;
      default: return 0xff00ff;  // debug magenta — should never appear
    }
  }
}
